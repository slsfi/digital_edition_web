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

  constructor(private http: Http, private config: ConfigService) {
    try {
      this.apiEndpoint = this.config.getSettings('app.apiEndpoint')
      this.machineName = this.config.getSettings('app.machineName')
      this.indices = this.config.getSettings('ElasticSearch.indices')
      this.source = this.config.getSettings('ElasticSearch.source')
      this.aggregations = this.config.getSettings('ElasticSearch.aggregations')
    } catch (e) {
      console.error('Failed to load Elastic Search Service. Configuration error.', e)
    }
  }

  executeQuery(options: Query): Observable<any> {
    const payload = this.generateQueryPayload(options)

    this.injectAggregations(payload)

    return this.http.post(this.getSearchUrl(), payload)
      .map(this.extractData)
      .catch(this.handleError)
  }

  private generateQueryPayload({
    query,
    highlight,
    from,
    size,
    type,
    facetGroups,
  }: Query): object {
    const payload: any = {
      from,
      size,
      _source: this.source,
      query: {
        bool: {
          must: []
        }
      }
    }

    if (query) {
      payload.query.bool.must.push({query_string: {
        query,
      }})
      payload.highlight = highlight
    }

    if (type) {
      payload.query.bool.must.push({prefix: {
        texttype: type,
      }})
    }

    if (facetGroups) {
      this.injectFacetsToPayload(payload, facetGroups)
    }

    console.log('search payload', payload)

    return payload
  }

  private injectFacetsToPayload(payload: any, facetGroups: FacetGroups) {
    Object.entries(facetGroups).forEach(([facetGroupKey, facets]: [string, Facets]) => {
      const terms = Object.values(facets).filter(facet => facet.selected).map((facet: any) => facet.key)
      if (terms.length > 0) {
        payload.query.bool.filter = payload.query.bool.filter || []
        payload.query.bool.filter.push({
          terms: {
            [this.aggregations[facetGroupKey].field]: terms,
          }
        })
      }
    })
  }

  private injectAggregations(payload: any) {
    payload.aggs = {}
    for (const [key, aggregation] of Object.entries(this.aggregations)) {
      payload.aggs[key] = {
        terms: {
          field: aggregation.field,
          size: aggregation.size || 20,
        }
      }
    }
    return payload
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


