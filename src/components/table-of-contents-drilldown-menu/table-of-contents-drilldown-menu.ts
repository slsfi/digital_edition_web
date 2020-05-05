import { Component, Input } from '@angular/core';
import { Events, App, Platform } from 'ionic-angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CoverPage } from '../../pages/cover/cover';
import { IntroductionPage } from '../../pages/introduction/introduction';
import { Storage } from '@ionic/storage';
import { TableOfContentsCategory, GeneralTocItem } from '../../app/models/table-of-contents.model';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';

/**
 * Class for the TableOfContentsDrilldownMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'table-of-contents-drilldown-menu',
  templateUrl: 'table-of-contents-drilldown-menu.html'
})
export class TableOfContentsDrilldownMenuComponent {
  root: TableOfContentsCategory[] | any;
  menuStack: any[];
  titleStack: string[];
  errorMessage: string;
  currentItem: GeneralTocItem;
  collectionId: string;
  collectionName: string;
  titleText: string;
  introText: string;
  coverSelected: boolean;
  titleSelected: boolean;

  @Input('tocData')
  set tocData(data: any) {
    //console.log('getting the tocData', data);
    if (data) {
      //this.constructToc(data);
    }
  }



  constructor(
    private events: Events,
    private tableOfContentsService: TableOfContentsService,
    private app: App,
    public platform: Platform,
    protected storage: Storage,
    public translate: TranslateService
  ) {
    console.log('drilldown constructor');
    // this.open = this.action === 'open' ? true : false;
    this.registerEventListeners();
    const nav = this.app.getActiveNavs();
    this.getTOCItem();
    this.coverSelected = false;
    this.titleSelected = false;
  }

  getTOCItem() {
    this.storage.get('currentTOCItem').then((tocItem) => {
      if (tocItem) {
        this.currentItem = tocItem;
      } else {
        this.currentItem = new GeneralTocItem();
      }
    });
  }

  constructToc(data) {
    console.log("getting datat", data);
    this.getTOCItem();
    this.root = data.tocItems.children;
    this.menuStack = [];

    if ( data.tocItems.children !== undefined ) {
      this.menuStack.push(data.tocItems.children);
    } else {
      this.menuStack.push(data.tocItems);
    }

    this.collectionId = data.tocItems.collectionId;
    this.collectionName = data.tocItems.text;

    this.titleStack = [];
    this.titleStack.push(data.tocItems.text || '');

    this.titleText = '';
    this.introText = '';

    let pushToMenu = true;
    for (let menuItemIndex = 0; menuItemIndex <= (this.menuStack[0].length - 1); menuItemIndex++) {
      const menuItem = this.menuStack[0][menuItemIndex];
      if ( menuItem.children !== undefined ) {
        for (let menuSubitemIndex = 0; menuSubitemIndex <= (menuItem.children.length - 1); menuSubitemIndex++) {
          const menuSubitem = menuItem.children[menuSubitemIndex];
          if ( this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children !== undefined ) {
            for (let menuSubSubitemIndex = 0;
              menuSubSubitemIndex <= (this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children.length - 1);
              menuSubSubitemIndex++) {
              const menuSubSubitem = menuSubitem.children[menuSubSubitemIndex];
              if ( menuSubSubitem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
                this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children[menuSubSubitemIndex].selected = true;
                if ( pushToMenu ) {
                  this.menuStack.push(this.menuStack[0][menuItemIndex].children);
                  this.menuStack.push(this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children);
                  this.titleStack.push(this.menuStack[0][menuItemIndex].children[menuSubitemIndex].text);
                  pushToMenu = false;
                }
              }
            }
          } else {
            if ( menuSubitem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
              this.menuStack[0][menuItemIndex].children[menuSubitemIndex].selected = true;
              if ( pushToMenu ) {
                this.menuStack.push(this.menuStack[0][menuItemIndex].children);
                this.titleStack.push(this.menuStack[0][menuItemIndex].text);
                pushToMenu = false;
              }
            }
          }
        }
      } else {
        if ( menuItem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
          this.menuStack[0][menuItemIndex].selected = true;
          if ( pushToMenu ) {
            this.menuStack.push(this.menuStack[0]);
            this.titleStack.push(this.menuStack[0][menuItemIndex].text);
            pushToMenu = false;
          }
        }
      }
    }

    if ( data.tocItems.coverSelected !== undefined ) {
      this.coverSelected = true;
    } else {
      this.coverSelected = false;
    }

    if ( data.tocItems.titleSelected !== undefined ) {
      this.titleSelected = true;
    } else {
      this.titleSelected = false;
    }

    this.translate.get('Read.TitlePage.Title').subscribe(
      retData => {
        this.titleText = retData;
      }, error => {

      }
    );
    this.translate.get('Read.Introduction.Title').subscribe(
      retData => {
        this.introText = retData;
      }, error => {

      }
    );
  };


  registerEventListeners() {
    this.events.subscribe('tableOfContents:loaded', this.constructToc);
  }

  drillDown(item) {
    this.menuStack.push(item.children);
    this.titleStack.push(item.text);
  }

  unDrill() {
    if ( this.menuStack.length === 2 && this.menuStack[0] === this.menuStack[1] ) {
      this.exit();
    }
    this.menuStack.pop();
    this.titleStack.pop();
  }

  open(item, type?, html?) {
    this.currentItem = item;
    this.currentItem.selected = true;
    this.storage.set('currentTOCItem', item);
    const params = {root: this.root, tocItem: item, collection: {title: item.title}};
    const nav = this.app.getActiveNavs();

    this.coverSelected = false;
    this.titleSelected = false;

    for (let menuItemIndex = 0; menuItemIndex < this.menuStack.length; menuItemIndex++) {
      const menuItem = this.menuStack[menuItemIndex];
      for (let menuSubitemIndex = 0; menuSubitemIndex < menuItem.length; menuSubitemIndex++) {
        const menuSubitem = menuItem[menuSubitemIndex];
        this.menuStack[menuItemIndex].selected = false;
        if ( menuSubitem.itemId === item.itemId) {
          this.menuStack[menuItemIndex].selected = true;
          this.menuStack[menuItemIndex][menuSubitemIndex].selected = true;
        } else {
          this.menuStack[menuItemIndex].selected = false;
          this.menuStack[menuItemIndex][menuSubitemIndex].selected = false;
        }
      }
    }

    if (item.url) {
      params['url'] = item.url;
    }

    if (item.datafile) {
      params['song_datafile'] = item.datafile;
    }

    if (item.itemId) {
      params['tocLinkId'] = item.itemId;
      const parts = item.itemId.split('_');
      params['collectionID'] = parts[0];
      params['publicationID'] = parts[1];
    }

    if ( this.currentItem['facsimilePage'] ) {
      params['facsimilePage'] = this.currentItem['facsimilePage'];
    }

    params['facs_id'] = 'not';
    params['facs_nr'] = 'infinite';
    params['song_id'] = 'nosong';

    if (type && type === 'facsimile') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;

      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }

    if (type && type === 'song-example') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;
      params['song_id'] = item.song_id;
      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }

    if ( this.platform.is('core') ) {
      this.events.publish('title-logo:show', true);
    } else {
      this.events.publish('title-logo:show', false);
    }

    nav[0].setRoot('read', params);

    try {
      this.scrollToTOC(document.getElementById(html));
    } catch ( e ) {
    }
  }

  openIntroduction() {
   const params = {root: this.root, tocItem: null, collection: {title: 'Introduction'}};
    params['collectionID'] = this.collectionId;
    const nav = this.app.getActiveNavs();
    if (this.platform.is('mobile')) {
      nav[0].push('introduction', params);
    } else {
      nav[0].setRoot('introduction', params);
    }
  }

  openTitlePage() {
    const params = {root: this.root, tocItem: null, collection: {title: 'Title Page'}};
     params['collectionID'] = this.collectionId;
     params['firstItem'] = '1';
     const nav = this.app.getActiveNavs();
     if (this.platform.is('mobile')) {
      nav[0].push('cover', params);
    } else {
      nav[0].setRoot('cover', params);
    }
  }

  private scrollToTOC(element: HTMLElement) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
    } catch ( e ) {
      console.log(e);
    }
  }

  private exit() {
    this.menuStack = [];
    this.titleStack = [];
    this.collectionId = null;
    this.collectionName = null;
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('EditionsPage', [], {animate: false, direction: 'back', animation: 'ios-transition'});
  }
}

