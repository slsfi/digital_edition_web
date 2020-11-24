import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class SemanticDataService {

  textCache: any;
  useLegacy: boolean;
  elasticSubjectIndex: string;
  elasticLocationIndex: string;
  elasticWorkIndex: string;
  elasticTagIndex: string;
  flattened: any;

  constructor(private http: Http, private config: ConfigService) {
    try {
      this.useLegacy = this.config.getSettings('app.useLegacyIdsForSemanticData');
    } catch (e) {
      this.useLegacy = false;
    }
    this.elasticSubjectIndex = 'subject';
    this.elasticLocationIndex = 'location';
    this.elasticWorkIndex = 'work';
    this.elasticTagIndex = 'tag';
    this.flattened = [];
  }


  getFilterCollections(): Observable<any[]> {
    return this.http.get('assets/filterCollections.json')
      .map(this.extractData)
      .catch(this.handleError);
  }

  getFilterPersonTypes(): Observable<any[]> {
    const payload: any = {
    size: 0,
    query: {
          bool: {
            must : [{
              term: { project_id : this.config.getSettings('app.projectId') }
            }]
          }
    },
    aggs : {
      types : {
              terms : {
                  field : 'type.keyword'
              }
          }
      }
    }
    return this.http.post(this.getSearchUrl(this.elasticSubjectIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getFilterCategoryTypes(): Observable<any[]> {
    const payload: any = {
    size: 0,
    query: {
          bool: {
            must : [{
              term: { project_id : this.config.getSettings('app.projectId') }
            }]
          }
    },
    aggs : {
          types : {
              terms : {
                  field : 'tag_type.keyword'
              }
          }
      }
    }
    return this.http.post(this.getSearchUrl(this.elasticTagIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getPlace(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
       this.config.getSettings('app.machineName') + '/location/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getPerson(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
       this.config.getSettings('app.machineName') + '/subject/' + id)
      .map(res => {
        const body = res.json();
        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getTag(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/tag/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getWork(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/work/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSemanticData(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/tag/' + id)
      .map(res => {
        const body = res.json();

        return body.content || ' - no content - ';
      })
      .catch(this.handleError);

  }

  getAllPerson(): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/subjects')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getOccurrencesByType(object_type: string, object_subtype?: string): Observable<any> {
    let occurrenceURL = `/occurrences/${object_type}`;

    if (object_subtype) {
      occurrenceURL = `${occurrenceURL}/${object_subtype}`
    }

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + occurrenceURL)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSubjectOccurrences(subject_id?: Number): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/subject/occurrences/' + ((subject_id) ? subject_id + '/' : ''))
      .map(res => {
        const body = res.json();
        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSubjects(): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/subjects')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSubjectsElastic(from, searchText?, filters?) {
    let showPublishedStatus = 2;
    if ( filters === null ) {
      filters = {};
    }
    try {
      showPublishedStatus = this.config.getSettings('PersonSearch.ShowPublishedStatus');
    } catch (e) {
      showPublishedStatus = 2;
    }
    const payload: any = {
      from: from,
      size: 200,
      sort: [
        { 'full_name.keyword' : {'order' : 'asc'} }
      ],
      query: {
        bool: {
          must : [{
            'term' : { 'project_id' : this.config.getSettings('app.projectId') }
          },
          {
            'term' : { 'published' : showPublishedStatus }
          }],
        }
      }
    }

    if (filters !== undefined && filters['filterPersonTypes'] !== undefined && filters['filterPersonTypes'].length > 0) {
      payload.from = 0;
      payload.size = 1000;
      payload.query.bool.must.push({bool: {should: []}});
      filters['filterPersonTypes'].forEach(element => {
        payload.query.bool.must[payload.query.bool.must.length - 1].bool.
        should.push({'term': {'type.keyword': String(element.name)}});
      });
    }

    // Add date range filter.
    if (filters.filterYearMax && filters.filterYearMin) {
      payload.from = 0;
      payload.size = 1000;
      payload.query.bool.must.push({
        range: {
          date_born_date: {
            gte: filters.filterYearMin + '-01-01',
            lte: filters.filterYearMax + '-01-01',
          }
        }
      })
    }
    // Seach for first character of name
    if (searchText !== undefined && searchText !== '' && String(searchText).length === 1) {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.must.push({regexp: {'full_name.keyword': {
          'value': `${String(searchText)}.*|${String(searchText).toLowerCase()}.*`}}});
    } else if ( searchText !== undefined && searchText !== '' ) {
      payload.from = 0;
      payload.size = 5000;
      payload.sort = ['_score'],
      payload.query.bool.must.push({fuzzy: {'full_name': {
          'value': `${String(searchText)}`}}});
    }

    return this.http.post(this.getSearchUrl(this.elasticSubjectIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getSingleObjectElastic(type, id) {
    const payload: any = {
      from: 0,
      size: 200,
      query: {
        bool: {
          should : [{
            bool: {
              must:  [{
                'term' : { 'project_id' : this.config.getSettings('app.projectId') }
              },
              {
                'term' : { 'id' : id }
              }]
            }
          },
          {
            bool: {
              must:  [{
                'term' : { 'project_id' : this.config.getSettings('app.projectId') }
              },
              {
                'term' : { 'legacy_id' : id }
              }]
            }
          }]
        }
      }
    }

    if ( type === 'work' ) {
      payload.query.bool.should[0].bool.must[1]['term'] = {'man_id': id};
    }

    // remove if the ID is not strictly numerical
    if ( /^\d+$/.test(id) === false ) {
      delete payload.query.bool.should[0];
    }

    return this.http.post(this.getSearchUrl(type), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getLocationElastic(from, searchText?) {
    let showPublishedStatus = 2;
    try {
      showPublishedStatus = this.config.getSettings('LocationSearch.ShowPublishedStatus');
    } catch (e) {
      showPublishedStatus = 2;
    }
    const payload: any = {
      from: from,
      size: 200,
      sort: [
        { 'name.keyword' : 'asc' }
      ],
      query: {
        bool: {
          must : [{
            'term' : { 'project_id' : this.config.getSettings('app.projectId') }
          },
          {
            'term' : { 'published' : showPublishedStatus }
          }],
        }
      }
    }
    // Seach for first character of name
    if (searchText !== undefined && searchText !== '' && String(searchText).length === 1) {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.must.push({regexp: {'name.keyword': {
          'value': `${String(searchText)}.*|${String(searchText).toLowerCase()}.*`}}});
    } else if ( searchText !== undefined && searchText !== '' ) {
      payload.from = 0;
      payload.size = 5000;
      payload.sort = ['_score'],
      payload.query.bool.must.push({fuzzy: {'name': {
          'value': `${String(searchText)}`}}});
    }
    return this.http.post(this.getSearchUrl(this.elasticLocationIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getWorksElastic(from, searchText?) {
    const payload: any = {
      from: from,
      size: 200,
      sort: [
        { 'author_data.last_name.keyword' : 'asc' }
      ],
      query: {
        bool: {
          must : [{
            'term' : { 'project_id' : this.config.getSettings('app.projectId') }
          }],
        }
      }
    }
    // Seach for first character of name
    if (searchText !== undefined && searchText !== '' && String(searchText).length === 1) {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.must.push({regexp: {'title.keyword': {
          'value': `${String(searchText)}.*|${String(searchText).toLowerCase()}.*`}}});
    } else if ( searchText !== undefined && searchText !== '' ) {
      payload.from = 0;
      payload.size = 5000;
      payload.sort = ['_score'],
      payload.query.bool.must.push({fuzzy: {'title': {
          'value': `${String(searchText)}`}}});
    }
    return this.http.post(this.getSearchUrl(this.elasticWorkIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getTagElastic(from, searchText?, filters?) {
    let showPublishedStatus = 2;
    try {
      showPublishedStatus = this.config.getSettings('LocationSearch.ShowPublishedStatus');
    } catch (e) {
      showPublishedStatus = 2;
    }
    const payload: any = {
      from: from,
      size: 800,
      sort: [
        { 'name.keyword' : 'asc' }
      ],
      query: {
        bool: {
          must : [{
            'term' : { 'project_id' : this.config.getSettings('app.projectId') }
          },
          {
            'term' : { 'published' : showPublishedStatus }
          }],
        }
      }
    }

    // Seach for first character of name
    if (searchText !== undefined && searchText !== '' && String(searchText).length === 1) {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.must.push({regexp: {'name.keyword': {
          'value': `${String(searchText)}.*|${String(searchText).toLowerCase()}.*`}}});
    } else if ( searchText !== undefined && searchText !== '' ) {
      payload.from = 0;
      payload.size = 5000;
      payload.sort = ['_score'],
      payload.query.bool.must.push({fuzzy: {'name': {
          'value': `${String(searchText)}`}}});
    }

    if (filters !== undefined && filters['filterCategoryTypes'] !== undefined) {
      payload.from = 0;
      payload.size = 1000;
      payload.query.bool.must.push({bool: {should: []}});
      filters['filterCategoryTypes'].forEach(element => {
        payload.query.bool.must[payload.query.bool.must.length - 1].bool.
        should.push({'term': {'tag_type.keyword': String(element.name)}});
      });
    }

    return this.http.post(this.getSearchUrl(this.elasticTagIndex), payload)
    .map(this.extractData)
    .catch(this.handleError)
  }

  getSubjectOccurrencesById(id: string): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/occurrences/subject/' + id)
      .map(res => {
        const body = res.json();
        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getOccurrences(type: string, id: string): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/occurrences/' + type + '/' + id)
      .map(res => {
        const body = res.json();
        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getLocationOccurrencesById(id: string): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/occurrences/location/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getTagOccurrencesById(id: string): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/occurrences/tag/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getWorkOccurrencesById(id: string): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') + '/workregister/work/project/occurrences/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getLocationOccurrences(id?): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/location/occurrences/' + ((id) ? id + '/' : ''))
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getTagOccurrences(id?): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/tag/occurrences/' + ((id) ? id + '/' : ''))
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getWorkOccurrences(): Observable<any> {

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/workregister/manifestations/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getAllPlaces(): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/tooltips/locations')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSubjectsOccurencesByCollection(object_type: string, id: any[]): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/occurrences/collection/' + object_type + '/' + id)
      .map(res => {
        return res.json();
      })
      .catch(this.handleError);
  }

  getPublicationTOC(collection_id) {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                          this.config.getSettings('app.machineName') + '/toc/' + collection_id)
        .map(res => {
          const data = res.json();
          this.flatten(data);
          return this.flattened;
        },
        error => {
          console.log(error);
        })
        .catch(this.handleError);
  }

  private flatten(toc) {
    if ( toc.children ) {
      for (let i = 0, count = toc.children.length; i < count; i++) {
        if ( toc.children[i].itemId !== undefined && toc.children[i].itemId !== '') {
          this.flattened.push(toc.children[i]);
        }
        this.flatten(toc.children[i]);
      }
    }
  }

  private getSearchUrl(index: any): string {
    return this.config.getSettings('app.apiEndpoint') + '/' +
     this.config.getSettings('app.machineName') + '/search/elastic/' + index
  }

  private extractData(res: Response) {
    const body = res.json();
    return body || {};
  }

  private handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }

}
