import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class SearchDataService {

  private searchDataUrl = '/search/';
  textCache: any;

  constructor(private config: ConfigService) {

  }

  getFilterCollections(): Observable<any> {
    return ajax('assets/filterCollections.json')
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getFilterPersonTypes(): Observable<any> {
    return ajax('assets/filterPersonTypes.json')
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getFullText(search: string, fuzzyness?: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'freetext/' + search + '/' + ((fuzzyness) ? fuzzyness : '1'))
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getUserDefinedText(search: string, field: string, fuzzyness?: Number): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'user_defined/' + this.config.getSettings('app.machineName') +
    '/' + field + '/' + encodeURI(search) + '/' + (fuzzyness?.toString()) + '/')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getLocations(search: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'location/' + search + '/')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getTags(search: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'tag/' + search + '/')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getSubjects(search: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'subject/' + search + '/')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getAll(search: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + 'all/' + search + '/7000')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getFacsimileLookupData() {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    '/publication-facsimile-relations/')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }


  getProjectCollections() {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    '/collections')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getGalleryOccurrences( type: any, id: any ) {
    return ajax(this.config.getSettings('app.apiEndpoint')  + '/' +
    this.config.getSettings('app.machineName') +
    '/gallery/' + type + '/connections/' + id + '/1')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getSearchSuggestiongs(search_str: string, limit?: any): Observable<any> {
    let search_limit = 10;

    if (limit !== undefined) {
      search_limit = limit;
    }

    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.searchDataUrl + `suggestions/${search_str}/${search_limit}`)
       .pipe(
        map((res) => {
          const body = res.response as any;
  
          for (let i = 0; i < body.length; i++) {
            if (body[i]['highlight'] !== undefined) {
              if (body[i]['highlight']['message'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['message']).replace('<em>', '').replace('</em>', '');
              } else if (body[i]['highlight']['full_name'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['full_name']).replace('<em>', '').replace('</em>', '');
              } else if (body[i]['highlight']['name'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['name']).replace('<em>', '').replace('</em>', '');
              } else if (body[i]['highlight']['song_name'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['song_name']).replace('<em>', '').replace('</em>', '');
              } else if (body[i]['highlight']['textData'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['textData']).replace('<em>', '').replace('</em>', '');
              }
            }
          }
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getPlace(id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') +  // We do no use project name for semantic data
    this.searchDataUrl + 'places/tooltip/' + id)
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getPerson(id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') +  // We do no use project name for semantic data
    this.searchDataUrl + 'persons/tooltip/' + id)
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getAllPerson(): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/tooltips/subjects')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getOccurrencesByType(object_type: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/occurrences/' + object_type)
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  getAllPlaces(): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/tooltips/locations')
       .pipe(
        map((res) => {
          const body = res.response;
  
          return body || ' - no content - ';
        }),
        catchError(this.handleError),
       );
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
    throw errMsg;
  }

}
