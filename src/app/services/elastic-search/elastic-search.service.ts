import { Injectable } from '@angular/core'
import { Http, Response } from '@angular/http'
import { Observable } from 'rxjs/Observable'
import { ConfigService } from '@ngx-config/core'


@Injectable()
export class ElasticSearchService {

  private searchApiPath = '/search/elastic/'
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
      this.source = this.config.getSettings('ElasticSearch.source')
      this.aggregations = this.config.getSettings('ElasticSearch.aggregations')
      this.suggestions = this.config.getSettings('ElasticSearch.suggestions')
    } catch (e) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
      throw e
    }
    // Should not fail if config is missing.
    try {
      this.fixedFilters = this.config.getSettings('ElasticSearch.fixedFilters')
    } catch (e) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e.message)
    }
  }

  executeSearchQuery(options: SearchQuery): Observable<any> {
    const payload = this.generateSearchQueryPayload(options)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  executeSuggestionsQuery(options: SuggestionsQuery): Observable<any> {
    const payload = this.generateSuggestionsQueryPayload(options)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  private generateSearchQueryPayload({
    query,
    highlight,
    from,
    size,
    type,
    range,
    facetGroups,
    sort,
  }: SearchQuery): object {
    const payload: any = {
      from,
      size,
      _source: this.source,
      query: {
        bool: {
          must: []
        }
      },
      sort,
    }

    if (query) {
      // Add free text query.
      payload.query.bool.must.push({
        query_string: {
          query,
        }
      })

      // Include highlighted text matches to hits.
      payload.highlight = highlight
    }

    // Filter with given types.
    if (type) {
      payload.query.bool.must.push({
        terms: {
          texttype: type,
        }
      })
    }

    // Add date range filter.
    if (range) {
      payload.query.bool.must.push({
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
        payload.query.bool.must.push(filter)
      })
    }

    if (facetGroups) {
      this.injectFacetsToPayload(payload, facetGroups)
      this.injectFilteredAggregationsToPayload(payload, facetGroups)
    } else {
      this.injectUnfilteredAggregationsToPayload(payload)
    }

    console.log('search payload', payload)

    return payload
  }

  private injectFacetsToPayload(payload: any, facetGroups: FacetGroups) {
    Object.entries(facetGroups).forEach(([facetGroupKey, facets]: [string, Facets]) => {
      const terms = this.filterSelectedFacetKeys(facets)
      if (terms.length > 0) {
        payload.query.bool.filter = payload.query.bool.filter || []
        payload.query.bool.filter.push({
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
  private injectFilteredAggregationsToPayload(payload: any, facetGroups: FacetGroups) {
    payload.aggs = {}
    for (const [key, aggregation] of Object.entries(this.aggregations)) {
      const filteredAggregation = this.generateFilteredAggregation(key, aggregation, facetGroups)

      // If filtered aggregation doesn't have filters, then use an unfiltered aggregation.
      payload.aggs[key] = filteredAggregation || aggregation
    }
    return payload
  }

  private generateFilteredAggregation(aggregationKey: string, aggregation: Aggregation, facetGroups: FacetGroups) {

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

    // Add filters
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

    if (filtered.filter.bool.filter.length > 0) {
      return filtered
    } else {
      return null
    }
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

    return payload
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
    console.error('Eleastic Search query failed.', error)
    return Observable.throw(errMsg)
  }

}


