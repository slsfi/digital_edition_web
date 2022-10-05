import { Component, Input } from '@angular/core';
import { Events, App, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../app/services/languages/language.service';
import { Subscription } from 'rxjs/Subscription';

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
  @Input() parentPageType?: string;
  prevItem: any;
  nextItem: any;
  lastNext: any;
  lastPrev: any;
  prevItemTitle: string;
  nextItemTitle: string;
  firstItem: boolean;
  lastItem: boolean;
  currentItemTitle: string;
  collectionId: string;
  languageSubscription: Subscription;

  displayNext: Boolean = true;
  displayPrev: Boolean = true;

  flattened: any;
  currentToc: any;

  collectionHasCover: Boolean = false;
  collectionHasTitle: Boolean = false;
  collectionHasForeword: Boolean = false;
  collectionHasIntro: Boolean = false;

  constructor(
    public events: Events,
    public storage: Storage,
    public app: App,
    public params: NavParams,
    private config: ConfigService,
    private tocService: TableOfContentsService,
    private userSettingsService: UserSettingsService,
    public translateService: TranslateService,
    private langService: LanguageService,
  ) {
    try {
      this.collectionHasCover = this.config.getSettings('HasCover');
    } catch (e) {
      this.collectionHasCover = false;
    }
    try {
      this.collectionHasTitle = this.config.getSettings('HasTitle');
    } catch (e) {
      this.collectionHasTitle = false;
    }
    try {
      this.collectionHasForeword = this.config.getSettings('HasForeword');
    } catch (e) {
      this.collectionHasForeword = false;
    }
    try {
      this.collectionHasIntro = this.config.getSettings('HasIntro');
    } catch (e) {
      this.collectionHasIntro = false;
    }
    if (this.parentPageType === undefined) {
      this.parentPageType = 'page-read';
    }
    this.languageSubscription = null;
    /*
    this.prevItem = null;
    this.nextItem = null;
    this.prevItemTitle = '';
    this.nextItemTitle = '';
    this.currentItemTitle = '';
    this.firstItem = true;
    this.lastItem = true;
    */
  }

  ngOnInit() {
    this.legacyId = String(this.legacyId);
    this.getTocItemId();
    this.collectionId = this.legacyId.split('_')[0];
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadData() {
    this.flattened = [];

    if (this.parentPageType === 'page-cover') {
      // Initialised from page-cover
      this.translateService.get('Read.CoverPage.Title').subscribe(
        translation => {
          this.currentItemTitle = translation;
        },
        error => { this.currentItemTitle = ''; }
      );

      this.firstItem = true;
      this.lastItem = false;
      if (this.collectionHasTitle) {
        this.setPageTitleAsNext(this.collectionId);
      } else if (this.collectionHasForeword) {
        this.setPageForewordAsNext(this.collectionId);
      } else if (this.collectionHasIntro) {
        this.setPageIntroductionAsNext(this.collectionId);
      } else {
        this.setFirstTocItemAsNext(this.collectionId);
      }

    } else if (this.parentPageType === 'page-title') {
      // Initialised from page-title
      this.translateService.get('Read.TitlePage.Title').subscribe(
        translation => {
          this.currentItemTitle = translation;
        },
        error => { this.currentItemTitle = ''; }
      );

      if (this.collectionHasCover) {
        this.firstItem = false;
        this.setPageCoverAsPrevious(this.collectionId);
      } else {
        this.firstItem = true;
      }

      this.lastItem = false;
      if (this.collectionId === 'mediaCollections') {
        this.setMediaCollectionsAsNext();
      } else {
        if (this.collectionHasForeword) {
          this.setPageForewordAsNext(this.collectionId);
        } else if (this.collectionHasIntro) {
          this.setPageIntroductionAsNext(this.collectionId);
        } else {
          this.setFirstTocItemAsNext(this.collectionId);
        }
      }

    } else if (this.parentPageType === 'page-foreword') {
      // Initialised from page-foreword
      this.translateService.get('Read.ForewordPage.Title').subscribe(
        translation => {
          this.currentItemTitle = translation;
        },
        error => { this.currentItemTitle = ''; }
      );

      this.lastItem = false;
      if (this.collectionHasCover || this.collectionHasTitle) {
        this.firstItem = false;
      } else {
        this.firstItem = true;
      }

      if (this.collectionHasTitle) {
        this.setPageTitleAsPrevious(this.collectionId);
      } else if (this.collectionHasCover) {
        this.setPageCoverAsPrevious(this.collectionId);
      }

      if (this.collectionHasIntro) {
        this.setPageIntroductionAsNext(this.collectionId);
      } else {
        this.setFirstTocItemAsNext(this.collectionId);
      }

    } else if (this.parentPageType === 'page-introduction') {
      // Initialised from page-introduction
      this.translateService.get('Read.Introduction.Title').subscribe(
        translation => {
          this.currentItemTitle = translation;
        },
        error => { this.currentItemTitle = ''; }
      );

      this.lastItem = false;
      if (this.collectionHasCover || this.collectionHasTitle || this.collectionHasForeword) {
        this.firstItem = false;
      } else {
        this.firstItem = true;
      }

      if (this.collectionHasForeword) {
        this.setPageForewordAsPrevious(this.collectionId);
      } else if (this.collectionHasTitle) {
        this.setPageTitleAsPrevious(this.collectionId);
      } else if (this.collectionHasCover) {
        this.setPageCoverAsPrevious(this.collectionId);
      }
      this.setFirstTocItemAsNext(this.collectionId);

    } else {
      // Default functionality, e.g. as when initialised from page-read
      this.firstItem = false;
      this.lastItem = false;
      this.next(true).then(function(val) {
        this.displayNext = val;
      }.bind(this))
      this.previous(true).then(function(val) {
        this.displayPrev = val;
      }.bind(this))
      this.flattened = [];
      this.getTocItemId();
      this.collectionId = this.legacyId.split('_')[0];
      this.setupData(this.collectionId);
    }
  }

  setupData(collectionId: string) {
    try {
      this.tocService.getTableOfContents(collectionId)
        .subscribe(
          toc => {
            if (toc !== null) {
              this.currentToc = toc;
              if (toc && toc.children) {
                for (let i = 0; i < toc.children.length; i++) {
                  if (toc.children[i].itemId !== undefined && toc.children[i].itemId.split('_')[1] === collectionId) {
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

  setFirstTocItemAsNext(collectionId: string) {
    try {
      this.tocService.getTableOfContents(collectionId).subscribe(
        toc => {
          if (toc && toc.children && toc.collectionId === collectionId) {
            this.flatten(toc);
            for (let i = 0; i < this.flattened.length; i++) {
              if (this.flattened[i].itemId !== undefined && this.flattened[i].title !== 'subtitle'
              && this.flattened[i].title !== 'section_title') {
                this.nextItemTitle = this.flattened[i].text;
                this.nextItem = this.flattened[i];
                break;
              }
            }
          } else {
            this.nextItemTitle = '';
            this.nextItem = null;
            this.lastItem = true;
          }
        }
      );
    } catch ( e ) {
      this.nextItemTitle = '';
      this.nextItem = null;
      this.lastItem = true;
    }
  }

  setPageTitleAsNext(collectionId: string) {
    this.translateService.get('Read.TitlePage.Title').subscribe(
      translation => {
        this.nextItemTitle = translation;
        this.nextItem = {
          itemId: collectionId,
          page: 'page-title'
        };
      },
      error => {
        this.nextItemTitle = '';
        this.nextItem = null;
        this.lastItem = true;
      }
    );
  }

  setPageForewordAsNext(collectionId: string) {
    this.translateService.get('Read.ForewordPage.Title').subscribe(
      translation => {
        this.nextItemTitle = translation;
        this.nextItem = {
          itemId: collectionId,
          page: 'page-foreword'
        };
      },
      error => {
        this.nextItemTitle = '';
        this.nextItem = null;
        this.lastItem = true;
      }
    );
  }

  setPageIntroductionAsNext(collectionId: string) {
    this.translateService.get('Read.Introduction.Title').subscribe(
      translation => {
        this.nextItemTitle = translation;
        this.nextItem = {
          itemId: collectionId,
          page: 'page-introduction'
        };
      },
      error => {
        this.nextItemTitle = '';
        this.nextItem = null;
        this.lastItem = true;
      }
    );
  }

  setMediaCollectionsAsNext() {
    this.nextItemTitle = '';
    this.nextItem = {
      itemId: 'mediaCollections',
      page: 'media-collections'
    };
  }

  setPageCoverAsPrevious(collectionId: string) {
    this.translateService.get('Read.CoverPage.Title').subscribe(
      translation => {
        this.prevItemTitle = translation;
        this.prevItem = {
          itemId: collectionId,
          page: 'page-cover'
        };
      },
      error => {
        this.prevItemTitle = '';
        this.prevItem = null;
        this.firstItem = true;
      }
    );
  }

  setPageTitleAsPrevious(collectionId: string) {
    this.translateService.get('Read.TitlePage.Title').subscribe(
      translation => {
        this.prevItemTitle = translation;
        this.prevItem = {
          itemId: collectionId,
          page: 'page-title'
        };
      },
      error => {
        this.prevItemTitle = '';
        this.prevItem = null;
        this.firstItem = true;
      }
    );
  }

  setPageForewordAsPrevious(collectionId: string) {
    this.translateService.get('Read.ForewordPage.Title').subscribe(
      translation => {
        this.prevItemTitle = translation;
        this.prevItem = {
          itemId: collectionId,
          page: 'page-foreword'
        };
      },
      error => {
        this.prevItemTitle = '';
        this.prevItem = null;
        this.firstItem = true;
      }
    );
  }

  setPageIntroductionAsPrevious(collectionId: string) {
    this.translateService.get('Read.Introduction.Title').subscribe(
      translation => {
        this.prevItemTitle = translation;
        this.prevItem = {
          itemId: collectionId,
          page: 'page-introduction'
        };
      },
      error => {
        this.prevItemTitle = '';
        this.prevItem = null;
        this.firstItem = true;
      }
    );
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
    if (this.legacyId !== 'mediaCollections') {
      const c_id = this.legacyId.split('_')[0];
      this.tocService.getTableOfContents(c_id)
        .subscribe(
          toc => {
            this.findNext(toc);
          }
        );
      }
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
      // console.log('flattened toc:', this.flattened);
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

    // Set the new next, previous and current items only if on page-read in order to prevent these
    // from flashing before the new page is loaded.
    if (this.parentPageType === 'page-read') {
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
    }

    if (prevId !== null) {
      if (this.parentPageType === 'page-read') {
        this.firstItem = false;
        this.prevItem = this.flattened[prevId];
        if (this.prevItem !== undefined && this.prevItem.text !== undefined) {
          this.prevItemTitle = String(this.prevItem.text);
        } else {
          this.prevItemTitle = '';
        }
      }
    } else {
      if (this.collectionHasIntro) {
        this.firstItem = false;
        this.setPageIntroductionAsPrevious(this.collectionId);
      } else if (this.collectionHasForeword) {
        this.firstItem = false;
        this.setPageForewordAsPrevious(this.collectionId);
      } else if (this.collectionHasTitle) {
        this.firstItem = false;
        this.setPageTitleAsPrevious(this.collectionId);
      } else if (this.collectionHasCover) {
        this.firstItem = false;
        this.setPageCoverAsPrevious(this.collectionId);
      } else {
        this.firstItem = true;
        this.prevItem = null;
        this.prevItemTitle = '';
      }
    }

    if (this.parentPageType === 'page-read') {
      if (this.flattened[currentId] !== undefined) {
        this.currentItemTitle = String(this.flattened[currentId].text);
      } else {
        this.currentItemTitle = '';
      }
      this.storage.set('currentTOCItemTitle', this.currentItemTitle);
    }
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
    const nav = this.app.getActiveNavs();
    if (item.page !== undefined) {
      // Open text in page-cover, page-title or page-introduction
      if (item.page === 'page-cover') {
        const params = {root: null, tocItem: null, collection: {title: 'Cover Page'}};
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        nav[0].setRoot('cover-page', params);
      } else if (item.page === 'page-title') {
        const params = {root: null, tocItem: null, collection: {title: 'Title Page'}};
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        nav[0].setRoot('title-page', params);
      } else if (item.page === 'page-foreword') {
        const params = {root: null, tocItem: null, collection: {title: 'Foreword Page'}};
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        nav[0].setRoot('foreword-page', params);
      } else if (item.page === 'page-introduction') {
        const params = {root: null, tocItem: null, collection: {title: 'Introduction'}};
        params['collectionID'] = item.itemId;
        nav[0].setRoot('introduction', params);
      } else if (item.page === 'media-collections') {
        const params = {};
        nav[0].setRoot('media-collections', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
      }
    } else {
      // Open text in page-read
      item.selected = true;
      const params = {tocItem: item, collection: {title: item.itemId}};

      this.events.publish('selectOneItem', item.itemId);

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
      // console.log(params);
      nav[0].setRoot('read', params);
    }

  }

}
