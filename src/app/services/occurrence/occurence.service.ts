import { Injectable } from '@angular/core';

import { catchError, map, Observable, throwError } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { ConfigService } from '../config/config.service';

@Injectable()
export class OccurrenceService {

  constructor(private config: ConfigService) {}

  getOccurences(object_type: string, id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/occurrences/' + object_type + '/' + id)
       .pipe(
        map((res) => (res.response || ' - no content - ')),
        catchError(this.handleError),
       );
  }

  getMediaData(object_type: string, id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
    '/media/data/' + object_type + '/' + id)
       .pipe(
        map((res: any) => {
          const body = res.response;

          if (body.image_path && body.image_path.length) {
            body.image_path = `${this.config.getSettings('app.apiEndpoint')}${body.image_path}`;
          }

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
        map((res) => (res.response || ' - no content - ')),
        catchError(this.handleError),
       );
  }

  getArticleData(object_type: string, id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
    '/media/articles/' + object_type + '/' + id)
       .pipe(
        map((res: any) => {
          const data = res.response;

          for ( let i = 0; i < data.length; i++ ) {
            if (data[i].pdf_path && data[i].pdf_path.length) {
              data[i].pdf_path = `${this.config.getSettings('app.apiEndpoint')}${data[i].pdf_path}`;
            }
          }
          return data || ' - no content - ';
        }),
        catchError(this.handleError),
       );
  }

  private async handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      let err = '';
      try {
        const body = await error.json() || '';
        err = body.error || JSON.stringify(body);
      } catch ( e ) {
        err = '';
      }
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return throwError(errMsg);
  }

}
