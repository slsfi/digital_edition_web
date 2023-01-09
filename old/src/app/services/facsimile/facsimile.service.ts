import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class FacsimileService {

  private facsimilesUrl = '/facsimiles/';
  private facsimileImageUrl = '/facsimiles/';
  textCache: any;

  constructor(private http: Http, private config: ConfigService) {

  }

  getFacsimileImage(facs_id, image_nr, zoom) {
    return this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') +
      this.facsimileImageUrl + facs_id + '/' + image_nr + '/' + zoom;
  }

  getFacsimiles(publication_id, chapter?: string) {
    const parts = String(publication_id).split('_');
    if ( parts[2] !== undefined ) {
      chapter = String(parts[2]).split(';')[0];
    }
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + this.facsimilesUrl + publication_id + ((chapter) ? '/' + chapter + '' : '')
    ).map(res => {
      const body = res.json();
      return body;
    }).catch(this.handleError);
  }

  getFacsimilePage (legacy_id): Observable<any[]> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        `/facsimiles/${legacy_id}`)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getFeaturedFacsimiles() {
    const ids = '1,2,3,4,6,8,9,10';
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + this.facsimilesUrl + 'collections/' + ids
    ).map(res => {
      const body = res.json();
      return body;
    }).catch(this.handleError);
  }

/*
  getFacsimile(id: string): Observable<any> {
    console.log(id);
    const id2 = id.replace('_com', '');
    const parts = id2.split(';');

    const FacsimileId = parts[0];
    if (!parts[1]) {
      parts[1] = '';
    }

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + this.readTextUrl + parts[0] + (parts[1] ? '/' + parts[1] : '')
    )
    .map(res => {
      const body = res.json();
      if (parts[1]) {
        console.log(res, 'res i Facsimile service');
        const selector: string = '.' + parts[1];
        const range = document.createRange();
        const docFrags = range.createContextualFragment(body.content);
        if ( docFrags.querySelector(selector) ) {
          const strippedBody = docFrags.querySelector(selector).innerHTML;
          if ( strippedBody !== undefined) {
            return strippedBody || ' - no content - ';
          }
        }
      }
      return body.content || ' - no content - ';
    })
    .catch(this.handleError);

  }
*/
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
