import { Injectable } from '@angular/core';

import { LanguageService } from '../languages/language.service';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class GalleryService {
  private language: string;

  constructor(
    public languageService: LanguageService,
    private config: ConfigService,
    private http: HttpClient
  ) {
    this.language = this.config.getSettings('i18n.locale') as string;
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.getGalleries(this.language);
    });
  }

  async getGalleries(language: string): Promise<any> {
    try {
      const response = await fetch(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          '/gallery/data/' +
          language
      );
      return response.json();
    } catch (e) {}
  }

  async getGalleryTags(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          '/gallery/connections/tag' +
          incId
      );
      return response.json();
    } catch (e) {}
  }

  async getGalleryLocations(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          '/gallery/connections/location' +
          incId
      );
      return response.json();
    } catch (e) {}
  }

  async getGallerySubjects(id?: any): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await fetch(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          '/gallery/connections/subject' +
          incId
      );
      return response.json();
    } catch (e) {}
  }

  getGallery(id: string, lang: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/gallery/data/' +
        id +
        '/' +
        lang
    );
  }

  getMediaMetadata(id: string, lang: String): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/media/image/metadata/' +
        id +
        '/' +
        lang
    );
  }

  getGalleryOccurrences(type: any, id: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/gallery/' +
        type +
        '/connections/' +
        id
    );
  }

  private async handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = (await error.json()) || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    throw errMsg;
  }
}
