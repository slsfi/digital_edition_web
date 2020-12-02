import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

import { CommentService } from '../comments/comment.service';

@Injectable()
export class TooltipService {

  private placeTooltipUrl = '/tooltips/locations/';
  private apiEndPoint: string;
  private projectMachineName: string;
  constructor(private http: Http, private config: ConfigService, private commentService: CommentService) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
  }

  getPersonTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/subject/${legacyPrefix}${id}`

    return this.http.get(url)
        .map(res => {
          const body = res.json();
          return body[0] || {'name': body.full_name, 'description': body.description,
          'date_deceased': body.date_deceased,
          'date_born': body.date_born};
        })
        .catch(this.handleError);
  }

  getPlaceTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/location/${legacyPrefix}${id}`

    return this.http.get( url )
        .map(res => {
          const body = res.json();
          return body[0] || {'name': body.name, 'description': body.description};
        })
        .catch(this.handleError);
  }

  getTagTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/tag/${legacyPrefix}${id}`

    return this.http.get( url )
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Tag', 'description': body.description};
        })
        .catch(this.handleError);
  }

  getWorkTooltip(id: string): Observable<any> {
    let url = '';
    url = `${this.apiEndPoint}/${this.projectMachineName}/work/${id}`

    return this.http.get( url )
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Work', 'description': body.title};
        })
        .catch(this.handleError);
  }

  decodeHtmlEntity(str: string) {
    return str.replace(/&#(\d+);/g, function(match, dec) {
      return String.fromCharCode(dec);
    });
  }


  /**
   * Can be used to fetch tooltip in situations like these:
   * <img src=".." data-id="en5929">
   * <span class="tooltip"></span>
   */
  getCommentTooltip(id: string): Observable<any> {

      const parts = id.split(';');
      const htmlId = parts[0];
      const elementId = parts[parts.length - 1].replace('end', 'en');
      return this.commentService.getComment(parts[0]).map(
        data => {
          const range = document.createRange();
          const doc = range.createContextualFragment(data);
          const element = doc.querySelector('.' + elementId);
          const formatedCommentData = element.innerHTML.replace(/(&lt;)/g, '<').replace(/(&gt;)/g, '>');

          return {
            'name': 'Comment',
            'description': element.innerHTML = formatedCommentData }
            || {'name': 'Error', 'description': element.innerHTML};
        },
        error => {
        }
      );

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
