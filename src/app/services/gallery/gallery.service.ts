import { Injectable } from '@angular/core';

import { LanguageService } from '../languages/language.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class GalleryService {

  private language: string;

  constructor(public languageService: LanguageService, private config: ConfigService) {
    this.language = this.config.getSettings('i18n.locale') as string;
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.getGalleries(this.language);
    });
  }

  async getGalleries(language: string): Promise<any> {
    try {
      const response = await fetch(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/gallery/data/' + language);
      return response.json();
    } catch (e) {}
  }

  async getGalleryTags(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/gallery/connections/tag' + incId);
      return response.json();
    } catch (e) { }
  }

  async getGalleryLocations(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/gallery/connections/location' + incId);
      return response.json();
    } catch (e) { }
  }

  async getGallerySubjects(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/gallery/connections/subject' + incId);
      return response.json();
    } catch (e) { }
  }

  getGallery (id: string, lang: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/gallery/data/' +
    id + '/' + lang)
      .pipe(
        map(this.extractData),
        catchError(this.handleError),
      );
  }

  getMediaMetadata (id: string, lang: String): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/media/image/metadata/' +
    id + '/' + lang)
      .pipe(
        map(this.extractData),
        catchError(this.handleError),
      );
  }

  private extractData(res: AjaxResponse<unknown>) {
    return res.response;
  }

  getGalleryOccurrences( type: any, id: any ) {
    return ajax(this.config.getSettings('app.apiEndpoint')  + '/' +
    this.config.getSettings('app.machineName') +
    '/gallery/' + type + '/connections/' + id)
       .pipe(
        map((res) => (res.response || ' - no content - ')),
        catchError(this.handleError),
       );
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
