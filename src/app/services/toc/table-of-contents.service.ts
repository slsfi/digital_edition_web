import { Injectable } from '@angular/core';
import { LanguageService } from '../languages/language.service';
import { catchError, map, Observable, Subscription, throwError } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class TableOfContentsService {

  private tableOfContentsUrl = '/toc/';  // plus an id...
  private prevNextUrl = '/table-of-contents/';  // plus an id...
  private lang = 'sv';
  private multilingualTOC = false;
  languageSubscription?: Subscription;
  apiEndpoint: string;

  constructor(
    private config: ConfigService,
    private languageService: LanguageService
  ) {
    this.apiEndpoint = this.config.getSettings('app.apiEndpoint') as string;
    try {
      const simpleApi = this.config.getSettings('app.simpleApi');
      if (simpleApi) {
        this.apiEndpoint = simpleApi as string;
      }
    } catch (e) {
    }

    try {
      const multilingualTOC = this.config.getSettings('i18n.multilingualTOC') as boolean;
      if (multilingualTOC) {
        this.multilingualTOC = multilingualTOC;

        this.languageSubscription = this.languageService.languageSubjectChange().subscribe((lang: any) => {
          if (lang) {
            this.lang = lang;
          }
        });
      }
    } catch (e) {
    }
  }

  // TODO ngOnDestroy change to angular
  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getToc(): Observable<any> {
    return ajax('assets/toc-example.json')
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getTableOfContents (id: string) {
    let url = this.apiEndpoint + '/' +
    this.config.getSettings('app.machineName') +
    this.tableOfContentsUrl + id;

    if (this.multilingualTOC) {
      url += '/' + this.lang;
    }

    return ajax(url)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getTableOfContentsRoot (id: string): Observable<any> {
    return this.getTableOfContents(id);
  }

  getTableOfContentsGroup (id: string, group_id: string): Observable<any> {
    // @TODO add multilingual support to this as well...
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
    this.tableOfContentsUrl + id + '/group/' + group_id)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getPrevNext (id: string): Observable<any> {
    // @TODO add multilingual support to this as well...
    const arr = id.split('_');
    const ed_id = arr[0];
    const item_id = arr[1];
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') +
      this.tableOfContentsUrl + ed_id + '/prevnext/' + item_id)
          .pipe(
            map(this.extractData),
            catchError(this.handleError),
          );
  }

  getFirst (collectionID: string): Observable<any> {
        // @TODO add multilingual support to this as well...
        return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') +
        this.tableOfContentsUrl + collectionID + '/first')
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
