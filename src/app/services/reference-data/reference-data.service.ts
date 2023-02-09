import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class ReferenceDataService {

  private referenceDataUrl = '/urn/';
  private urnResolverUrl: string;
  textCache: any;

  constructor(private config: ConfigService) {
    try {
      this.urnResolverUrl = this.config.getSettings('urnResolverUrl') as string;
    } catch (e) {
      this.urnResolverUrl = 'https://urn.fi/';
    }
  }

  getReferenceData(id: string): Observable<any> {
    id = encodeURI(encodeURIComponent(id));
    // We need to doulbe encode the URL for the API
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') +
    this.referenceDataUrl  + id + '/')
       .pipe(
        map((res) => (res.response || '')),
        catchError(this.handleError),
       );
  }

  private async handleError (error: Response | any) {
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

  public getUrnResolverUrl() {
    return this.urnResolverUrl;
  }

}
