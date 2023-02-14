import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class MdContentService {
  private mdUrl = '/md/';
  private staticPagesURL = '/static-pages-toc/';
  private apiEndpoint: string;

  constructor(private config: ConfigService, private http: HttpClient) {
    this.apiEndpoint = this.config.getSettings('app.apiEndpoint') as string;
    try {
      const simpleApi = this.config.getSettings('app.simpleApi');
      if (simpleApi) {
        this.apiEndpoint = simpleApi as string;
      }
    } catch (e) {}
  }

  getMdContent(fileID: string): Observable<any> {
    // This is a TEMPORARY bugfix, that is solved in this way because it
    // is 11 pm and there is to be a presentation tomorrow.
    const id_parts = fileID.split('-');
    if (id_parts.length === 5 && id_parts[1] === '04') {
      // transform sv-04-01-10-1 to sv-04-01-01
      id_parts[4] = '0' + id_parts[4];
      id_parts.splice(3, 1);
      fileID = id_parts.join('-');
    }

    const url =
      this.apiEndpoint +
      '/' +
      this.config.getSettings('app.machineName') +
      this.mdUrl +
      fileID;
    return this.http.get(url);
  }

  getStaticPagesToc(language: string): Observable<any> {
    const url =
      this.apiEndpoint +
      '/' +
      this.config.getSettings('app.machineName') +
      this.staticPagesURL +
      language;
    return this.http.get(url);
  }

  async getStaticPagesTocPromise(language: string): Promise<any> {
    try {
      const url =
        this.apiEndpoint +
        '/' +
        this.config.getSettings('app.machineName') +
        this.staticPagesURL +
        language;
      const response = await fetch(url);
      return response.json();
    } catch (e) {}
  }

  async getMarkdownMenu(lang: any, nodeID: any) {
    const jsonObjectID = `${lang}-${nodeID}`;
    const markdownData = await this.getStaticPagesTocPromise(lang);

    if (jsonObjectID) {
      const pages = this.getNodeById(jsonObjectID, markdownData);
      return pages;
    } else {
      try {
        const startIndex: number = Number(
          this.config.getSettings('staticPages.about_index')
        );
        return markdownData.children[startIndex].children;
      } catch (e) {
        return markdownData.children[3].children;
      }
    }
  }

  /**
   * Find a node by id in a JSON tree
   */
  getNodeById(id: any, tree: any) {
    const reduce = [].reduce;
    const runner: any = (result: any, node: any) => {
      if (result || !node) {
        return result;
      }
      return (
        (node.id === id && node) ||
        runner(null, node.children) ||
        reduce.call(Object(node), runner, result)
      );
    };
    return runner(null, tree);
  }
}
