import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { TextCacheService } from './text-cache.service';

@Injectable()
export class TextService {

  private introductionUrl = '/text/{c_id}/{p_id}/inl/{lang}';
  private introductionUrlDownloadable = '/text/downloadable/{format}/{c_id}/inl/{lang}';

  textCache: any;
  apiEndPoint: string;

  simpleApi: string;
  useSimpleApi = false;

  appMachineName: string;

  readViewTextId: string;
  previousReadViewTextId: string;
  variationsOrder: number[] = [];
  varIdsInStorage: string[] = [];
  readtextIdsInStorage: string[] = [];

  /* activeTocOrder variable should be in table-of-contents.service, but due to the way that service
     is set up the variable doesn't become global and shared across components there. */
  activeTocOrder: string;

  constructor(private http: Http, private config: ConfigService, private cache: TextCacheService) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');

    try {
      const simpleApi = this.config.getSettings('app.simpleApi');
      if (simpleApi) {
        this.useSimpleApi = true;
        this.simpleApi = simpleApi;
      }
    } catch (e) {
    }

    this.readViewTextId = '';
    this.previousReadViewTextId = '';
    this.variationsOrder = [];
    this.varIdsInStorage = [];
    this.readtextIdsInStorage = [];

    this.activeTocOrder = 'thematic';
  }

  getEstablishedText(id: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];
    let ch_id = null;
    if ( `${id}`.split('_')[2] !== undefined ) {
      ch_id = String(`${id}`.split('_')[2]).split(';')[0];
    }

    if ( ch_id === '' || ch_id === 'nochapter' ) {
      ch_id = null;
    }

    const textId = id;

    let api = this.apiEndPoint
    if ( this.useSimpleApi) {
      api = this.simpleApi;
    }
    const url = `${api}/${this.appMachineName}/text/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`;

    return this.http.get( url )
          .map(res => {
            const body = res.json();

          try {
            let showReadTextIllustrations = [];
            try {
              showReadTextIllustrations = this.config.getSettings('settings.showReadTextIllustrations');
            } catch ( e ) {
              showReadTextIllustrations = [];
            }
            if (showReadTextIllustrations.length > 0) {
              let galleryId = 44;
              try {
                galleryId = this.config.getSettings('settings.galleryCollectionMapping')[c_id];
              } catch ( err ) {

              }

              if (!showReadTextIllustrations.includes(c_id)) {
                const parser = new DOMParser();
                body.content = parser.parseFromString(body.content, 'text/html');
                const images: any = body.content.querySelectorAll('img.est_figure_graphic');
                for (let i = 0; i < images.length; i++) {
                  images[i].classList.add('hide-illustration');
                }

                const s = new XMLSerializer();
                body.content = s.serializeToString(body.content);
                if ( String(body.content).includes('images/verk/http') ) {
                  body.content = body.content.replace(/images\/verk\//g, '');
                } else {
                  body.content = body.content.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`);
                }
                this.cache.setHtmlCache(textId, body.content);
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
            if ( String(body.content).includes('images/verk/http') ) {
              body.content = body.content.replace(/images\/verk\//g, '');
            }
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
          const data = res.json();
          if ( String(data).length === 0 ) {
            const legArr = legacyId.split('_');
            data[0] = [];
            data[0]['coll_id'] = legArr[0];
            data[0]['pub_id'] = legArr[1];
          }
          return data;
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

  getForewordPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/fore/' + lang)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getCoverPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = (data.length > 1) ? data[1] : 1;

    /**
     * ! The API endpoint below has not been implemented.
     */
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
    let chapter = `${id}`.split('_')[2];
    if (chapter !== undefined && chapter !== null) {
        chapter = chapter.split(';')[0];
    }
    const url = this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/var' + ((chapter) ? '/' + chapter + '' : '');
    return this.http.get( url )
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

    let api = this.apiEndPoint;
    if ( this.useSimpleApi) {
      api = this.simpleApi;
    }

    return this.http.get(  api + '/' +
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

  getLegacyIdByPublicationId(id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/legacy/publication/' + id)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getLegacyIdByCollectionId(id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/legacy/collection/' + id)
        .map(res => {
          return res.json();
        })
        .catch(this.handleError);
  }

  getDownloadableIntroduction(id: string, format: string, lang: string): Observable<any> {
    const path = this.introductionUrlDownloadable
                  .replace('{format}', format)
                  .replace('{c_id}', id)
                  .replace('{lang}', lang);

    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + path)
        .map(res => {
          const body = res.json();
          return body.content;
        })
        .catch(this.handleError);
  }

  getDownloadableEstablishedText(id: string, format: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];
    let ch_id = null;
    if ( `${id}`.split('_')[2] !== undefined ) {
      ch_id = String(`${id}`.split('_')[2]).split(';')[0];
    }

    if ( ch_id === '' || ch_id === 'nochapter' ) {
      ch_id = null;
    }

    let api = this.apiEndPoint
    if ( this.useSimpleApi) {
      api = this.simpleApi;
    }
    const url = `${api}/${this.appMachineName}/text/downloadable/${format}/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`;

    return this.http.get( url )
          .map(res => {
            const body = res.json();
            return body.content;
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
