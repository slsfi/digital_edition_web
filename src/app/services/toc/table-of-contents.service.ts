import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { ConfigService } from '@ngx-config/core';
import { TableOfContentsCategory, GeneralTocItem } from '../../models/table-of-contents.model';
import { LanguageService } from '../languages/language.service';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class TableOfContentsService {

  private tableOfContentsUrl = '/toc/';  // plus an id...
  private prevNextUrl = '/table-of-contents/';  // plus an id...
  private lang = 'sv';
  private multilingualTOC = false;
  languageSubscription: Subscription;
  apiEndpoint: string;

  constructor(
    private http: Http,
    private config: ConfigService,
    private languageService: LanguageService
  ) {
    this.apiEndpoint = this.config.getSettings('app.apiEndpoint');
    try {
      const simpleApi = this.config.getSettings('app.simpleApi');
      if (simpleApi) {
        this.apiEndpoint = simpleApi;
      }
    } catch (e) {
    }

    try {
      const multilingualTOC = this.config.getSettings('i18n.multilingualTOC');
      if (multilingualTOC) {
        this.multilingualTOC = multilingualTOC;

        this.languageSubscription = this.languageService.languageSubjectChange().subscribe(lang => {
          if (lang) {
            this.lang = lang;
          }
        });
      }
    } catch (e) {
    }
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getToc(): Observable<any> {
    return this.http.get('assets/toc-example.json')
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getTableOfContents (id: string) {
    let url = this.apiEndpoint + '/' +
    this.config.getSettings('app.machineName') +
    this.tableOfContentsUrl + id;

    if (this.multilingualTOC) {
      url += '/' + this.lang;
    }

    return this.http.get(url)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  async getTableOfContentsPromise (id: string): Promise<any> {
    try {

      let url = this.apiEndpoint + '/' +
      this.config.getSettings('app.machineName') + id;

      if (this.multilingualTOC) {
        url += '/' + this.lang;
      }

      const response =  await this.http.get( url )
                        .toPromise();
      return response.json();
    } catch (e) {
      return [{}];
    }
  }

  getTableOfContentsRoot (id: string): Observable<any[]> {
    return this.getTableOfContents(id);
  }

  getTableOfContentsGroup (id: string, group_id: string): Observable<GeneralTocItem[]> {
    // @TODO add multilingual support to this as well...
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
                           this.config.getSettings('app.machineName') +
                           this.tableOfContentsUrl + id + '/group/' + group_id)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getPrevNext (id: string): Observable<TableOfContentsCategory[]> {
    // @TODO add multilingual support to this as well...

    const arr = id.split('_');
    const ed_id = arr[0];
    const item_id = arr[1];
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
                           this.config.getSettings('app.machineName') +
                           this.tableOfContentsUrl + ed_id + '/prevnext/' + item_id)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getFirst (collectionID: string): Observable<any[]> {
        // @TODO add multilingual support to this as well...

        return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
                               this.config.getSettings('app.machineName') +
                               this.tableOfContentsUrl + collectionID + '/first')
                        .map(this.extractData)
                        .catch(this.handleError);
  }


  private extractData(res: Response) {
    let body = [{}];
    try {
      body = res.json();
    } catch ( e ) {
    }
    return body;
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
