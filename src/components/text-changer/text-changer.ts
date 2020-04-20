import { Component, Input } from '@angular/core';
import { Events, App, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';

/**
 * Generated class for the TextChangerComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'text-changer',
  templateUrl: 'text-changer.html'
})
export class TextChangerComponent {

  @Input() legacyId: any;
  @Input() recentlyOpenViews?: any;
  prevItem: any;
  nextItem: any;

  displayNext: Boolean = true;
  displayPrev: Boolean = true;

  constructor(
    public events: Events,
    public storage: Storage,
    public app: App,
    public params: NavParams
  ) {
    this.next(true).then(function(val) {
      this.displayNext = val;
    }.bind(this))
    this.previous(true).then(function(val) {
      this.displayPrev = val;
    }.bind(this))
  }

  ngOnInit() {
  }

  async previous(test?: boolean) {
    if ( this.legacyId === undefined ) {
      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
    }
    const c_id = this.legacyId.split('_')[0];
    await this.storage.get('toc_' + c_id).then((toc) => {
      this.findItem(toc, 'prev');
    });

    if (this.prevItem !== undefined && test !== true) {
      await this.open(this.prevItem);
    } else if (test && this.prevItem !== undefined) {
      return true;
    } else if (test && this.prevItem === undefined) {
      return false;
    }
  }

  async next(test?: boolean) {
    if ( this.legacyId === undefined ) {
      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
    }
    const c_id = this.legacyId.split('_')[0];
    await this.storage.get('toc_' + c_id).then((toc) => {
      this.findItem(toc, 'next');
    });
    if (this.nextItem !== undefined && test !== true) {
      await this.open(this.nextItem);
    }  else if (test && this.nextItem !== undefined) {
      return true;
    } else if (test && this.nextItem === undefined) {
      return false;
    }
  }

  findItem(toc, type?: string) {
    if (!toc) {
      return;
    }

    if (!toc.children && toc instanceof Array) {
      for (let i = 0; i < toc.length; i ++) {
        if (toc[i].itemId && toc[i].itemId === this.legacyId) {
          if (type === 'next' && toc[i + 1]) {
            if (toc[i + 1].type === 'subtitle') {
              i = i + 1;
            }
            if (toc[i + 1] === undefined || i + 1 === toc.length) {
              if ( (i + 1) === toc.length ) {
                this.nextItem = null;
                break;
              }
            } else {
              this.nextItem = toc[i + 1];
              break;
            }
          } else if (type === 'prev' && toc[i - 1]) {
            if (toc[i - 1].type === 'subtitle') {
              i = i - 1;
            }
            if (toc[i - 1] === undefined || i === 0) {
              if ( i === 0 ) {
                this.prevItem = null;
                break;
              }
            } else {
              this.prevItem = toc[i - 1];
              break;
            }
          }
        }
      }
    } else if (toc.children) {
      const childs = toc.children;
      for (let j = 0; j < childs.length; j ++) {
        if (childs[j] && childs[j].itemId && childs[j].itemId === this.legacyId) {
        }
        if (childs[j] && childs[j].children) {
          this.findItem(childs[j].children, type);
        }
      }
    }
  }

  open(item) {
    const params = {tocItem: item, collection: {title: item.text}};
    const nav = this.app.getActiveNavs();

    params['tocLinkId'] = item.itemId;
    const parts = item.itemId.split('_');
    params['collectionID'] = parts[0];
    params['publicationID'] = parts[1];

    if (this.recentlyOpenViews !== undefined && this.recentlyOpenViews.length > 0) {
      params['recentlyOpenViews'] = this.recentlyOpenViews;
    }

    nav[0].setRoot('read', params);
  }

}
