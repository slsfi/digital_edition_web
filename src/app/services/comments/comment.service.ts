import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { CommentCacheService } from './comment-cache.service';
import { CommonFunctionsService } from '../common-functions/common-functions.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';

@Injectable()
export class CommentService {

  private readTextUrl = '/text/com/';
  textCache: any;
  activeCommentHighlight: any;
  activeLemmaHighlight: any;

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private cache: CommentCacheService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.activeCommentHighlight = {
      commentTimeOutId: null,
      commentLemmaElement: null
    };
    this.activeLemmaHighlight = {
      lemmaTimeOutId: null,
      lemmaElement: null
    };
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
      return ajax(
        this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') + url,
      )
      .pipe(
        map((res: any) => {
          const body = res.json();
          if (parts[1]) {
            const selector: string = '.' + parts[1];
            const range = document.createRange();
            const docFrags = range.createContextualFragment(body.content);
            if ( docFrags.querySelector(selector) ) {
              const htmlElement: Element | null = docFrags.querySelector(selector);
              const htmlElementNext: any = docFrags.querySelector(selector)?.nextSibling;
              const strippedBody = htmlElement?.innerHTML;
              if ( strippedBody !== undefined && strippedBody.length > 0 ) {
                return strippedBody || ' - no content - ';
              } else if ( htmlElementNext?.nodeName === 'SPAN' && htmlElementNext['className'] === 'tooltip' ) {
                return htmlElementNext.textContent || ' - no content - ';
              }
            }
          }
          return body.content || ' - no content - ';
        }),
        catchError(this.handleError)
      )
    }
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

  getCorrespondanceMetadata(pub_id: any) {
    return ajax(  this.config.getSettings('app.apiEndpoint')  + '/' +
                          this.config.getSettings('app.machineName') +
                          '/correspondence/publication/metadata/' + pub_id + '')
        .pipe(
          map((res: any) => {
            const body = res.json();
  
            return body || ' - no content - ';
          }),
          catchError(this.handleError)
        );
  }

  getDownloadableComments(id: string, format: string): Observable<any> {
    const id2 = id.replace('_com', '');
    const parts = id2.split(';');
    const collection_id = parts[0].split('_')[0];
    const pub_id = parts[0].split('_')[1];
    const section_id = parts[0].split('_')[2];

    if (!parts[1]) {
      parts[1] = '';
    }

    const commentId = collection_id + '_' + pub_id + (section_id === undefined && section_id !== '') ? '_' + section_id : '';
    let url = '/text/downloadable/' + format + '/' + collection_id + '/' + pub_id + '/com';

    if ( section_id !== undefined && section_id !== '' ) {
      url = url + '/' + section_id;
    }

    return ajax(
      this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') + url
    )
    .pipe(
      map((res: any) => {
        const body = res.json();
        return body.content;
      }),
      catchError(this.handleError),
    )
  }

  /* Use this function to scroll the lemma of a comment into view in the reading text view. */
  /**
   * Function used to scroll the lemma of a comment into view in the reading text view.
   * @param lemmaStartElem The html element marking the start of the lemma in the reading text view.
   * @param timeOut Duration for showing an arrow at the start of the lemma in the reading text view.
   */
  scrollToCommentLemma(lemmaStartElem: HTMLElement, timeOut = 5000) {
    if (lemmaStartElem !== null && lemmaStartElem !== undefined && lemmaStartElem.classList.contains('anchor_lemma')) {

      if (this.activeLemmaHighlight.lemmaTimeOutId !== null) {
        // Clear previous lemma highlight if still active
        this.activeLemmaHighlight.lemmaElement.style.display = null;
        window.clearTimeout(this.activeLemmaHighlight.lemmaTimeOutId);
      }

      lemmaStartElem.style.display = 'inline';
      this.commonFunctions.scrollElementIntoView(lemmaStartElem);
      const settimeoutId = setTimeout(() => {
        lemmaStartElem.style.display = '';
        this.activeLemmaHighlight = {
          lemmaTimeOutId: null,
          lemmaElement: null
        }

      }, timeOut);

      this.activeLemmaHighlight = {
        lemmaTimeOutId: settimeoutId,
        lemmaElement: lemmaStartElem
      }
    }
  }

  /**
   * Function for scrolling to the comment with the specified numeric id
   * (excluding prefixes like 'end') in the first comments view on the page.
   * Alternatively, the comment element can be passed as an optional parameter.
   * @param numericId The numeric id of the comment as a string. Must not contain prefixes like 'en',
   * 'end' or 'start'.
   * @param commentElement Optionally passed comment element. If omitted, the correct comment
   * element will be searched for using numericId.
   */
   scrollToComment(numericId: string, commentElement?: HTMLElement) {
    let elem = commentElement;
    if (elem === undefined || elem === null || !elem.classList.contains('en' + numericId)) {
      // Find the comment in the comments view.
      const commentsWrapper = document.querySelector('page-read:not([hidden]) comments') as HTMLElement;
      elem = commentsWrapper.getElementsByClassName('en' + numericId)[0] as HTMLElement;
    }
    if (elem !== null && elem !== undefined) {

      if (this.activeCommentHighlight.commentTimeOutId !== null) {
        // Clear previous comment highlight if still active
        this.activeCommentHighlight.commentLemmaElement.classList.remove('highlight');
        window.clearTimeout(this.activeCommentHighlight.commentTimeOutId);
      }

      // Scroll the comment into view.
      this.commonFunctions.scrollElementIntoView(elem, 'center', -5);
      const noteLemmaElem = elem.getElementsByClassName('noteLemma')[0] as HTMLElement;
      noteLemmaElem.classList.add('highlight');
      const settimeoutId = setTimeout(() => {
        noteLemmaElem.classList.remove('highlight');
        this.activeCommentHighlight = {
          commentTimeOutId: null,
          commentLemmaElement: null
        }
      }, 5000);

      this.activeCommentHighlight = {
        commentTimeOutId: settimeoutId,
        commentLemmaElement: noteLemmaElem
      }
    }
  }

}
