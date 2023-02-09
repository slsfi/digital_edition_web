import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class DigitalEditionListService {

  private digitalEditionsUrl = '/collections';

  constructor(private config: ConfigService) {}

  getDigitalEditions (): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
    this.digitalEditionsUrl)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  async getDigitalEditionsPromise (): Promise<any> {
    try {
      const response = await fetch( this.config.getSettings('app.apiEndpoint') + '/' +
                    this.config.getSettings('app.machineName') +
                    this.digitalEditionsUrl);
      return response.json();
    } catch (e) {}
  }

  getCollectionsFromAssets (): Observable<any> {
    return ajax('assets/collections.json')
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  private extractData(res: AjaxResponse<unknown>) {
    return res.response;
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

}
