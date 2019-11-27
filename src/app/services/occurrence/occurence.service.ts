import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { DigitalEdition } from '../../models/digital-edition.model';

@Injectable()
export class OccurrenceService {

  constructor(private http: Http, private config: ConfigService) {}

  getOccurences(object_type: string, id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/occurrences/' + object_type + '/' + id)
        .map(res => {
          const body = res.json();

          return body || ' - no content - ';
        })
        .catch(this.handleError);
  }

  getMediaData(object_type: string, id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                          this.config.getSettings('app.machineName') +
                          '/media/data/' + object_type + '/' + id)
        .map(res => {
          const body = res.json();

          if (body.image_path && body.image_path.length) {
            body.image_path = `${this.config.getSettings('app.apiEndpoint')}${body.image_path}`;
          }

          return body || ' - no content - ';
        })
        .catch(this.handleError);
  }

  getGalleryOccurrences( type, id ) {
    return this.http.get(  this.config.getSettings('app.apiEndpoint')  + '/' +
                          this.config.getSettings('app.machineName') +
                          '/gallery/' + type + '/connections/' + id + '/1')
        .map(res => {
          const body = res.json();

          return body || ' - no content - ';
        })
        .catch(this.handleError);
  }

  getArticleData(object_type: string, id: string): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                          this.config.getSettings('app.machineName') +
                          '/media/articles/' + object_type + '/' + id)
        .map(res => {
          const data = res.json();

          for ( let i = 0; i < data.length; i++ ) {
            if (data[i].pdf_path && data[i].pdf_path.length) {
              data[i].pdf_path = `${this.config.getSettings('app.apiEndpoint')}${data[i].pdf_path}`;
            }
          }
          return data || ' - no content - ';
        })
        .catch(this.handleError);
  }

  private extractData(res: Response) {
    const body = res.json();
    return body || { };
  }
  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      let err = '';
      try {
        const body = error.json() || '';
        err = body.error || JSON.stringify(body);
      } catch ( e ) {
        err = '';
      }
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }

}
