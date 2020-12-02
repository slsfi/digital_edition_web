import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class ReferenceDataService {

  private referenceDataUrl = '/urn/';
  textCache: any;

  constructor(private http: Http, private config: ConfigService) {

  }

  getReferenceData(id: string): Observable<any> {
    id = encodeURI(encodeURIComponent(id));
    // We need to doulbe encode the URL for the API
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
        this.referenceDataUrl  + id + '/')
        .map(res => {
          const body = res.json();

          return body[0] || '';
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
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }

}
