import { Injectable } from '@angular/core'
import { catchError, map, Observable, throwError } from 'rxjs'
import { ajax, AjaxResponse } from 'rxjs/ajax'
import { ConfigService } from '../config/core/config.service'

@Injectable()
export class ElasticSearchService {

  private searchApiPath = '/search/elastic/'
  private termApiPath = '/search/mtermvector/'
  private indices = []
  private apiEndpoint: string
  private machineName: string
  private source = [] as any;
  private aggregations: any = {}
  private suggestions: SuggestionsConfig = {}
  private fixedFilters?: object[]
  private textTypes = [];

  constructor(private config: ConfigService) {
    // Should fail if config is missing.
    try {
      this.apiEndpoint = this.config.getSettings('app.apiEndpoint');
      this.machineName = this.config.getSettings('app.machineName');
      this.indices = this.config.getSettings('ElasticSearch.indices');
      this.aggregations = this.config.getSettings('ElasticSearch.aggregations');
    } catch (e: any) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
      throw e
    }
    // Add fields that should always be returned in hits
    this.source = [
      'text_type',
      'text_title',
      'text_data',
      'doc_title',
      'collection_id',
      'publication_id',
      'publication_data',
      'orig_date_year',
      'orig_date_certain',
      'orig_date_sort'
    ];

    // Add additional fields that should be returned in hits from config file
    try {
      const configSourceFields = this.config.getSettings('ElasticSearch.source');
      if (configSourceFields !== undefined && configSourceFields.length > 0) {
        // Append additional fields to this.source if not already present
        for (let i = 0; i < configSourceFields.length; i++) {
          if (!this.source.includes(configSourceFields[i])) {
            this.source.push(configSourceFields[i]);
          }
        }
      }
    } catch (e) {
    }

    // Should not fail if config is missing.
    try {
      this.fixedFilters = this.config.getSettings('ElasticSearch.fixedFilters');
      this.textTypes = this.config.getSettings('ElasticSearch.types');
      this.suggestions = this.config.getSettings('ElasticSearch.suggestions');
    } catch (e: any) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
    }
  }

  executeTermQuery(terms: String[], ids: String[]): Observable<any> {
    const payload = {
      'ids' : ids,
      'parameters': {
        'fields': [
             'text_data'
          ],
          'term_statistics': false,
          'field_statistics' : false
      }
    }

    return ajax.post(this.getTermUrl() + '/' + terms, payload)
       .pipe(
        map(this.extractData),
        catchError(this.handleError),
       );
  }

  /**
   * Returns hits.
   */
  executeSearchQuery(options: any): Observable<any> {
    const payload = this.generateSearchQueryPayload(options)

    return ajax.post(this.getSearchUrl(), payload)
       .pipe(
        map(this.extractData),
        catchError(this.handleError),
       );
  }

  /**
   * Returns aggregations that are used for faceted search.
   */
  executeAggregationQuery(options: any): Observable<any> {
    const payload = this.generateAggregationQueryPayload(options)

    return ajax.post(this.getSearchUrl(), payload)
       .pipe(
        map(this.extractData),
        catchError(this.handleError),
       );
  }

  /**
   * Returns facet suggestions.
   */
  executeSuggestionsQuery(options: SuggestionsQuery): Observable<any> {
    const payload = this.generateSuggestionsQueryPayload(options)

    return ajax.post(this.getSearchUrl(), payload)
       .pipe(
        map(this.extractData),
        catchError(this.handleError),
       );
  }

  private generateSearchQueryPayload({ queries, highlight, from, size, range, facetGroups, sort }: SearchQuery): object {
    const payload: any = {
      from,
      size,
      _source: this.source,
      query: {
        function_score: {
          query: {
            bool: {
              must: []
            }
          },
          functions: [
            {
              filter: { term: { 'text_type': 'est' } },
              weight: 10
            },
            {
              filter: { term: { 'text_type': 'inl' } },
              weight: 8
            },
            {
              filter: { term: { 'text_type': 'com' } },
              weight: 2
            },
            {
              filter: { term: { 'text_type': 'ms' } },
              weight: 2
            }
          ],
          score_mode: 'sum',
        }
      },
      sort,
    }

    // Add free text query. Only matches the text data and publication name.
    queries.forEach(query => {
      if (query) {
        payload.query.function_score.query.bool.must.push({
          simple_query_string: {
            query,
            fields: ['text_data', 'text_title^5']
          }
        });
      }
    });

    // Include highlighted text matches to hits if a query is present.
    if (queries.some(query => !!query)) {
      payload.highlight = highlight
    }

    // Add date range filter.
    if (range) {
      payload.query.function_score.query.bool.must.push({
        range: {
          orig_date_sort: {
            gte: range.from,
            lte: range.to,
          }
        }
      });
    }

    // Add fixed filters that apply to all queries.
    if (this.fixedFilters) {
      this.fixedFilters.forEach(filter => {
        payload.query.function_score.query.bool.must.push(filter);
      });
    }

    // Add text type filter that applies to all queries.
    if (this.textTypes && Array.isArray(this.textTypes) && this.textTypes.length > 0) {
      payload.query.function_score.query.bool.must.push({ 'terms': { 'text_type': this.textTypes } });
    }

    if (facetGroups) {
      this.injectFacetsToPayload(payload, facetGroups);
    }

    // console.log('search payload', payload);

    return payload;
  }

  private generateAggregationQueryPayload({
    queries,
    range,
    facetGroups,
  }: AggregationQuery): object {
    const payload: any = {
      from: 0,
      size: 0,
      _source: this.source,
      query: {
        function_score: {
          query: {
            bool: {
              must: []
            }
          },
          functions: [
            {
              filter: { term: { 'text_type': 'est' } },
              weight: 6
            },
            {
              filter: { term: { 'text_type': 'inl' } },
              weight: 4
            },
            {
              filter: { term: { 'text_type': 'com' } },
              weight: 1
            },
            {
              filter: { term: { 'text_type': 'ms' } },
              weight: 1
            }
          ],
          score_mode: 'sum',
        }
      },
    }

    // Add free text query.
    queries.forEach(query => {
      if (query) {
        payload.query.function_score.query.bool.must.push({
          simple_query_string: {
            query,
            fields: ['text_data', 'text_title^5']
          }
        });
      }
    });

    // Add fixed filters that apply to all queries.
    if (this.fixedFilters) {
      this.fixedFilters.forEach(filter => {
        payload.query.function_score.query.bool.must.push(filter);
      });
    }

    // Add text type filter that applies to all queries.
    if (this.textTypes && Array.isArray(this.textTypes) && this.textTypes.length > 0) {
      payload.query.function_score.query.bool.must.push({ 'terms': { 'text_type': this.textTypes } });
    }

    if (facetGroups || range) {
      this.injectFilteredAggregationsToPayload(payload, facetGroups, range);
    } else {
      this.injectUnfilteredAggregationsToPayload(payload);
    }

    // console.log('aggregation payload', payload);

    return payload;
  }

  private generateSuggestionsQueryPayload({
    query,
  }: SuggestionsQuery): object {
    const payload: any = {
      from: 0,
      size: 0,
      _source: this.source,
      aggs: {},
    }

    for (const [aggregationKey, suggestion] of Object.entries(this.suggestions)) {
      const aggregation = this.aggregations[aggregationKey];
      if (aggregation.terms) {
        payload.aggs[aggregationKey] = {
          filter: {
            bool: {
              should: [
                {
                  wildcard: {
                    [suggestion.field]: {
                      value: `*${query}*`,
                    }
                  }
                },
                {
                  fuzzy: {
                    [suggestion.field]: {
                      value: query,
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            filtered: {
              terms: {
                field: aggregation.terms.field,
                size: suggestion.size,
              }
            }
          }
        }
      }
    }

    // console.log('suggestions payload', payload);

    return payload;
  }

  private injectFacetsToPayload(payload: any, facetGroups: FacetGroups) {
    Object.entries(facetGroups).forEach(([facetGroupKey, facets]: [string, Facets]) => {
      const terms = this.filterSelectedFacetKeys(facets);
      if (terms.length > 0) {
        payload.query.function_score.query.bool.filter = payload.query.function_score.query.bool.filter || []
        if (this.aggregations && facetGroupKey) {
          payload.query.function_score.query.bool.filter.push({
            terms: {
              [this.aggregations[facetGroupKey].terms.field]: terms,
            }
          });
        }
      }
    });
  }

  private filterSelectedFacetKeys(facets: Facets): string[] {
    return Object.values(facets).filter(facet => facet.selected).map((facet: any) => facet.key);
  }

  private injectUnfilteredAggregationsToPayload(payload: any) {
    payload.aggs = {}
    for (const [key, aggregation] of Object.entries(this.aggregations)) {
      payload.aggs[key] = aggregation;
    }
    return payload;
  }

  /**
   * Inspired by an article that uses an old version of elastic:
   * https://madewithlove.com/faceted-search-using-elasticsearch/
   *
   * Up to date documentation:
   * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filter-aggregation.html
   */
  private injectFilteredAggregationsToPayload(payload: any, facetGroups?: FacetGroups, range?: TimeRange) {
    payload.aggs = {}
    for (const [key, aggregation] of Object.entries(this.aggregations)) {
      const filteredAggregation = this.generateFilteredAggregation(key, aggregation, facetGroups, range);

      // If filtered aggregation doesn't have filters, then use an unfiltered aggregation.
      payload.aggs[key] = filteredAggregation || aggregation;
    }
    return payload;
  }

  private generateFilteredAggregation(
    aggregationKey: string,
    aggregation: any,
    facetGroups?: FacetGroups,
    range?: TimeRange
  ) {

    const filtered = {
      filter: {
        bool: {
          // Selected facets go here as filters.
          filter: [] as any
        }
      },
      aggs: {
        // Aggregation goes here.
        filtered: aggregation,
      }
    }

    // Add term filters.
    if (facetGroups) {
      Object.entries(facetGroups).forEach(([groupKey, facets]: [string, Facets]) => {
        // Don't filter itself.
        if (aggregationKey !== groupKey) {
          const selectedFacetKeys = this.filterSelectedFacetKeys(facets);
          if (selectedFacetKeys.length > 0) {
            filtered.filter.bool.filter.push({
              terms: {
                [this.getAggregationField(groupKey)]: selectedFacetKeys,
              }
            });
          }
        }
      });
    }

    // Add date range filter.
    if (range && !aggregation.date_histogram) {
      filtered.filter.bool.filter.push({
        range: {
          orig_date_sort: {
            gte: range.from,
            lte: range.to,
          }
        }
      });
    }

    if (filtered.filter.bool.filter.length > 0) {
      return filtered;
    } else {
      return null;
    }
  }

  isDateHistogramAggregation(aggregationKey: string): boolean {
    if (this.aggregations[aggregationKey] !== undefined) {
      return !!this.aggregations[aggregationKey]['date_histogram'];
    } else {
      return false;
    }
  }

  isTermsAggregation(aggregationKey: string): boolean {
    if (this.aggregations[aggregationKey] !== undefined) {
      return !!this.aggregations[aggregationKey]['terms'];
    } else {
      return false;
    }
  }

  getAggregationKeys(): string[] {
    return Object.keys(this.aggregations);
  }

  getAggregationField(key: string): string {
    const agg = this.aggregations[key];
    if (agg.terms || agg.date_histogram) {
      const foo = agg.terms || agg.date_histogram as any;
      return foo.field;
    }
    return ''
  }

  private getSearchUrl(): string {
    return this.apiEndpoint + '/' + this.machineName + this.searchApiPath + this.indices.join(',');
  }

  private getTermUrl(): string {
    return this.apiEndpoint + '/' + this.machineName + this.termApiPath + this.indices.join(',');
  }

  private extractData(res: AjaxResponse<unknown>) {
    return res.response;
  }

  private async handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = await error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error('Elastic search query failed.', error);
    return throwError(errMsg);
  }

}
