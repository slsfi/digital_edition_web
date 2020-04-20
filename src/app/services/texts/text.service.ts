import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { TextCacheService } from './text-cache.service';

@Injectable()
export class TextService {

  private readTextUrl = '/text/est/';
  private introductionUrl = '/text/{c_id}/{p_id}/inl/{lang}';
  private titlePageUrl = '/text/tit/';
  private variationsUrl = '/text/var/';
  private manuscriptsUrl = '/text/ms/';
  private illustrationsImage: string;

  textCache: any;
  apiEndPoint: string;
  appMachineName: string;

  constructor(private http: Http, private config: ConfigService, private cache: TextCacheService) {

  }


  getEstablishedText(id: string): Observable<any> {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    const id2 = id.replace('_est', '');
    const parts = id2.split(';');
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];
    let ch_id = null;
    if ( `${id}`.split('_')[2] !== undefined ) {
      ch_id = `${id}`.split('_')[2];
    }
    const textId = parts[0];

    return this.http.get(  `${this.apiEndPoint}/${this.appMachineName}/text/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`)
          .map(res => {
            const body = res.json();
            this.cache.setHtmlCache(textId, body.content.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/19/`));
            return this.cache.getHtml(id);
          })
          .catch(this.handleError);
  }

  getIntroduction(id: string, lang: string): Observable<any> {
      const path = this.introductionUrl
                    .replace('{c_id}', id)
                    .replace('{p_id}', '1')
                    .replace('{lang}', lang);

      return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
          this.config.getSettings('app.machineName') + path)
          .map(res => {
            return res.json();
          })
          .catch(this.handleError);
  }

  getCollectionAndPublicationByLegacyId(legacyId: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/legacy/' + legacyId)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getTitlePage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = (data.length > 1) ? data[1] : 1;

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/tit/' + lang)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getVariations(id: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/var')
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getManuscripts(id: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/ms')
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getTextByType(type: string, id: string): Observable<any> {

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + type + '/' + id)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getCollection(id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/collection/' + id)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getCollectionPublications(collection_id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/collection/' + collection_id + '/publications')
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getPublication(id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/publication/' + id)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  giveIllustrationsImage(url: string) {
    this.illustrationsImage = url;
  }

  getIllustrationsImage() {
    return this.illustrationsImage;
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
