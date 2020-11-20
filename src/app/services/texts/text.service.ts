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
      ch_id = String(`${id}`.split('_')[2]).split(';')[0];
    }

    if ( ch_id === '' ) {
      ch_id = null;
    }

    const textId = id;

    return this.http.get(  `${this.apiEndPoint}/${this.appMachineName}/text/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`)
          .map(res => {
            const body = res.json();

          try {
            if (this.config.getSettings('settings.showReadTextIllustrations')) {
              const showIllustration = this.config.getSettings('settings.showReadTextIllustrations');
              let galleryId = 44;
              try {
                galleryId = this.config.getSettings('settings.galleryCollectionMapping')[c_id];
              } catch ( err ) {

              }

              if (!showIllustration.includes(c_id)) {
                const parser = new DOMParser();
                body.content = parser.parseFromString(body.content, 'text/html');
                const images: any = body.content.querySelectorAll('img.est_figure_graphic');
                for (let i = 0; i < images.length; i++) {
                  images[i].classList.add('hide-illustration');
                }

                const s = new XMLSerializer();
                body.content = s.serializeToString(body.content);
                this.cache.setHtmlCache(textId, body.content.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`));
                const ret = this.cache.getHtml(id);
                if ( !ret ) {
                  return body.content;
                }
                return this.cache.getHtml(id);
              }
            }
          } catch (e) {
            console.error(e)
          }

          const se = new XMLSerializer();
          try {
            const parser = new DOMParser();
            body.content = parser.parseFromString(body.content, 'text/html');
            body.content = se.serializeToString(body.content);
            this.cache.setHtmlCache(textId, body.content);
          } catch ( err ) {
            console.log(err);
          }

          const cachedHTML = this.cache.getHtml(id);
          if ( cachedHTML && cachedHTML !== '' ) {
            return cachedHTML;
          } else {
            return body.content;
          }
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


  getCoverPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = (data.length > 1) ? data[1] : 1;

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/cover/' + lang)
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

  getManuscripts(id: string, chapter?: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];

    if ( chapter !== undefined && chapter !== null ) {
      chapter = String(chapter).split(';')[0];
    }

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/ms' + ((chapter) ? '/' + chapter + '' : ''))
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
