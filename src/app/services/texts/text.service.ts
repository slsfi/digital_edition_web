import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

import { TextCacheService } from './text-cache.service';

@Injectable()
export class TextService {
  private introductionUrl = '/text/{c_id}/{p_id}/inl/{lang}';
  private introductionUrlDownloadable =
    '/text/downloadable/{format}/{c_id}/inl/{lang}';

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
    private cache: TextCacheService,
    private http: HttpClient
  ) {
    this.appMachineName = this.config.getSettings('app.machineName') as string;
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint') as string;

    try {
      const simpleApi = this.config.getSettings('app.simpleApi') as string;
      if (simpleApi) {
        this.useSimpleApi = true;
        this.simpleApi = simpleApi;
      }
    } catch (e) {}

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
    if (`${id}`.split('_')[2] !== undefined) {
      ch_id = String(`${id}`.split('_')[2]).split(';')[0];
    }

    if (ch_id === '' || ch_id === 'nochapter') {
      ch_id = null;
    }

    const textId = id;

    let api = this.apiEndPoint;
    if (this.useSimpleApi) {
      api = this.simpleApi as string;
    }
    const url = `${api}/${this.appMachineName}/text/${c_id}/${pub_id}/est${
      ch_id === null ? '' : '/' + ch_id
    }`;

    return this.http.get(url).pipe(
      map((res) => {
        let body = res as any;

        try {
          let showReadTextIllustrations = [];
          try {
            showReadTextIllustrations = this.config.getSettings(
              'settings.showReadTextIllustrations'
            ) as Array<any>;
          } catch (e) {
            showReadTextIllustrations = [];
          }
          if (showReadTextIllustrations.length > 0) {
            let galleryId = 44;
            try {
              const galleries = this.config.getSettings(
                'settings.galleryCollectionMapping'
              ) as Array<any>;
              galleryId = galleries[c_id];
            } catch (err) {}

            if (!showReadTextIllustrations.includes(c_id)) {
              const parser = new DOMParser();
              body = parser.parseFromString(body, 'text/html');
              const images: any = body.querySelectorAll(
                'img.est_figure_graphic'
              );
              for (let i = 0; i < images.length; i++) {
                images[i].classList.add('hide-illustration');
              }

              const s = new XMLSerializer();
              body = s.serializeToString(body);
              if (String(body).includes('images/verk/http')) {
                body = body.replace(/images\/verk\//g, '');
              } else {
                body = body.replace(
                  /images\/verk\//g,
                  `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`
                );
              }
              this.cache.setHtmlCache(textId, body);
              const ret = this.cache.getHtml(id);
              if (!ret) {
                return body;
              }
              return this.cache.getHtml(id);
            }
          }
        } catch (e) {
          console.error(e);
        }

        const se = new XMLSerializer();
        try {
          const parser = new DOMParser();
          body = parser.parseFromString(body, 'text/html');
          body = se.serializeToString(body);
          if (String(body).includes('images/verk/http')) {
            body = body.replace(/images\/verk\//g, '');
          }
          this.cache.setHtmlCache(textId, body);
        } catch (err) {
          console.log(err);
        }

        const cachedHTML = this.cache.getHtml(id);
        if (cachedHTML && cachedHTML !== '') {
          return cachedHTML;
        } else {
          return body;
        }
      }),
      catchError(this.handleError)
    );
  }

  getIntroduction(id: string, lang: string): Observable<any> {
    const path = this.introductionUrl
      .replace('{c_id}', id)
      .replace('{p_id}', '1')
      .replace('{lang}', lang);

    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        path
    );
  }

  getCollectionAndPublicationByLegacyId(legacyId: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/legacy/' +
        legacyId
    );
  }

  getTitlePage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = data.length > 1 ? data[1] : 1;

    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/text/' +
        c_id +
        '/' +
        pub_id +
        '/tit/' +
        lang
    );
  }

  getForewordPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];

    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/text/' +
        c_id +
        '/fore/' +
        lang
    );
  }

  getCoverPage(id: string, lang: string): Observable<any> {
    const data = `${id}`.split('_');
    const c_id = data[0];
    const pub_id = data.length > 1 ? data[1] : 1;

    /**
     * ! The API endpoint below has not been implemented.
     */
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/text/' +
        c_id +
        '/' +
        pub_id +
        '/cover/' +
        lang
    );
  }

  getVariations(id: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];
    let chapter = `${id}`.split('_')[2];
    if (chapter !== undefined && chapter !== null) {
      chapter = chapter.split(';')[0];
    }
    const url =
      this.config.getSettings('app.apiEndpoint') +
      '/' +
      this.config.getSettings('app.machineName') +
      '/text/' +
      c_id +
      '/' +
      pub_id +
      '/var' +
      (chapter ? '/' + chapter + '' : '');
    return this.http.get(url);
  }

  getManuscripts(id: string, chapter?: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];

    if (chapter !== undefined && chapter !== null) {
      chapter = String(chapter).split(';')[0];
    }

    let api = this.apiEndPoint;
    if (this.useSimpleApi && this.simpleApi) {
      api = this.simpleApi;
    }

    return this.http.get(
      api +
        '/' +
        this.config.getSettings('app.machineName') +
        '/text/' +
        c_id +
        '/' +
        pub_id +
        '/ms' +
        (chapter ? '/' + chapter + '' : '')
    );
  }

  getTextByType(type: string, id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/text/' +
        type +
        '/' +
        id
    );
  }

  getCollection(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/collection/' +
        id
    );
  }

  getCollectionPublications(collection_id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/collection/' +
        collection_id +
        '/publications'
    );
  }

  getPublication(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/publication/' +
        id
    );
  }

  getLegacyIdByPublicationId(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/legacy/publication/' +
        id
    );
  }

  getLegacyIdByCollectionId(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/legacy/collection/' +
        id
    );
  }

  getDownloadableIntroduction(
    id: string,
    format: string,
    lang: string
  ): Observable<any> {
    const path = this.introductionUrlDownloadable
      .replace('{format}', format)
      .replace('{c_id}', id)
      .replace('{lang}', lang);

    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        path
    );
  }

  getDownloadableEstablishedText(id: string, format: string): Observable<any> {
    const c_id = `${id}`.split('_')[0];
    const pub_id = `${id}`.split('_')[1];
    let ch_id = null;
    if (`${id}`.split('_')[2] !== undefined) {
      ch_id = String(`${id}`.split('_')[2]).split(';')[0];
    }

    if (ch_id === '' || ch_id === 'nochapter') {
      ch_id = null;
    }

    let api = this.apiEndPoint;
    if (this.useSimpleApi && this.simpleApi) {
      api = this.simpleApi;
    }
    const url = `${api}/${
      this.appMachineName
    }/text/downloadable/${format}/${c_id}/${pub_id}/est${
      ch_id === null ? '' : '/' + ch_id
    }`;

    return this.http.get(url);
  }

  postprocessEstablishedText(text: string, collectionId: string) {
    text = this.mapIllustrationImagePaths(text, collectionId);
    text = text.replace(/\.png/g, '.svg');
    text = text.replace(
      /class=\"([a-z A-Z _ 0-9]{1,140})\"/g,
      'class="tei $1"'
    );
    text = text.replace(/images\//g, 'assets/images/');
    return text;
  }

  mapIllustrationImagePaths(text: string, collectionId: string) {
    let galleryId = 44;
    try {
      const galleries = this.config.getSettings(
        'settings.galleryCollectionMapping'
      ) as any;
      galleryId = galleries[collectionId];
    } catch (err) {}

    if (String(text).includes('images/verk/http')) {
      text = text.replace(/images\/verk\//g, '');
    } else {
      text = text.replace(
        /images\/verk\//g,
        `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`
      );
    }
    return text;
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
