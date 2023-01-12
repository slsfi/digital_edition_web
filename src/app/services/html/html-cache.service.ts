import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class HtmlCacheService {

  private htmlCache: any = {};
  private docFrags: any = {};

  constructor() {

  }

  hasHtml(id: any) {
    const parts = id.split(';');
    return (this.htmlCache.hasOwnProperty(parts[0]) && this.docFrags.hasOwnProperty(parts[0]));
  }

  setHtmlCache(id: string, html: any) {
    this.htmlCache[id] = html;
    const range = document.createRange();
    this.docFrags[id] = range.createContextualFragment(html.replace(/images\//g, 'assets/images/'));
  }

  getHtml(id: any) {
    if (this.hasHtml(id)) {
      const parts = id.split(';');
      const htmlId = parts[0];

      if (parts.length > 1) {

        let selector = '#' + parts[1];
        const dataIdSelector = '[data-id="' + parts[1] + '"]';
        if (parts.length > 2) {
          selector = '.' + parts[2];
        }

        if (this.docFrags[htmlId].querySelector(selector)) {
          return this.docFrags[htmlId].querySelector(selector).innerHTML || '';
        } else if (this.docFrags[htmlId].querySelector(dataIdSelector)) {
          return this.docFrags[htmlId].querySelector(dataIdSelector).innerHTML || '';
        } else {
          return this.docFrags[htmlId].innerHTML || '';
        }

      } else {
        return this.htmlCache[id] || false;
      }
    } else {
      return '';
    }
  }

  getHtmlAsObservable(id: any) {
    return of(this.getHtml(id));
  }
}
