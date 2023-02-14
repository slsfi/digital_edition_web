import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class SearchDataService {
  private searchDataUrl = '/search/';
  textCache: any;

  constructor(private config: ConfigService, private http: HttpClient) {}

  getFilterCollections(): Observable<any> {
    return this.http.get('assets/filterCollections.json');
  }

  getFilterPersonTypes(): Observable<any> {
    return this.http.get('assets/filterPersonTypes.json');
  }

  getFullText(search: string, fuzzyness?: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'freetext/' +
        search +
        '/' +
        (fuzzyness ? fuzzyness : '1')
    );
  }

  getUserDefinedText(
    search: string,
    field: string,
    fuzzyness?: Number
  ): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'user_defined/' +
        this.config.getSettings('app.machineName') +
        '/' +
        field +
        '/' +
        encodeURI(search) +
        '/' +
        fuzzyness?.toString() +
        '/'
    );
  }

  getLocations(search: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'location/' +
        search +
        '/'
    );
  }

  getTags(search: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'tag/' +
        search +
        '/'
    );
  }

  getSubjects(search: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'subject/' +
        search +
        '/'
    );
  }

  getAll(search: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.searchDataUrl +
        'all/' +
        search +
        '/7000'
    );
  }

  getFacsimileLookupData(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/publication-facsimile-relations/'
    );
  }

  getProjectCollections(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/collections'
    );
  }

  getGalleryOccurrences(type: any, id: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/gallery/' +
        type +
        '/connections/' +
        id +
        '/1'
    );
  }

  getSearchSuggestiongs(search_str: string, limit?: any): Observable<any> {
    let search_limit = 10;

    if (limit !== undefined) {
      search_limit = limit;
    }

    return this.http
      .get(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          this.searchDataUrl +
          `suggestions/${search_str}/${search_limit}`
      )
      .pipe(
        map((res) => {
          const body = res as any;

          for (let i = 0; i < body.length; i++) {
            if (body[i]['highlight'] !== undefined) {
              if (body[i]['highlight']['message'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['message'])
                  .replace('<em>', '')
                  .replace('</em>', '');
              } else if (body[i]['highlight']['full_name'] !== undefined) {
                body[i]['suggestion'] = String(
                  body[i]['highlight']['full_name']
                )
                  .replace('<em>', '')
                  .replace('</em>', '');
              } else if (body[i]['highlight']['name'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['name'])
                  .replace('<em>', '')
                  .replace('</em>', '');
              } else if (body[i]['highlight']['song_name'] !== undefined) {
                body[i]['suggestion'] = String(
                  body[i]['highlight']['song_name']
                )
                  .replace('<em>', '')
                  .replace('</em>', '');
              } else if (body[i]['highlight']['textData'] !== undefined) {
                body[i]['suggestion'] = String(body[i]['highlight']['textData'])
                  .replace('<em>', '')
                  .replace('</em>', '');
              }
            }
          }
          return body || ' - no content - ';
        }),
        catchError(this.handleError)
      );
  }

  getPlace(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + // We do no use project name for semantic data
        this.searchDataUrl +
        'places/tooltip/' +
        id
    );
  }

  getPerson(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + // We do no use project name for semantic data
        this.searchDataUrl +
        'persons/tooltip/' +
        id
    );
  }

  getAllPerson(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/tooltips/subjects'
    );
  }

  getOccurrencesByType(object_type: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/occurrences/' + object_type
    );
  }

  getAllPlaces(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/tooltips/locations'
    );
  }

  private async handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = (await error.json()) || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    throw errMsg;
  }
}
