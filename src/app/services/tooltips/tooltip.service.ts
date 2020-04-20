import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

import { CommentService } from '../comments/comment.service';

@Injectable()
export class TooltipService {

  private personTooltipUrl = '/tooltips/subject/';
  private placeTooltipUrl = '/tooltips/locations/';

  constructor(private http: Http, private config: ConfigService, private commentService: CommentService) {}

  getPersonTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.config.getSettings('app.apiEndpoint')}/${this.config.getSettings('app.machineName')}/subject/${legacyPrefix}${id}`

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + this.personTooltipUrl + id)
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Error', 'description': 'Person data not found'};
        })
        .catch(this.handleError);
  }

  getPlaceTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.config.getSettings('app.apiEndpoint')}/${this.config.getSettings('app.machineName')}/location/${legacyPrefix}${id}`

    return this.http.get( url )
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Place', 'description': body.description};
        })
        .catch(this.handleError);
  }

  getTagTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.config.getSettings('app.apiEndpoint')}/${this.config.getSettings('app.machineName')}/tag/${legacyPrefix}${id}`

    return this.http.get( url )
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Tag', 'description': body.description};
        })
        .catch(this.handleError);
  }

  getWorkTooltip(id: string): Observable<any> {
    let url = '';
    url = `${this.config.getSettings('app.apiEndpoint')}/${this.config.getSettings('app.machineName')}/work/${id}`

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + this.placeTooltipUrl + id)
        .map(res => {
          const body = res.json();
          return body[0] || {'name': 'Work', 'description': body.title};
        })
        .catch(this.handleError);
  }

  /**
   * Can be used to fetch tooltip in situations like these:
   * <img src=".." data-id="en5929">
   * <span class="tooltip"></span>
   */
  getCommentTooltip(id: string) {

      const parts = id.split(';');
      const htmlId = parts[0];
      const elementId = parts[1].replace('end', 'en');


      return this.commentService.getComment(parts[0]).map(
        data => {
          const range = document.createRange();
          const doc = range.createContextualFragment(data);
          const element = doc.querySelector('#' + elementId).nextElementSibling;

          return {
            'name': 'Comment',
            'description': element.innerHTML.replace(/(<([^>]+)>)/ig, '').replace(/^p\d+/gi, '') }
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
