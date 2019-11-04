import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class SearchDataService {

  private searchDataUrl = '/search/';
  textCache: any;

  constructor(private http: Http, private config: ConfigService) {

  }

  getFilterCollections(): Observable<any[]> {
    return this.http.get('assets/filterCollections.json')
      .map(this.extractData)
      .catch(this.handleError);
  }

  getFilterPersonTypes(): Observable<any[]> {
    return this.http.get('assets/filterPersonTypes.json')
      .map(this.extractData)
      .catch(this.handleError);
  }

  getFullText(search: string, fuzzyness?: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'freetext/' + search + '/' + ((fuzzyness) ? fuzzyness : '1'))
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getUserDefinedText(search: string, field: string, fuzzyness?: Number): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'user_defined/' + this.config.getSettings('app.machineName') +
      '/' + field + '/' + encodeURI(search) + '/' + (fuzzyness.toString()) + '/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getLocations(search: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'location/' + search + '/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getTags(search: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'tag/' + search + '/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSubjects(search: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'subject/' + search + '/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getAll(search: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + 'all/' + search + '/7000')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getFacsimileLookupData() {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      '/publication-facsimile-relations/')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getSearchSuggestiongs(search_str: string, limit?): Observable<any> {
    let search_limit = 10;

    if (limit !== undefined) {
      search_limit = limit;
    }

    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
      this.searchDataUrl + `suggestions/${search_str}/${search_limit}`)
      .map(res => {
        const body = res.json();
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
      })
      .catch(this.handleError);
  }

  getPlace(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') +  // We do no use project name for semantic data
      this.searchDataUrl + 'places/tooltip/' + id)
      .map(res => {
        const body = res.json();

        return body.content || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getPerson(id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') +  // We do no use project name for semantic data
      this.searchDataUrl + 'persons/tooltip/' + id)
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getAllPerson(): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/tooltips/subjects')
      .map(res => {
        const body = res.json();

        return body || ' - no content - ';
      })
      .catch(this.handleError);
  }

  getOccurrencesByType(object_type: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/occurrences/' + object_type)
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
