import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MdCacheService {

  private mdCache = {};
  private docFrags = {};


  constructor() {

  }

  hasMd(id) {
    const parts = id.split(';');
    return (this.mdCache.hasOwnProperty(parts[0]) && this.docFrags.hasOwnProperty(parts[0]));
  }

  setmdCache(id, md) {
    this.mdCache[id] = md;
    const range = document.createRange();
    if (range.createContextualFragment) {

    } else {

    }
    this.docFrags[id] = range.createContextualFragment(md);
  }

  getMd(id) {
    if (this.hasMd(id)) {
      const parts = id.split(';');
      const mdId = parts[0];

      if (parts.length > 1) {

        let selector = '#' + parts[1];
        const dataIdSelector = '[data-id="' + parts[1] + '"]';
        if (parts.length > 2) {
          selector = '.' + parts[2];
        }

        if (this.docFrags[mdId].querySelector(selector)) {
          return this.docFrags[mdId].querySelector(selector).innerHTML || '';
        } else if (this.docFrags[mdId].querySelector(dataIdSelector)) {
          return this.docFrags[mdId].querySelector(dataIdSelector).innerHTML || '';
        } else {
          return this.docFrags[mdId].innerHTML || '';
        }

      } else {
        return this.mdCache[id] || false;
      }
    } else {
      return ' - no cached md - ';
    }
  }

  getMdAsObservable(id) {
    return Observable.of(this.getMd(id));
  }
}
