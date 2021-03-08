import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { CommentCacheService } from './comment-cache.service';

@Injectable()
export class CommentService {

  private readTextUrl = '/text/com/';
  textCache: any;

  constructor(private http: Http, private config: ConfigService, private cache: CommentCacheService) {

  }


  getComment(id: string): Observable<any> {
    const id2 = id.replace('_com', '');
    const parts = id2.split(';');
    const collection_id = parts[0].split('_')[0];
    const pub_id = parts[0].split('_')[1];
    const section_id = parts[0].split('_')[2];

    if (!parts[1]) {
      parts[1] = '';
    }

    const commentId = collection_id + '_' + pub_id + (section_id === undefined && section_id !== '') ? '_' + section_id : '';
    const introURL = '/text/' + collection_id + '/' + pub_id + '/com';
    const commentIdURL = '/text/' + collection_id + '/' + pub_id + '/com/' + parts[1];
    let url: String = '';

    if (parts[1]) {
      if (parts[1].length > 1 ) {
        url = commentIdURL;
      }
    } else {
      url = introURL;
    }

    if ( section_id !== undefined && section_id !== '' ) {
      url = introURL + '/' + section_id + '/' + section_id;
    } else {
      url = introURL;
    }

    if (this.cache.hasHtml(commentId)) {
      return this.cache.getHtmlAsObservable(id2);
    } else {
      return this.http.get(
        this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') + url
      )
      .map(res => {
        const body = res.json();
        if (parts[1]) {
          const selector: string = '.' + parts[1];
          const range = document.createRange();
          const docFrags = range.createContextualFragment(body.content);
          if ( docFrags.querySelector(selector) ) {
            const htmlElement: Element = docFrags.querySelector(selector);
            const htmlElementNext: Node = docFrags.querySelector(selector).nextSibling;
            const strippedBody = htmlElement.innerHTML;
            if ( strippedBody !== undefined && strippedBody.length > 0 ) {
              return strippedBody || ' - no content - ';
            } else if ( htmlElementNext.nodeName === 'SPAN' && htmlElementNext['className'] === 'tooltip' ) {
              return htmlElementNext.textContent || ' - no content - ';
            }
          }
        }
        return body.content || ' - no content - ';
      })
      .catch(this.handleError);
    }
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

  getCorrespondanceMetadata(pub_id) {
    return this.http.get(  this.config.getSettings('app.apiEndpoint')  + '/' +
                          this.config.getSettings('app.machineName') +
                          '/correspondence/publication/metadata/' + pub_id + '')
        .map(res => {
          const body = res.json();

          return body || ' - no content - ';
        })
        .catch(this.handleError);
  }

}
