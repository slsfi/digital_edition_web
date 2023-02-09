import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

import { TextCacheService } from './text-cache.service';

@Injectable()
export class TextService {

  private introductionUrl = '/text/{c_id}/{p_id}/inl/{lang}';
  private introductionUrlDownloadable = '/text/downloadable/{format}/{c_id}/inl/{lang}';

  textCache: any;
  apiEndPoint: string;

  simpleApi?: string;
  useSimpleApi = false;

  appMachineName: string;

  readViewTextId: string;
  previousReadViewTextId: string;
  variationsOrder: number[] = [];
  varIdsInStorage: string[] = [];
  readtextIdsInStorage: string[] = [];

  /* A more logical place for the activeTocOrder variable would be the table-of-contents service,
     but due to the way it's set up it can't be a singleton service. That's why activeTocOrder
     is in this service. */
  activeTocOrder: string;

  constructor(
    private config: ConfigService,
    private cache: TextCacheService
  ) {
    this.appMachineName = this.config.getSettings('app.machineName') as string;
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint') as string;

    try {
      const simpleApi = this.config.getSettings('app.simpleApi') as string;
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
    const c_id = `${id}`.split('_')[0] as any;
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
      api = this.simpleApi as string;
    }
    const url = `${api}/${this.appMachineName}/text/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`;

    return ajax(url)
       .pipe(
        map((res) => {
          let body = res.response as any;

          try {
            let showReadTextIllustrations = [];
            try {
              showReadTextIllustrations = this.config.getSettings('settings.showReadTextIllustrations') as Array<any>;
            } catch ( e ) {
              showReadTextIllustrations = [];
            }
            if (showReadTextIllustrations.length > 0) {
              let galleryId = 44;
              try {
                const galleries = this.config.getSettings('settings.galleryCollectionMapping') as Array<any>;
                galleryId = galleries[c_id];
              } catch ( err ) {

              }

              if (!showReadTextIllustrations.includes(c_id)) {
                const parser = new DOMParser();
                body = parser.parseFromString(body, 'text/html');
                const images: any = body.querySelectorAll('img.est_figure_graphic');
                for (let i = 0; i < images.length; i++) {
                  images[i].classList.add('hide-illustration');
                }

                const s = new XMLSerializer();
                body = s.serializeToString(body);
                if ( String(body).includes('images/verk/http') ) {
                  body = body.replace(/images\/verk\//g, '');
                } else {
                  body = body.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`);
                }
                this.cache.setHtmlCache(textId, body);
                const ret = this.cache.getHtml(id);
                if ( !ret ) {
                  return body;
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
            body = parser.parseFromString(body, 'text/html');
            body = se.serializeToString(body);
            if ( String(body).includes('images/verk/http') ) {
              body = body.replace(/images\/verk\//g, '');
            }
            this.cache.setHtmlCache(textId, body);
          } catch ( err ) {
            console.log(err);
          }

          const cachedHTML = this.cache.getHtml(id);
          if ( cachedHTML && cachedHTML !== '' ) {
            return cachedHTML;
          } else {
            return body;
          }
        }),
        catchError(this.handleError),
       );
  }

  getIntroduction(id: string, lang: string): Observable<any> {
      const path = this.introductionUrl
                    .replace('{c_id}', id)
                    .replace('{p_id}', '1')
                    .replace('{lang}', lang);

      return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
          this.config.getSettings('app.machineName') + path)
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
       );
  }

  getCollectionAndPublicationByLegacyId(legacyId: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/legacy/' + legacyId)
       .pipe(
        map((res) => {
          const data = res.response as any;
          if ( String(data).length === 0 ) {
            const legArr = legacyId.split('_');
            data[0] = [];
            data[0]['coll_id'] = legArr[0];
            data[0]['pub_id'] = legArr[1];
          }
          return data;
        }),
        catchError(this.handleError),
       );
  }

  getTitlePage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = (data.length > 1) ? data[1] : 1;

    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/tit/' + lang)
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
       );
  }

  getForewordPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];

    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/text/' + c_id + '/fore/' + lang)
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
       );
  }

  getCoverPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = (data.length > 1) ? data[1] : 1;

    /**
     * ! The API endpoint below has not been implemented.
     */
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/cover/' + lang)
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
        );
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
    return ajax(url)
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
        );
  }

  getManuscripts(id: string, chapter?: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];

    if ( chapter !== undefined && chapter !== null ) {
      chapter = String(chapter).split(';')[0];
    }

    let api = this.apiEndPoint;
    if ( this.useSimpleApi && this.simpleApi) {
      api = this.simpleApi;
    }

    return ajax(api + '/' +
    this.config.getSettings('app.machineName') + '/text/' + c_id + '/' + pub_id + '/ms' + ((chapter) ? '/' + chapter + '' : ''))
       .pipe(
        map((res) => res.response),
        catchError(this.handleError),
        );
  }

  getTextByType(type: string, id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/text/' + type + '/' + id)
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getCollection(id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/collection/' + id)
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getCollectionPublications(collection_id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/collection/' + collection_id + '/publications')
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getPublication(id: string): Observable<any> {

    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/publication/' + id)
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getLegacyIdByPublicationId(id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/legacy/publication/' + id)
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getLegacyIdByCollectionId(id: string): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + '/legacy/collection/' + id)
           .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  getDownloadableIntroduction(id: string, format: string, lang: string): Observable<any> {
    const path = this.introductionUrlDownloadable
                  .replace('{format}', format)
                  .replace('{c_id}', id)
                  .replace('{lang}', lang);
    
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') + path)
            .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
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
    if ( this.useSimpleApi && this.simpleApi) {
      api = this.simpleApi;
    }
    const url = `${api}/${this.appMachineName}/text/downloadable/${format}/${c_id}/${pub_id}/est${((ch_id === null) ? '' : '/' + ch_id)}`;

    return ajax(url)
            .pipe(
            map((res) => res.response),
            catchError(this.handleError),
            );
  }

  postprocessEstablishedText(text: string, collectionId: string) {
    text = this.mapIllustrationImagePaths(text, collectionId);
    text = text.replace(/\.png/g, '.svg');
    text = text.replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"');
    text = text.replace(/images\//g, 'assets/images/');
    return text;
  }

  mapIllustrationImagePaths(text: string, collectionId: string) {
    let galleryId = 44;
    try {
      const galleries = this.config.getSettings('settings.galleryCollectionMapping') as any;
      galleryId = galleries[collectionId];
    } catch ( err ) {}

    if ( String(text).includes('images/verk/http') ) {
      text = text.replace(/images\/verk\//g, '');
    } else {
      text = text.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`);
    }
    return text;
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
    throw errMsg;
  }

}
