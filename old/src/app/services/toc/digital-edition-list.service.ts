import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { DigitalEdition } from '../../models/digital-edition.model';

@Injectable()
export class DigitalEditionListService {

  private digitalEditionsUrl = '/collections';

  constructor(private http: Http, private config: ConfigService) {}

  getDigitalEditions (): Observable<any[]> {
    return this.http.get( this.config.getSettings('app.apiEndpoint') + '/' +
                          this.config.getSettings('app.machineName') +
                          this.digitalEditionsUrl)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  async getDigitalEditionsPromise (): Promise<any> {
    try {
      const response = await this.http.get( this.config.getSettings('app.apiEndpoint') + '/' +
                    this.config.getSettings('app.machineName') +
                    this.digitalEditionsUrl).toPromise();
      return response.json();
    } catch (e) {}
  }

  getCollectionsFromAssets (): Observable<any[]> {
    return this.http.get('assets/collections.json')
                    .map(this.extractData)
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
