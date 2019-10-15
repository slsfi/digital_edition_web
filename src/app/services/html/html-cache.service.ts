import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class HtmlCacheService {

  private htmlCache = {};
  private docFrags = {};


  constructor() {

  }

  hasHtml(id) {
    const parts = id.split(';');
    return (this.htmlCache.hasOwnProperty(parts[0]) && this.docFrags.hasOwnProperty(parts[0]));
  }

  setHtmlCache(id, html) {
    this.htmlCache[id] = html;
    const range = document.createRange();
    if (range.createContextualFragment) {

    } else {

    }
    this.docFrags[id] = range.createContextualFragment(html);
  }

  getHtml(id) {
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
      return ' - no cached html - ';
    }
  }

  getHtmlAsObservable(id) {
    return Observable.of(this.getHtml(id));
  }
}
