import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Events, App, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';

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
  lastNext: any;
  lastPrev: any;
  prevItemTitle: string;
  nextItemTitle: string;
  firstItem: boolean;
  lastItem: boolean;
  currentItemTitle: string;

  displayNext: Boolean = true;
  displayPrev: Boolean = true;

  flattened: any;
  currentToc: any;

  constructor(
    public events: Events,
    public storage: Storage,
    public app: App,
    public params: NavParams,
    private tocService: TableOfContentsService,
    private userSettingsService: UserSettingsService,
    private cf: ChangeDetectorRef
  ) {
    this.firstItem = false;
    this.lastItem = false;
    this.next(true).then(function(val) {
      this.displayNext = val;
    }.bind(this))
    this.previous(true).then(function(val) {
      this.displayPrev = val;
    }.bind(this))
    this.flattened = [];
  }

  ngOnInit() {
    this.getTocItemId();
    this.setupData();
  }

  setupData() {
    try {
      const c_id = this.legacyId.split('_')[0];
      this.tocService.getTableOfContents(c_id)
        .subscribe(
          toc => {
            if (toc !== null) {
              this.currentToc = toc;
              if (toc && toc.children) {
                for (let i = 0; i < toc.children.length; i++) {
                  if (toc.children[i].itemId.split('_')[1] === c_id) {
                    this.currentItemTitle = toc.children[i].text;
                    this.storage.set('currentTOCItemTitle', this.currentItemTitle);
                    this.nextItemTitle = String(toc.children[i + 1].text);
                    this.prevItemTitle =  String(toc.children[i - 1].text);
                  }
                }
              }
            }
          }
        );
    } catch ( e ) {}
  }

  async previous(test?: boolean) {
    this.getTocItemId();
    const c_id = this.legacyId.split('_')[0];
    this.tocService.getTableOfContents(c_id)
      .subscribe(
        toc => {
          this.findNext(toc);
        }
      );
    if (this.prevItem !== undefined && test !== true) {
      this.storage.set('currentTOCItem', this.prevItem);
      await this.open(this.prevItem);
    } else if (test && this.prevItem !== undefined) {
      return true;
    } else if (test && this.prevItem === undefined) {
      return false;
    }
  }

  async next(test?: boolean) {
    this.getTocItemId();
    const c_id = this.legacyId.split('_')[0];
    this.tocService.getTableOfContents(c_id)
      .subscribe(
        toc => {
          this.findNext(toc);
        }
      );
    if (this.nextItem !== undefined && test !== true) {
      this.storage.set('currentTOCItem', this.nextItem);
      await this.open(this.nextItem);
    }  else if (test && this.nextItem !== undefined) {
      return true;
    } else if (test && this.nextItem === undefined) {
      return false;
    }
  }

  getTocItemId() {
    if ( this.legacyId === undefined || this.legacyId === null || this.legacyId === '' ) {
      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID') ;
    }

    if ( this.params.get('chapterID') !== undefined &&
      this.params.get('chapterID') !== 'nochapter' &&
      String(this.legacyId).indexOf(this.params.get('chapterID')) === -1 &&
      String(this.params.get('chapterID')).indexOf('ch') >= 0  ) {
      this.legacyId += '_' + this.params.get('chapterID');
    }

    if ( this.params.get('tocLinkId') !== undefined ) {
      this.legacyId = this.params.get('tocLinkId');
    }
  }

  findNext(toc) {
    this.getTocItemId();
    // flatten the toc structure
    if ( this.flattened.length === 0 ) {
      this.flatten(toc);
    }
    // get the next id
    let currentId = 0;
    for (let i = 0; i < this.flattened.length; i ++) {
      if ( this.flattened[i].itemId === this.legacyId ) {
        currentId = i;
        break;
      }
    }
    let nextId, prevId = 0;
    // last item
    if ((currentId + 1) === this.flattened.length) {
      // nextId = 0; // this line makes the text-changer into a loop
      nextId = null;
    } else {
      nextId = currentId + 1;
    }

    if (currentId === 0) {
      // prevId = this.flattened.length - 1; // this line makes the text-changer into a loop
      prevId = null;
    } else {
      prevId = currentId - 1;
    }

    if (nextId !== null) {
      this.lastItem = false;
      this.nextItem = this.flattened[nextId];
      if (this.nextItem !== undefined && this.nextItem.text !== undefined) {
        this.nextItemTitle = String(this.nextItem.text);
      } else {
        this.nextItemTitle = '';
      }
    } else {
      this.lastItem = true;
      this.nextItem = null;
      this.nextItemTitle = '';
    }

    if (prevId !== null) {
      this.firstItem = false;
      this.prevItem = this.flattened[prevId];
      if (this.prevItem !== undefined && this.prevItem.text !== undefined) {
        this.prevItemTitle = String(this.prevItem.text);
      } else {
        this.prevItemTitle = '';
      }
    } else {
      this.firstItem = true;
      this.prevItem = null;
      this.prevItemTitle = '';
    }

    if (this.flattened[currentId] !== undefined) {
      this.currentItemTitle = String(this.flattened[currentId].text);
    } else {
      this.currentItemTitle = '';
    }

    this.storage.set('currentTOCItemTitle', this.currentItemTitle);
  }

  flatten(toc) {
    if (toc !== null && toc !== undefined) {
      if ( toc.children ) {
        for (let i = 0, count = toc.children.length; i < count; i++) {
          if ( toc.children[i].itemId !== undefined && toc.children[i].itemId !== '') {
            this.flattened.push(toc.children[i]);
          }
          this.flatten(toc.children[i]);
        }
      }
    }
  }

  findPrevTitle(toc, currentIndex, prevChild?) {
    if ( currentIndex === 0 ) {
      this.findPrevTitle(prevChild, prevChild.length);
    }
    for ( let i = currentIndex; i > 0; i-- ) {
      if ( toc[i - 1] !== undefined ) {
        if ( toc[i - 1].title !== 'subtitle' &&  toc[i - 1].title !== 'section_title' ) {
          return toc[i - 1];
        }
      }
    }
  }

  open(item) {
    item.selected = true;
    const params = {tocItem: item, collection: {title: item.itemId}};
    const nav = this.app.getActiveNavs();

    this.events.publish('selectOneItem', item.text);

    params['tocLinkId'] = item.itemId;
    const parts = item.itemId.split('_');
    params['collectionID'] = parts[0];
    params['publicationID'] = parts[1];
    if ( parts[2] !== undefined ) {
      params['chapterID'] = parts[2];
    }
    params['search_title'] = 'searchtitle';
    if (this.recentlyOpenViews !== undefined && this.recentlyOpenViews.length > 0) {
      params['recentlyOpenViews'] = this.recentlyOpenViews;
    }
    params['selectedItemInAccordion'] = true;
    console.log('Opening read from TextChanged.open()');
    console.log(params);
    nav[0].setRoot('read', params);
  }

}
