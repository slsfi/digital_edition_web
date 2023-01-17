import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';

import { ConfigService } from '../config/config.service';

@Injectable()
export class HtmlContentService {

  private htmlUrl = '/html/';

  constructor(private config: ConfigService) {
  }

  getHtmlContent (filename: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + this.htmlUrl + filename)
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
    return throwError(errMsg);
  }
}
