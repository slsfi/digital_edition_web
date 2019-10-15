import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { StaticPage } from '../../models/static-pages.model';

@Injectable()
export class MdContentService {

  private mdUrl = '/md/';
  private staticPagesURL = '/static-pages-toc/'

  constructor(private http: Http, private config: ConfigService) {
  }

  getMdContent (fileID: string): Observable<any> {
    // This is a TEMPORARY bugfix, that is solved in this way because it
    // is 11 pm and there is to be a presentation tomorrow.
    const id_parts = fileID.split('-');
    if (id_parts.length === 5 && id_parts[1] === '04') {
      // transform sv-04-01-10-1 to sv-04-01-01
      id_parts[4] = '0' + id_parts[4];
      id_parts.splice(3, 1);
      fileID = id_parts.join('-');
    }

    const url = this.config.getSettings('app.apiEndpoint') + '/' + this.config.getSettings('app.machineName') + this.mdUrl + fileID
    return this.http.get(url)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getStaticPagesToc(language: string): Observable<any> {
    const url = this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + this.staticPagesURL + language;
    return this.http.get(url)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  async getStaticPagesTocPromise(language: string): Promise<any> {
    try {
      const url = this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + this.staticPagesURL + language;
      const response = await this.http.get(url).toPromise();
      return response.json();
    } catch (e) {}
  }

  async getMarkdownMenu(lang, nodeID) {
    const jsonObjectID = `${lang}-${nodeID}`;
    const markdownData = await this.getStaticPagesTocPromise(lang);

    if (jsonObjectID) {
      const pages = this.getNodeById(jsonObjectID, markdownData);
      return pages;
    } else {
      try {
        const startIndex: number = Number(this.config.getSettings('staticPages.about_index'));
        return markdownData.children[startIndex].children;
      } catch (e) {
        return markdownData.children[3].children;
      }
    }
  }

  private getNodeById(id, node) {
    const reduce = [].reduce;
    function runner(result, rnode) {
        if (result || !rnode) { return result; }
        return rnode.id === id && rnode ||
            runner(null, rnode.children) ||
            reduce.call(Object(rnode), runner, result);
    }
    return runner(null, node);
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
