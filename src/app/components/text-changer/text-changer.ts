import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';

/**
 * Generated class for the TextChangerComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'text-changer',
  templateUrl: 'text-changer.html',
  styleUrls: ['text-changer.scss'],
})
export class TextChangerComponent {

  @Input() recentlyOpenViews?: any;
  @Input() parentPageType?: string;
  legacyId: any;
  prevItem: any;
  nextItem: any;
  lastNext: any;
  lastPrev: any;
  prevItemTitle?: string;
  nextItemTitle?: string;
  firstItem?: boolean;
  lastItem?: boolean;
  currentItemTitle?: string;
  collectionId: string;
  languageSubscription: Subscription | null;

  displayNext: Boolean = true;
  displayPrev: Boolean = true;

  flattened: any;
  currentToc: any;

  collectionHasCover: Boolean = false;
  collectionHasTitle: Boolean = false;
  collectionHasForeword: Boolean = false;
  collectionHasIntro: Boolean = false;

  constructor(
    public events: EventsService,
    public storage: Storage,
    public params: NavParams,
    private config: ConfigService,
    public tocService: TableOfContentsService,
    public userSettingsService: UserSettingsService,
    public translateService: TranslateService,
    private langService: LanguageService,
    protected textService: TextService,
    private router: Router
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
    this.collectionId = '';
  }

  ngOnInit() {
    // console.log('textchanger init nav params: ', this.params);
    this.legacyId = '';
    this.getTocItemId();
    // console.log('textchanger legacy id after get: ', this.legacyId);
    if (this.legacyId.indexOf('_') > -1) {
      this.collectionId = this.legacyId.split('_')[0];
    } else {
      this.collectionId = this.legacyId;
    }
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.loadData();
    });

    this.events.getUpdatePositionInPageReadTextChanger().unsubscribe();
    this.events.getUpdatePositionInPageReadTextChanger().subscribe((itemId) => {
      this.setCurrentItem(itemId);
    });

    this.events.getTocActiveSorting().unsubscribe();
    this.events.getTocActiveSorting().subscribe((sortType) => {
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
      const that = this;
      this.next(true).then(function(val: any) {
        that.displayNext = val;
      }.bind(this));
      this.previous(true).then(function(val: any) {
        that.displayPrev = val;
      }.bind(this));
      // this.flattened = [];
      // this.setupData(this.collectionId);
    }
  }

  setFirstTocItemAsNext(collectionId: string) {
    try {
      this.tocService.getTableOfContents(collectionId).subscribe(
        (toc: any) => {
          if (toc && toc.children && String(toc.collectionId) === collectionId) {
            this.flatten(toc);
            if (this.textService.activeTocOrder === 'alphabetical') {
              this.sortFlattenedTocAlphabetically();
            } else if (this.textService.activeTocOrder === 'chronological') {
              this.sortFlattenedTocChronologically();
            }
            for (let i = 0; i < this.flattened.length; i++) {
              if (this.flattened[i].itemId !== undefined && this.flattened[i].type !== 'subtitle'
              && this.flattened[i].type !== 'section_title') {
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
      console.log('Unable to get first toc item as next in text-changer');
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
    this.tocService.getTableOfContents(this.collectionId).subscribe(
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
    return false;
  }

  async next(test?: boolean) {
    if (this.legacyId !== 'mediaCollections') {
      this.tocService.getTableOfContents(this.collectionId).subscribe(
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
    return false;
  }

  getTocItemId() {
    if (this.params.get('tocLinkId') !== undefined) {
      this.legacyId = this.params.get('tocLinkId');
    } else if (this.legacyId === undefined || this.legacyId === null || this.legacyId === '') {
      this.legacyId = this.params.get('collectionID');
      if (this.params.get('publicationID') !== undefined) {
        this.legacyId += '_' + this.params.get('publicationID')
        if (this.params.get('chapterID') !== undefined
        && this.params.get('chapterID') !== 'nochapter'
        && this.params.get('chapterID') !== ':chapterID'
        && this.params.get('chapterID') !== '%3AchapterID') {
          this.legacyId += '_' + this.params.get('chapterID');
        }
      }
    }
    this.legacyId = String(this.legacyId).replace('_nochapter', '').replace(':chapterID', '').replace('%3AchapterID', '');
  }

  findNext(toc: any) {
    // flatten the toc structure
    if ( this.flattened.length < 1 ) {
      this.flatten(toc);
    }
    if (this.textService.activeTocOrder === 'alphabetical') {
      this.sortFlattenedTocAlphabetically();
    } else if (this.textService.activeTocOrder === 'chronological') {
      this.sortFlattenedTocChronologically();
    }
    let itemFound = this.setCurrentPreviousAndNextItemsFromFlattenedToc();
    if (!itemFound) {
      if (this.legacyId.indexOf(';') > -1) {
        let searchTocId = this.legacyId.split(';')[0];
        // The current toc item was not found with position in legacy id, so look for toc item without position
        itemFound = this.setCurrentPreviousAndNextItemsFromFlattenedToc(searchTocId);
        if (!itemFound && this.legacyId.split(';')[0].split('_').length > 2) {
          // The current toc item was not found without position either, so look without chapter if any
          const chapterStartPos = this.legacyId.split(';')[0].lastIndexOf('_');
          searchTocId = this.legacyId.slice(0, chapterStartPos);
          itemFound = this.setCurrentPreviousAndNextItemsFromFlattenedToc(searchTocId);
        }
      }
    }
  }

  setCurrentPreviousAndNextItemsFromFlattenedToc(currentTextId = this.legacyId) {
    // get the id of the current toc item in the flattened toc array
    let currentId = 0;
    let currentItemFound = false;
    for (let i = 0; i < this.flattened.length; i ++) {
      if ( this.flattened[i].itemId === currentTextId ) {
        currentId = i;
        currentItemFound = true;
        break;
      }
    }
    let nextId = 0 as any;
    let prevId = 0 as any;
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
    return currentItemFound;
  }

  flatten(toc: any) {
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

  sortFlattenedTocAlphabetically() {
    if (this.flattened.length > 0) {
      this.flattened.sort(
        (a: any, b: any) =>
          (a.text !== undefined && b.text !== undefined) ?
            ((String(a.text).toUpperCase() < String(b.text).toUpperCase()) ? -1 :
            (String(a.text).toUpperCase() > String(b.text).toUpperCase()) ? 1 : 0) : 0
      );
    }
  }

  sortFlattenedTocChronologically() {
    if (this.flattened.length > 0) {
      this.flattened.sort((a: any, b: any) => (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0);
    }
  }

  findPrevTitle(toc: any, currentIndex: any, prevChild?: any) {
    if ( currentIndex === 0 ) {
      this.findPrevTitle(prevChild, prevChild.length);
    }
    for ( let i = currentIndex; i > 0; i-- ) {
      if ( toc[i - 1] !== undefined ) {
        if ( toc[i - 1].type !== 'subtitle' &&  toc[i - 1].type !== 'section_title' ) {
          return toc[i - 1];
        }
      }
    }
  }

  open(item: any) {
    if (item.page !== undefined) {
      // Open text in page-cover, page-title, page-foreword, page-introduction or media-collections
      if (item.page === 'page-cover') {
        const params = {root: null, tocItem: null, collection: {title: 'Cover Page'}} as any;
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        this.router.navigate(['/cover-page'], { queryParams: params });
      } else if (item.page === 'page-title') {
        const params = {root: null, tocItem: null, collection: {title: 'Title Page'}} as any;
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        this.router.navigate(['/title-page'], { queryParams: params });
      } else if (item.page === 'page-foreword') {
        const params = {root: null, tocItem: null, collection: {title: 'Foreword Page'}} as any;
        params['collectionID'] = item.itemId;
        params['firstItem'] = '1';
        this.router.navigate(['/foreword-page'], { queryParams: params });
      } else if (item.page === 'page-introduction') {
        const params = {root: null, tocItem: null, collection: {title: 'Introduction'}} as any;
        params['collectionID'] = item.itemId;
        this.router.navigate(['/introduction'], { queryParams: params });
      } else if (item.page === 'media-collections') {
        const params = {};
        this.router.navigate(['/media-collections'], { queryParams: params });
      }
    } else {
      // Open text in page-read
      item.selected = true;
      const params = {tocItem: item, collection: {title: item.text}} as any;

      this.events.publishSelectOneItem(item.itemId);

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

      if (this.textService.readViewTextId && item.itemId.split('_').length > 1 && item.itemId.indexOf(';') > -1
      && item.itemId.split(';')[0] === this.textService.readViewTextId.split(';')[0]) {
        // The read page we are navigating to is just a different position in the text that is already open
        // --> no need to reload page-read, just scroll to correct position
        console.log('Text-changer setting new position in page-read');
        this.setCurrentItem(item.itemId);
        this.events.publishUpdatePositionInPageRead(params);
      } else {
        console.log('Opening read from TextChanger.open()');
        this.router.navigate(['/read'], { queryParams: params });
      }
    }

  }

  setCurrentItem(itemId: string) {
    this.legacyId = itemId;
    if (this.legacyId.indexOf('_') > -1) {
      this.collectionId = this.legacyId.split('_')[0];
    } else {
      this.collectionId = this.legacyId;
    }
    if (this.flattened.length < 1) {
      this.tocService.getTableOfContents(this.collectionId).subscribe(
        toc => {
          this.flatten(toc);
          this.setCurrentPreviousAndNextItemsFromFlattenedToc();
        }
      );
    } else {
      this.setCurrentPreviousAndNextItemsFromFlattenedToc();
    }
  }

  /*
  setupData(collectionId: string) {
    try {
      this.tocService.getTableOfContents(collectionId)
        .subscribe(
          toc => {
            if (toc !== null) {
              this.currentToc = toc;
              if (toc && toc.children && toc.collectionId === collectionId) {
                for (let i = 0; i < toc.children.length; i++) {
                  if (toc.children[i].itemId !== undefined && toc.children[i].itemId === this.legacyId) {
                    this.currentItemTitle = toc.children[i].text;
                    this.storage.set('currentTOCItemTitle', this.currentItemTitle);
                    if (toc.children[i + 1] && toc.children[i + 1].text) {
                      this.nextItemTitle = String(toc.children[i + 1].text);
                    } else {
                      this.nextItemTitle = '';
                      this.lastItem = true;
                    }
                    if (toc.children[i - 1] && toc.children[i - 1].text) {
                      this.prevItemTitle =  String(toc.children[i - 1].text);
                    } else {
                      this.prevItemTitle = '';
                      this.firstItem = true;
                    }
                  }
                }
              }
            }
          }
        );
    } catch ( e ) {}
  }
  */

}
