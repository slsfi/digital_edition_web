import { Injectable } from '@angular/core'
import { Http, Response } from '@angular/http'
import { Observable } from 'rxjs/Observable'
import { ConfigService } from '@ngx-config/core'


@Injectable()
export class ElasticSearchService {

  private searchApiPath = '/search/elastic/'
  private termApiPath = '/search/mtermvector/'
  private indices = []
  private apiEndpoint: string
  private machineName: string
  private source = []
  private aggregations: Aggregations = {}
  private suggestions: SuggestionsConfig = {}
  private fixedFilters: object[]

  constructor(private http: Http, private config: ConfigService) {
    // Should fail if config is missing.
    try {
      this.apiEndpoint = this.config.getSettings('app.apiEndpoint')
      this.machineName = this.config.getSettings('app.machineName')
      this.indices = this.config.getSettings('ElasticSearch.indices')
      this.aggregations = this.config.getSettings('ElasticSearch.aggregations')
      this.suggestions = this.config.getSettings('ElasticSearch.suggestions')
    } catch (e) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
      throw e
    }
    // Add fields that should always be returned in hits
    this.source = [
      "xml_type",
      "TitleIndexed",
      "publication_data",
      "publication_locations",
      "publication_subjects",
      "publication_tags",
      "publication_id",
      "path",
      "name",
      "collection_id",
      "collection_name",
      "orig_date_year",
      "orig_date_year_uncertain",
      "orig_date_certain"
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
      this.fixedFilters = this.config.getSettings('ElasticSearch.fixedFilters')
    } catch (e) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
    }
  }

  executeTermQuery(terms: String[], ids: String[]): Observable<any> {
    const payload = {
      'ids' : ids,
      'parameters': {
        'fields': [
             'textDataIndexed'
          ],
          'term_statistics': false,
          'field_statistics' : false
      }
    }

    return this.http.post(this.getTermUrl() + '/' + terms, payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  /**
   * Returns hits.
   */
  executeSearchQuery(options: SearchQuery): Observable<any> {
    const payload = this.generateSearchQueryPayload(options)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  /**
   * Returns aggregations that are used for faceted search.
   */
  executeAggregationQuery(options: AggregationQuery): Observable<any> {
    const payload = this.generateAggregationQueryPayload(options)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  /**
   * Returns facet suggestions.
   */
  executeSuggestionsQuery(options: SuggestionsQuery): Observable<any> {
    const payload = this.generateSuggestionsQueryPayload(options)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
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
              filter: { term: { "xml_type.keyword": "est" } }, 
              weight: 10
            },
            {
              filter: { term: { "xml_type.keyword": "inl" } }, 
              weight: 8
            },
            {
              filter: { term: { "xml_type.keyword": "com" } }, 
              weight: 2
            },
            {
              filter: { term: { "xml_type.keyword": "ms" } }, 
              weight: 2
            }
          ],
          score_mode: "sum",
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
            fields: ["textDataIndexed", "publication_data.pubname^5"]
          }
        })
      }
    })

    // Include highlighted text matches to hits if a query is present.
    if (queries.some(query => !!query)) {
      payload.highlight = highlight
    }

    // Add date range filter.
    if (range) {
      payload.query.function_score.query.bool.must.push({
        range: {
          orig_date_certain: {
            gte: range.from,
            lte: range.to,
          }
        }
      })
    }

    // Add fixed filters that apply to all queries.
    if (this.fixedFilters) {
      this.fixedFilters.forEach(filter => {
        payload.query.function_score.query.bool.must.push(filter)
      })
    }

    if (facetGroups) {
      this.injectFacetsToPayload(payload, facetGroups)
    }

    console.log('search payload', payload)

    return payload
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
              filter: { term: { "xml_type.keyword": "est" } }, 
              weight: 6
            },
            {
              filter: { term: { "xml_type.keyword": "inl" } }, 
              weight: 4
            },
            {
              filter: { term: { "xml_type.keyword": "com" } }, 
              weight: 1
            },
            {
              filter: { term: { "xml_type.keyword": "ms" } }, 
              weight: 1
            }
          ],
          score_mode: "sum",
        }
      },
    }

    // Add free text query.
    queries.forEach(query => {
      if (query) {
        payload.query.function_score.query.bool.must.push({
          simple_query_string: {
            query,
            fields: ["textDataIndexed", "publication_data.pubname^5"]
          }
        })
      }
    })

    // Add fixed filters that apply to all queries.
    if (this.fixedFilters) {
      this.fixedFilters.forEach(filter => {
        payload.query.function_score.query.bool.must.push(filter)
      })
    }

    if (facetGroups || range) {
      this.injectFilteredAggregationsToPayload(payload, facetGroups, range)
    } else {
      this.injectUnfilteredAggregationsToPayload(payload)
    }

    console.log('aggregation payload', payload)

    return payload
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
      const aggregation = this.aggregations[aggregationKey]
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

    console.log('suggestions payload', payload)

    return payload
  }

  private injectFacetsToPayload(payload: any, facetGroups: FacetGroups) {
    Object.entries(facetGroups).forEach(([facetGroupKey, facets]: [string, Facets]) => {
      const terms = this.filterSelectedFacetKeys(facets)
      if (terms.length > 0) {
        payload.query.function_score.query.bool.filter = payload.query.function_score.query.bool.filter || []
        payload.query.function_score.query.bool.filter.push({
          terms: {
            [this.aggregations[facetGroupKey].terms.field]: terms,
          }
        })
      }
    })
  }

  private filterSelectedFacetKeys(facets: Facets): string[] {
    return Object.values(facets).filter(facet => facet.selected).map((facet: any) => facet.key)
  }

  private injectUnfilteredAggregationsToPayload(payload: any) {
    payload.aggs = {}
    for (const [key, aggregation] of Object.entries(this.aggregations)) {
      payload.aggs[key] = aggregation
    }
    return payload
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
      const filteredAggregation = this.generateFilteredAggregation(key, aggregation, facetGroups, range)

      // If filtered aggregation doesn't have filters, then use an unfiltered aggregation.
      payload.aggs[key] = filteredAggregation || aggregation
    }
    return payload
  }

  private generateFilteredAggregation(
    aggregationKey: string,
    aggregation: Aggregation,
    facetGroups?: FacetGroups,
    range?: TimeRange
  ) {

    const filtered = {
      filter: {
        bool: {
          // Selected facets go here as filters.
          filter: []
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
          const selectedFacetKeys = this.filterSelectedFacetKeys(facets)
          if (selectedFacetKeys.length > 0) {
            filtered.filter.bool.filter.push({
              terms: {
                [this.getAggregationField(groupKey)]: selectedFacetKeys,
              }
            })
          }
        }
      })
    }

    // Add date range filter.
    if (range && !aggregation.date_histogram) {
      filtered.filter.bool.filter.push({
        range: {
          orig_date_certain: {
            gte: range.from,
            lte: range.to,
          }
        }
      })
    }

    if (filtered.filter.bool.filter.length > 0) {
      return filtered
    } else {
      return null
    }
  }

  isDateHistogramAggregation(aggregationKey: string): boolean {
    return !!this.aggregations[aggregationKey]['date_histogram']
  }

  isTermsAggregation(aggregationKey: string): boolean {
    return !!this.aggregations[aggregationKey]['terms']
  }

  getAggregationKeys(): string[] {
    return Object.keys(this.aggregations)
  }

  getAggregationField(key: string): string {
    const agg = this.aggregations[key]
    return (agg.terms || agg.date_histogram).field
  }

  private getSearchUrl(): string {
    return this.apiEndpoint + '/' + this.machineName + this.searchApiPath + this.indices.join(',')
  }

  private getTermUrl(): string {
    return this.apiEndpoint + '/' + this.machineName + this.termApiPath + this.indices.join(',')
  }

  private extractData(res: Response) {
    const body = res.json()
    return body || {}
  }

  private handleError(error: Response | any) {
    let errMsg: string
    if (error instanceof Response) {
      const body = error.json() || ''
      const err = body.error || JSON.stringify(body)
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message ? error.message : error.toString()
    }
    console.error('Elastic search query failed.', error)
    return Observable.throw(errMsg)
  }

}


