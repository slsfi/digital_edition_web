import { Component, Renderer, ElementRef, OnDestroy, ViewChild, Input, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  App, ViewController, NavController, NavParams, PopoverController, ActionSheetController,
  ToastController, ModalController, IonicPage, Events, Platform, FabContainer, Navbar
} from 'ionic-angular';
import { TranslateModule, LangChangeEvent, TranslateService, TranslatePipe } from '@ngx-translate/core';

import { ConfigService } from '@ngx-config/core';

import { ReadPopoverPage } from '../read-popover/read-popover';
import { SharePopoverPage } from '../share-popover/share-popover';

import { CommentModalPage } from '../comment-modal/comment-modal';
import { SemanticDataModalPage } from '../semantic-data-modal/semantic-data-modal';

import { global } from '../../app/global';

import { TextService } from '../../app/services/texts/text.service';
import { CommentService } from '../../app/services/comments/comment.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TooltipService } from '../../app/services/tooltips/tooltip.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { EstablishedText } from '../../app/models/established-text.model';
import { TableOfContentsCategory } from '../../app/models/table-of-contents.model';
import { TableOfContentsItem } from '../../app/models/table-of-contents-item.model';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { DragScrollDirective } from 'ngx-drag-scroll';
import { Storage } from '@ionic/storage';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { PublicationCacheService } from '../../app/services/cache/publication-cache.service';
import { TableOfContentsList } from '../../app/table-of-contents/table-of-contents';

import { Content } from 'ionic-angular';
import { ReferenceDataModalPage } from '../reference-data-modal/reference-data-modal';
import { OccurrencesPage } from '../occurrences/occurrences';
import { OccurrenceResult } from '../../app/models/occurrence.model';
import { SearchAppPage } from '../search-app/search-app';
import { SocialSharing } from '@ionic-native/social-sharing';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';

/**
 * A page used for reading publications.
 * Allows user to read established, manuscript, variation and facsimile version of a specific publication.
 * This is done with the help of components: read-text, manuscripts, variations and facsimiles.
 * Desktop version uses draggable horizontal list of cards, mobile version uses tabs.
 */

enum TextType {
  TitlePage,
  Introduction,
  ReadText
}

@IonicPage({
  name: 'read',
  segment: 'publication/:collectionID/text/:publicationID/:chapterID/:facs_id/:facs_nr/:song_id/:search_title/:urlviews'
})
@Component({
  selector: 'page-read',
  templateUrl: './read.html'
})
export class ReadPage /*implements OnDestroy*/ {
  @ViewChild('nav', { read: DragScrollDirective }) ds: DragScrollDirective;
  @ViewChild(Content) content: Content;
  @ViewChild('readColumn') readColumn: ElementRef;
  @ViewChild('scrollBar') scrollBar: ElementRef;
  @ViewChild(Navbar) navBar: Navbar;
  @ViewChild('fab') fabList: FabContainer;
  @ViewChild('settingsIconElement') settingsIconElement: ElementRef;

  listenFunc: Function;
  textType: TextType = TextType.ReadText;

  id: string;
  establishedText: EstablishedText;
  errorMessage: string;
  appName: string;
  tocRoot: TableOfContentsCategory[];
  popover: ReadPopoverPage;
  sharePopover: SharePopoverPage;
  subTitle: string;
  cacheItem = false;
  collectionTitle: string;
  hasOccurrenceResults = false;
  showOccurrencesModal = false;
  searchResult: string;
  showToolTip: boolean;
  toolTipPosition: object;
  toolTipText: string;

  maxSingleWindowWidth: Number;

  prevItem: any;
  nextItem: any;

  divWidth = '100px';

  // Used for infinite facsimile
  facs_id: any;
  facs_nr: any;
  song_id: any;
  search_title: any;

  matches: Array<string>;
  external: string;

  typeVersion: string;
  displayToggles: Object;
  displayToggle = true;

  prevnext: any;
  texts: any;

  occurrenceResult: OccurrenceResult;

  legacyId = '';
  songDatafile = '';

  views = [];
  viewsConfig = {
    slideMaxWidth: 600,
    slideMinWidth: 430,
    slidesPerView: 1.2,
    spaceBetween: 20,
    centeredSlides: false,
    pager: false
  };

  show = 'established'; // Mobile tabs

  availableViewModes = [
    'manuscripts',
    'variations',
    'comments',
    'established',
    'facsimiles',
    'introduction',
    'songexample',
    'illustrations'
  ];

  appUsesAccordionToc = false;

  tooltips = {
    'persons': {},
    'comments': {},
    'works': {},
    'places': {},
    'abbreviations': {},
    'footnotes': {}
  };

  nativeEmail() {
    // Check if sharing via email is supported
    this.socialSharing.canShareViaEmail().then(() => {
      console.log('Sharing via email is possible');

      // Share via email
      this.socialSharing.shareViaEmail('Body', 'Subject', ['recipient@example.org']).then(() => {
        // Success!
      }).catch(() => {
        // Error!
        console.log('Email error')
      });
    }).catch(() => {
      console.log('Sharing via email is not possible');
    });
  }

  constructor(private app: App,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public params: NavParams,
    private textService: TextService,
    private commentService: CommentService,
    public toastCtrl: ToastController,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private config: ConfigService,
    public popoverCtrl: PopoverController,
    public readPopoverService: ReadPopoverService,
    public actionSheetCtrl: ActionSheetController,
    public modalCtrl: ModalController,
    private sanitizer: DomSanitizer,
    private tooltipService: TooltipService,
    private tocService: TableOfContentsService,
    public translate: TranslateService,
    private langService: LanguageService,
    private events: Events,
    private platform: Platform,
    private storage: Storage,
    public semanticDataService: SemanticDataService,
    private userSettingsService: UserSettingsService,
    public publicationCacheService: PublicationCacheService,
    private socialSharing: SocialSharing
  ) {
    this.isCached();
    this.searchResult = null;

    try {
      this.appUsesAccordionToc = this.config.getSettings('AccordionTOC');
    } catch (e) {
      console.log(e);
    }

    if (this.params.get('collectionID') !== 'songtypes') {
      this.setCollectionTitle();
    }


    if (this.userSettingsService.isMobile()) {
      // this.navBar.backButtonClick
    }

    let link = null;

    this.maxSingleWindowWidth = 95;

    this.matches = [];
    this.availableViewModes = [];

    // Hide some or all of the display toggles (variations, facsimiles, established etc.)
    this.displayToggles = this.config.getSettings('settings.displayTypesToggles');
    let foundTrueCount = 0;
    for (const toggle in this.displayToggles) {
      if (this.displayToggles[toggle]) {
        this.availableViewModes.push(toggle);
        foundTrueCount++;
      }
    }
    if (foundTrueCount <= 1) {
      this.displayToggle = false;
    }

    if (this.params.get('tocItem') !== undefined && this.params.get('tocItem') !== null) {
      // @TODO: fix this. it is unmaintainable
      this.id = this.params.get('tocItem').itemId;
      const collectionIsUndefined = (this.params.get('tocItem').collection_id !== undefined);
      const linkIdIsNotUndefined = (this.params.get('tocItem').link_id !== undefined);
      const collectionID = this.params.get('tocItem').collection_id;

      link = (collectionIsUndefined ? collectionID : this.params.get('tocItem').toc_ed_id) + '_'
        + (this.params.get('tocItem').link_id || this.params.get('tocItem').toc_linkID);

    } else if (this.params.get('collectionID') !== undefined && this.params.get('id') === 'introduction') {

    } else if (this.params.get('collectionID') !== undefined && this.params.get('id') !== undefined) {
      this.id = this.params.get('id');
      link = this.params.get('collectionID') + '_' + this.id;
    }

    this.show = this.config.getSettings('defaults.ReadModeView');

    this.setDefaultViews();

    const title = global.getSubtitle();
    this.tocRoot = this.params.get('root');

    this.establishedText = new EstablishedText({ link: link, id: this.id, title: title, text: '' });

    if (this.params.get('legacyId') !== undefined) {
      this.legacyId = this.params.get('legacyId');
      this.establishedText.link = this.params.get('legacyId');
    } else {

      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
      this.establishedText.link = this.params.get('collectionID') + '_' + this.params.get('publicationID');

      if (this.params.get('chapterID') !== undefined && this.params.get('chapterID') !== 'nochapter' &&
        this.params.get('chapterID') !== ':chapterID' && this.params.get('chapterID') !== 'chapterID') {
        this.establishedText.link += '_' + this.params.get('chapterID');
      }

      this.viewCtrl.setBackButtonText('');

      if (!this.params.get('selectedItemInAccordion')) {
        const searchTocItem = true;
        this.getTocRoot(this.params.get('collectionID'), searchTocItem);
      }

      if (this.params.get('collectionID') !== 'songtypes' && !this.appUsesAccordionToc) {
        this.events.publish('pageLoaded:single-edition', { 'title': title });
      }
    }

    if (this.params.get('matches') !== undefined) {
      this.matches = this.params.get('matches');
    }

    this.setTocCache();

    this.setUpTextListeners();

    this.updateTexts()
    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.updateTexts();
    });


    /*if (this.params.get('url') !== undefined && this.params.get('url').indexOf('=') !== -1) {
      this.songID = this.params.get('url').split('=')[1];
    }*/

    if (this.params.get('song_datafile') !== undefined && this.params.get('song_datafile').indexOf('.json') !== -1) {
      //
    }

    if (this.params.get('searchResult') !== undefined) {
      this.searchResult = this.params.get('searchResult');
    }

    if (this.params.get('occurrenceResult') !== undefined && this.params.get('showOccurrencesModalOnRead')) {
      this.hasOccurrenceResults = true;
      this.showOccurrencesModal = true;
      this.occurrenceResult = this.params.get('occurrenceResult');
      this.storage.set('readpage_searchresults', this.params.get('occurrenceResult'));
    } else {
      this.storage.get('readpage_searchresults').then((occurrResult) => {
        if (occurrResult) {
          this.hasOccurrenceResults = true;
          this.occurrenceResult = occurrResult;
        }
      });
    }

    this.events.subscribe('show:view', (view, id, chapter) => {
      // user and time are the same arguments passed in `events.publish(user, time)`
      console.log('Welcome', view, 'at', id, 'chapter', chapter);
      this.openNewExternalView(view, id);
    });

    this.getAdditionalParams();
  }
  ngOnDestroy() {
    this.events.unsubscribe('show:view');
  }
  ionViewDidEnter() {
    this.events.publish('help:continue');
    (<any>window).ga('set', 'page', 'Read');
    (<any>window).ga('send', 'pageview');
  }

  getAdditionalParams() {
    if (this.params.get('facs_id') !== undefined &&
      this.params.get('facs_id') !== ':facs_id' &&
      this.params.get('facs_nr') !== undefined &&
      this.params.get('facs_nr') !== ':facs_nr' &&
      this.params.get('facs_id') !== 'not' &&
      this.params.get('facs_nr') !== 'infinite') {
      this.facs_id = this.params.get('facs_id');
      this.facs_nr = this.params.get('facs_nr');

      if (this.params.get('song_id') !== undefined &&
        this.params.get('song_id') !== ':song_id' &&
        this.params.get('song_id') !== 'nosong') {
        this.song_id = this.params.get('song_id');
      }
    } else {
      //
    }

    if (this.params.get('search_title') !== undefined &&
      this.params.get('search_title') !== ':song_id' &&
      this.params.get('search_title') !== 'searchtitle') {
      this.search_title = this.params.get('search_title');
    }
  }

  openOccurrenceResult() {
    let showOccurrencesModalOnRead = false;
    let objectType = '';

    if (this.showOccurrencesModal) {
      showOccurrencesModalOnRead = true;
    }

    if (this.params.get('objectType')) {
      objectType = this.params.get('objectType');
    }

    if (this.hasOccurrenceResults && this.occurrenceResult) {
      const occurrenceModal = this.modalCtrl.create(OccurrencesPage, {
        occurrenceResult: this.occurrenceResult,
        showOccurrencesModalOnRead: showOccurrencesModalOnRead,
        objectType: objectType
      });

      occurrenceModal.present();
    }
  }

  openSearchResult() {
    const searchModal = this.modalCtrl.create(SearchAppPage, {
      searchResult: this.searchResult
    });
    searchModal.present();
  }

  /**
   * Get collection toc.
   * Search toc item in accordion on page refresh or share.
   *
   * @param id - collectionID
   * @param searchTocItem
   */
  getTocRoot(id: string, searchTocItem?: boolean) {
    this.tocService.getTableOfContents(id)
      .subscribe(
        tocItems => {
          console.log('get toc root... --- --- in read');
          tocItems.selectedCollId = null;
          tocItems.selectedPubId = null;
          if (this.params.get('collectionID') && this.params.get('publicationID')) {
            tocItems.selectedCollId = this.params.get('collectionID');
            tocItems.selectedPubId = this.params.get('publicationID');
          }

          if ( this.params.get('chapterID') ) {
            tocItems.selectedChapterId = this.params.get('chapterID');
          }

          const tocLoadedParams = { tocItems: tocItems };

          if (searchTocItem && this.appUsesAccordionToc) {
            tocLoadedParams['searchTocItem'] = true;
            tocLoadedParams['collectionID'] = this.params.get('collectionID');
            tocLoadedParams['publicationID'] = this.params.get('publicationID');
            tocLoadedParams['chapterID'] = this.params.get('chapterID');

            if (this.search_title) {
              tocLoadedParams['search_title'] = this.search_title;
            }
          }
          this.events.publish('tableOfContents:loaded', tocLoadedParams);
          this.storage.set('toc_' + id, tocItems);
        },
        error => { this.errorMessage = <any>error });
  }

  setTocCache() {
    const id = this.params.get('collectionID');
    this.tocService.getTableOfContents(id)
      .subscribe(
        tocItems => {
          this.storage.set('toc_' + id, tocItems);
        },
        error => console.log(error)
      );
  }

  setCollectionTitle() {
    this.textService.getCollection(this.params.get('collectionID')).subscribe(
      collection => {
        this.collectionTitle = collection.name;
      },
      error => {
        console.log('could not get collection title');
      }
    );
  }

  setViews(viewmodes) {
    if (Array(viewmodes).length === 1) {
      if (viewmodes[0] === ':urlviews') {
        this.setConfigDefaultReadModeViews();
      }
    }

    if (viewmodes[0] === '' && viewmodes[1] === ':urlviews') {
      viewmodes[0] = this.show;
    }

    viewmodes.forEach(function (viewmode) {
      // set the first viewmode as default
      this.show = viewmodes[0];
      this.addView(viewmode);
    }.bind(this));
  }

  showAllViews() {
    this.availableViewModes.forEach(function (viewmode) {
      const viewTypesShown = this.getViewTypesShown();
      if (viewmode !== 'showAll' && this.viewModeShouldBeShown(viewmode) && viewTypesShown.indexOf(viewmode) === -1) {
        this.show = viewmode;
        this.addView(viewmode);
      }
    }.bind(this));
  }

  viewModeShouldBeShown(viewmode) {
    if (viewmode === 'established' && !this.displayToggles['established']) {
      return false;
    } else if (viewmode === 'comments' && !this.displayToggles['comments']) {
      return false;
    } else if (viewmode === 'facsimiles' && !this.displayToggles['facsimiles']) {
      return false;
    } else if (viewmode === 'manuscripts' && !this.displayToggles['manuscripts']) {
      return false;
    } else if (viewmode === 'variations' && !this.displayToggles['variations']) {
      return false;
    } else if (viewmode === 'introduction' && !this.displayToggles['introduction']) {
      return false;
    } else if (viewmode === 'songexample' && !this.displayToggles['songexample']) {
      return false;
    } else if (viewmode === 'illustrations' && !this.displayToggles['illustrations']) {
      return false;
    }

    return true;
  }

  /**
   * This can be used to open default views when coming from an other page.
   * It can be used for search results. Just send in nav params a list of objects,
   * where each object has 'type' and 'id' properties.
   * Example: { type: 'manuscript', id: 'the_id_to_the_specific_ms' }
   * This used for example in person-search and place-search
   *
   * If no default views needs to be opened it opens the default views set in config.json
   */
  setDefaultViews() {
    let urlViews = '';
    try {
      urlViews = this.params.get('urlviews') || '';
    } catch (e) {
      console.log(e);
    }
    const views = (urlViews + '').split('&');
    if (this.params.get('views') !== undefined) {
      this.setViewsFromSearchResults();
    } else {
      if (urlViews !== 'default' && urlViews.length > 0 && this.viewsExistInAvailableViewModes(views)) {
        this.openUrlViews(views);
      } else {
        this.setOpenedViewsFromLocalStorage();
      }
    }
  }

  openUrlViews(views) {
    this.setViews(views);

    const viewmodes = {
      views: views,
      expires: this.viewModeExpires()
    };

    this.storage.set('viewmodes', viewmodes);
  }

  viewModeExpires() {
    const today = new Date();
    const expires = new Date();
    const daysUntilExpires = this.config.getSettings('cache.viewmodes.daysUntilExpires');

    expires.setDate(today.getDate() + daysUntilExpires);

    return expires;
  }

  setOpenedViewsFromLocalStorage() {
    this.storage.get('viewmodes').then((viewmodes) => {
      const now = new Date();

      if (viewmodes && viewmodes !== undefined) {
        const hasExpired = viewmodes.expires < now;
        if (viewmodes !== undefined && viewmodes.views.length > 0 && !hasExpired && this.viewsExistInAvailableViewModes(viewmodes.views)) {
          this.setViews(viewmodes.views);
        } else {
          this.setConfigDefaultReadModeViews();
        }
      } else {
        this.setConfigDefaultReadModeViews();
      }
    });
  }

  setViewsFromSearchResults() {
    for (const v of this.params.get('views')) {
      if (v.type) {
        // console.log(`Aading view ${v.type}, ${v.id}`);
        this.addView(v.type, v.id);
      }

      if (v.type === 'manuscripts' || v.type === 'ms') {
        this.show = 'manuscripts';
        this.typeVersion = v.id;
      } else if (v.type === 'variation' || v.type === 'var') {
        this.show = 'variations';
        this.typeVersion = v.id;
      } else if ((v.type === 'comments' || v.type === 'com')) {
        this.show = 'comments';
      } else if (v.type === 'established' || v.type === 'est') {
        this.show = 'established';
      } else if (v.type === 'facsimiles' || v.type === 'facs') {
        this.show = 'facsimiles';
      } else if (v.type === 'song-example') {
        this.show = 'song-example';
      } else if (v.type === 'introduction' || v.type === 'int') {
        this.show = 'introduction';
      }
    }
  }

  /**
   * Supports also multiple deafault read-modes.
   * If there are multiple it loops through every read-mode (array of strings).
   * If it's not an array it just sets the string value it gets from config.json.
   * And if no config for this was set at all it sets established as the default.
   */
  setConfigDefaultReadModeViews() {
    const defaultReadModes: any = this.config.getSettings('defaults.ReadModeView');
    if (defaultReadModes !== undefined && defaultReadModes.length > 0) {
      if (defaultReadModes instanceof Array) {
        defaultReadModes.forEach(function (val) {
          this.show = val;
          this.addView(val);
        }.bind(this));
      } else {
        this.show = defaultReadModes;
        this.addView(defaultReadModes);
      }
    } else {
      this.addView('established');
    }
  }

  updateURL() {
    let facs_id = '';
    let facs_nr = '';
    let song_id = '';
    let search_title = '';

    if (this.params.get('facs_id') !== undefined &&
      this.params.get('facs_id') !== 'not' &&
      this.params.get('facs_id') !== ':facs_id' &&
      this.params.get('facs_nr') !== undefined &&
      this.params.get('facs_nr') !== 'infinite' &&
      this.params.get('facs_nr') !== ':facs_nr') {
      facs_id = this.params.get('facs_id');
      facs_nr = this.params.get('facs_nr');
      if (this.params.get('song_id') !== undefined &&
        this.params.get('song_id') !== ':song_id' &&
        this.params.get('song_id') !== 'nosong') {
        song_id = this.params.get('song_id');
      } else {
        song_id = 'nosong';
      }
    } else {
      facs_id = 'not';
      facs_nr = 'infinite';
      song_id = 'nosong';
    }

    let chapter_id = 'nochapter';
    if (this.params.get('chapterID') !== undefined && this.params.get('chapterID') !== 'nochapter' &&
    this.params.get('chapterID') !== ':chapterID' && this.params.get('chapterID') !== 'chapterID') {
      chapter_id = this.params.get('chapterID');
    }

    if (this.params.get('search_title') !== undefined &&
      this.params.get('search_title') !== ':song_id' &&
      this.params.get('search_title') !== 'searchtitle') {
      search_title = this.params.get('search_title');
    } else {
      search_title = 'searchtitle';
    }
    const colID = this.params.get('collectionID');
    const pubID = this.params.get('publicationID');

    const url = `#/publication/${colID}/text/${pubID}/${chapter_id}/${facs_id}/${facs_nr}/${song_id}/${search_title}/`;

    const viewModes = this.getViewTypesShown();

    // this causes problems with back, thus this check.
    if (!this.navCtrl.canGoBack() ) {
      window.history.replaceState('', '', url.concat(viewModes.join('&')));
    }
  }

  viewsExistInAvailableViewModes(viewmodes) {
    viewmodes.forEach(function (viewmode) {
      if ( this.availableViewModes.indexOf(viewmode) === -1 ) {
        return false;
      }
    }.bind(this));

    return true;
  }

  getViewTypesShown() {
    const viewModes = [];

    this.views.forEach(function (view) {
      viewModes.push(view.type);
    }.bind(this));

    return viewModes;
  }

  updateCachedViewModes() {
    const viewmodes = {
      views: this.getViewTypesShown(),
      expires: this.viewModeExpires()
    };

    this.storage.set('viewmodes', viewmodes);
  }

  isCached() {
    const collectionID = this.params.get('collectionID');
    const publicationID = this.params.get('id');
    const id = collectionID + '_' + publicationID;

    this.storage.get(id + '_cached').then((is_cached) => {
      if (is_cached) {
        this.cacheItem = true;
      } else {
        this.cacheItem = false;
      }
    });
  }

  download() {
    this.cacheItem = !this.cacheItem;

    const collectionID = this.params.get('collectionID');
    const publicationID = this.params.get('publicationID');

    if (this.cacheItem) {
      this.addToCache(collectionID, publicationID);
    } else if (!this.cacheItem) {
      this.removeFromCache(collectionID, publicationID);
    }
  }

  async addToCache(collectionID, publicationID) {
    const id = collectionID + '_' + publicationID;
    const types = ['est', 'ms', 'var'];
    const added = true;

    await this.publicationCacheService.cachePublication(collectionID, publicationID, this.collectionTitle);
    await this.storage.set(id + '_cached', true);

    if (added) {
      const status = 'Publication was successfully added to cache';
    } else {
      const status = 'Something went wrong';
    }

    const toast = this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    await toast.present();
  }

  async removeFromCache(collectionID, publicationID) {
    const id = collectionID + '_' + publicationID;
    const types = ['est', 'ms', 'var'];
    let removed = true;

    await this.publicationCacheService.removeFromCache(collectionID, publicationID);
    await this.storage.set(id + '_cached', false);

    for (let i = 0; i < types.length; i++) {
      await this.storage.get(id + '_' + types[i]).then((content) => {
        if (content) {
          removed = false;
          this.storage.set(id + '_cached', true);
        }
      });
    }

    if (removed) {
      const status = 'Publication was successfully removed from cache';
    } else {
      const status = 'Something went wrong';
    }

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    await toast.present();
  }

  ngAfterViewInit() {
    setTimeout(function () {
      try {
        const itemId = 'toc_' + this.legacyId;
        this.scrollToTOC(document.getElementById(itemId));
      } catch (e) {
        console.log(e);
      }
    }.bind(this), 1000);
    this.renderer.listen(this.elementRef.nativeElement, 'mouseover', (event) => {
      if ((event.target.parentNode.classList.contains('tooltiptrigger') || event.target.classList.contains('tooltiptrigger')) &&
        this.readPopoverService.show.changes) {
        if (event.target !== undefined) {
          this.showChangesTooltip(event);
        }
      }
    });
  }

  scrollToTOC(element: HTMLElement) {
    try {
      if (element !== null) {
        element.scrollIntoView({ 'behavior': 'smooth', 'block': 'center' });
      }
    } catch (e) {
      console.log(e);
    }
  }

  private getEventTarget(event) {
    let eventTarget: any = document.createElement('div');
    eventTarget['classList'] = [];

    if ( event.target.getAttribute('data-id') ) {
      return event.target;
    }

    if (event['target']['parentNode'] !== undefined && event['target']['parentNode']['classList'].contains('tooltiptrigger')) {
      eventTarget = event['target']['parentNode'];
    } else if (event.target !== undefined && event['target']['classList'].contains('tooltiptrigger')) {
      eventTarget = event.target;
    } else if (event.target !== undefined && eventTarget['classList'].contains('anchor')) {
      eventTarget = event.target;
    }
    return eventTarget;
  }

  private setUpTextListeners() {
    // We must do it like this since we want to trigger an event on a dynamically loaded innerhtml.
    const nElement: any = this.elementRef.nativeElement;
    this.listenFunc = this.renderer.listen(nElement, 'click', (event) => {
      const eventTarget = this.getEventTarget(event);

      if (eventTarget['classList'].contains('tooltiptrigger')) {
        if (eventTarget.hasAttribute('data-id')) {
          if (eventTarget['classList'].contains('person') && this.readPopoverService.show.personInfo) {
            this.showPersonModal(eventTarget.getAttribute('data-id'));
          } else if (eventTarget['classList'].contains('placeName') && this.readPopoverService.show.placeInfo) {
            this.showPlaceModal(eventTarget.getAttribute('data-id'));
          } else if (eventTarget['classList'].contains('title') && this.readPopoverService.show.workInfo) {
            this.showWorkModal(eventTarget.getAttribute('data-id'));
          } else if (eventTarget['classList'].contains('comment') && this.readPopoverService.show.comments) {
            this.showCommentModal(eventTarget.getAttribute('data-id'));
          } else if (eventTarget['classList'].contains('ttVariant') && this.readPopoverService.show.comments) {
            this.showCommentModal(eventTarget.getAttribute('data-id'));
          }
        } else {

        }
      } else if (eventTarget['classList'].contains('anchor')) {
        if (eventTarget.hasAttribute('href')) {
          this.scrollToElement(eventTarget.getAttribute('href'));
        }
      }
      if (event.target.classList.contains('variantScrollTarget') && this.readPopoverService.show.comments) {
        if (event.target !== undefined) {
          event.target.style.fontWeight = 'bold';
          this.showVariationTooltip(event);
          this.scrollToElement(event.target);
        }
        setTimeout(function () {
          if (event.target !== undefined) {
            event.target.style.fontWeight = 'normal';
          }
        }, 1000);
      }
      if (event.target.classList.contains('tooltiptrigger') && this.readPopoverService.show.comments) {
        if (event.target !== undefined) {
          event.target.style.fontWeight = 'bold';
        }
        setTimeout(function () {
          if (event.target !== undefined) {
            event.target.style.fontWeight = 'normal';
          }
        }, 1000);
      }
    }).bind(this);

    this.renderer.listen(nElement, 'mousewheel', (event) => {
      this.showToolTip = false;
    }).bind(this)

    let toolTipsSettings;
    try {
      toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      console.error(e);
    }
    this.renderer.listen(nElement, 'mouseover', (event) => {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const sidePaneIsOpen = document.querySelector('ion-split-pane').classList.contains('split-pane-visible');

      const eventTarget = this.getEventTarget(event);
      const elem = event.target;
      if (eventTarget['classList'].contains('tooltiptrigger')) {
        const x = ((elem.getBoundingClientRect().x + vw) - vw) + (elem.offsetWidth + 10);
        const y = ((elem.getBoundingClientRect().y + vh) - vh) - 108;
        if (sidePaneIsOpen) {
          this.toolTipPosition = {
            top: y + 'px',
            left: (x - 269) + 'px'
          };
        } else {
          this.toolTipPosition = {
            top: y + 'px',
            left: x + 'px'
          };
        }
        if (eventTarget['classList'].contains('ttVariant') && this.readPopoverService.show.comments) {
          if (event.target !== undefined) {
            this.showVariationTooltip(event);
          }
        }
        if (eventTarget.hasAttribute('data-id')) {
          if (toolTipsSettings.personInfo && eventTarget['classList'].contains('person') && this.readPopoverService.show.personInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showPersonTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.placeInfo
            && eventTarget['classList'].contains('placeName')
            && this.readPopoverService.show.placeInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showPlaceTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.workInfo
            && eventTarget['classList'].contains('title')
            && this.readPopoverService.show.workInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showWorkTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.comments && eventTarget['classList'].contains('comment') && this.readPopoverService.show.comments) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            //this.hideToolTip();
            this.showCommentTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.footNotes
            && eventTarget['classList'].contains('ttFoot')) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), event);
          }
        } else {

        }
      } else if (eventTarget['classList'].contains('anchor')) {
        if (eventTarget.hasAttribute('href')) {
          this.scrollToElement(eventTarget.getAttribute('href'));
        }
      }
    }).bind(this);


  }
  public get isIntroduction() {
    return this.textType === TextType.Introduction;
  }
  public get isReadText() {
    return this.textType === TextType.ReadText;
  }
  public get isTitlePage() {
    return this.textType === TextType.TitlePage;
  }

  private showIntroduction() {
    this.textType = TextType.Introduction;
    this.establishedText.content = '';
    this.getIntroduction(this.params.get('collectionID'), this.translate.currentLang);
  }

  hideToolTip() {
    window['reload_timer'] = setTimeout(() => {
      this.showToolTip = false;
    }, 4000);
  }

  showFootnoteTooltip(id: string, origin: any) {
    const target = document.getElementsByClassName('ttFixed');
    let foundElem: any = '';
    for (let i = 0; i < target.length; i++) {
      const elt = target[i] as HTMLElement;
      if ( elt.getAttribute('data-id') === id ) {
        foundElem = this.sanitizer.bypassSecurityTrustHtml(elt.innerHTML);
        break;
      }
    }
    this.setToolTipText(foundElem);
    this.tooltips.footnotes[id] = foundElem;
    return foundElem;
  }



  private showText() {
    this.textType = TextType.ReadText;
  }

  private showFirstText() {
    this.textType = TextType.ReadText;
    const cache_id = 'col_' + this.params.get('collectionID') + 'first_pub';
    let inCache = false;

    this.storage.get(cache_id).then((content) => {
      if (content) {
        this.establishedText = content;
        inCache = true;
      }
    });

    if (!inCache) {
      this.textService.getCollectionPublications(this.params.get('collectionID')).subscribe(
        pub => {
          this.establishedText.content = '';
          this.establishedText.title = pub[0].name;
          this.establishedText.link = pub[0].legacyId;
          this.legacyId = pub[0].legacyId;
          this.showText();
          this.storage.set(cache_id, this.establishedText);
        },
        error => {
          console.log('error');
        }
      );
    }
  }

  ionViewDidLeave() {
    this.storage.set('readpage_searchresults', undefined);
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('musicAccordion:reset', true);

    if (this.userSettingsService.isMobile()) {
      this.viewCtrl.showBackButton(true);
    } else {
      this.viewCtrl.showBackButton(false);
    }

    if (this.params.get('publicationID') === 'first') {
      this.showFirstText();
    } else {
      this.showText();
    }
    this.events.publish('pageLoaded:read', { 'title': this.establishedText.title });
  }

  updateTexts() {
    this.translate.get('Read').subscribe(
      value => {
        this.texts = value;
      }
    )
    this.langService.getLanguage().subscribe((lang) => {
      this.appName = this.config.getSettings('app.name.' + lang);
    });
  }

  back() {
    this.viewCtrl.dismiss();
  }

  setText(id, data) {

    const id2 = id.replace('_est', '');
    const parts = id2.split(';');

    let tmpContent = data;

    if (parts.length > 1) {

      let selector = '#' + parts[1];
      if (parts.length > 2) {
        selector = '.' + parts[2];
      }

      const range = document.createRange();
      const documentFragment = range.createContextualFragment(data);

      tmpContent = documentFragment.querySelector(selector).innerHTML || '';
    }

    this.establishedText.content = tmpContent.replace(/images\//g, 'assets/images/').replace(/\.png/g, '.svg');
  }

  getIntroduction(id: string, lang: string) {
    this.textService.getIntroduction(id, lang).subscribe(
      res => {
        // in order to get id attributes for tooltips
        // console.log('recieved introduction,..,', res.content);
        this.establishedText.content = this.sanitizer.bypassSecurityTrustHtml(
          res.content.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg')
        );
      },
      error => { this.errorMessage = <any>error }
    );
  }

  showPersonTooltip(id: string, origin: any) {
    if (this.tooltips.persons[id]) {
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        let text = '';
        if ( tooltip.date_born !== null || tooltip.date_deceased !== null ) {
          const date_born =  String(tooltip.date_born).split('-')[0].replace(/^0+/, '');
          const date_deceased = String(tooltip.date_deceased).split('-')[0].replace(/^0+/, '');
          let bcTranslation = 'BC';
          this.translate.get('BC').subscribe(
            translation => {
              bcTranslation = translation;
            }, error => { }
          );
          const bcIndicator = (String(tooltip.date_deceased).includes('BC')) ? ' ' + bcTranslation : '';
          text = '<b>' + tooltip.name + '</b> (' + date_born + '–' + date_deceased + '' + bcIndicator + ')';
        } else {
          text = '<b>' + tooltip.name + '</b>';
        }

        if ( tooltip.description !== null ) {
          text += ', ' + tooltip.description
        }

        this.setToolTipText(text);
        this.tooltips.persons[id] = text;
      },
      error => {
        let noInfoFound = 'Could not get person information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, err => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showVariationTooltip(origin: any) {
    if (origin.target.nextSibling.className !== undefined && String(origin.target.nextSibling.className).includes('tooltip')) {
      this.showToolTip = true;
      this.toolTipText = origin.target.nextSibling.textContent;
      clearTimeout(window['reload_timer']);
      this.hideToolTip();
    }
  }


  showChangesTooltip(origin: any) {
    let elem = [];
    if (origin.target.nextSibling !== null && origin.target.nextSibling !== undefined &&
      !String(origin.target.nextSibling.className).includes('tooltiptrigger')) {
      elem = origin.target;
    } else if (origin.target.parentNode.nextSibling !== null && origin.target.parentNode.nextSibling !== undefined) {
      elem = origin.target.parentNode;
    }
    if (elem['nextSibling'] !== null && elem['nextSibling'] !== undefined) {
      if (elem['nextSibling'].className !== undefined && String(elem['nextSibling'].className).includes('tooltip')) {
        this.showToolTip = true;
        this.toolTipText = elem['nextSibling'].textContent;
      }
    }
  }

  showPlaceTooltip(id: string, origin: any) {
    if (this.tooltips.places[id]) {
      this.setToolTipText(this.tooltips.places[id]);
      return;
    }

    this.tooltipService.getPlaceTooltip(id).subscribe(
      tooltip => {
        this.setToolTipText((tooltip.description) ?  tooltip.name + ', ' + tooltip.description : tooltip.name);
        this.tooltips.places[id] = (tooltip.description) ?  tooltip.name + ', ' + tooltip.description : tooltip.name;
      },
      error => {
        let noInfoFound = 'Could not get place information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, err => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showWorkTooltip(id: string, origin: any) {
    if (this.tooltips.works[id]) {
      this.setToolTipText(this.tooltips.works[id]);
      return;
    }
    this.semanticDataService.getSingleObjectElastic('work', id).subscribe(
      tooltip => {
        if ( tooltip.hits.hits[0] === undefined || tooltip.hits.hits[0]['_source'] === undefined ) {
          let noInfoFound = 'Could not get work information';
          this.translate.get('Occurrences.NoInfoFound').subscribe(
            translation => {
              noInfoFound = translation;
            }, err => { }
          );
          this.setToolTipText(noInfoFound);
          return;
        }
        tooltip = tooltip.hits.hits[0]['_source'];
        const description = '<span class="work_title">' + tooltip.title  + '</span><br/>' + tooltip.reference;
        this.setToolTipText(description);
        this.tooltips.works[id] = description;
      },
      error => {
        let noInfoFound = 'Could not get work information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, err => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showCommentTooltip(id: string, origin: any) {
    if (this.tooltips.comments[id]) {
      this.setToolTipText(this.tooltips.comments[id]);
      return;
    }

    id = this.establishedText.link + ';' + id;
    this.tooltipService.getCommentTooltip(id).subscribe(
      tooltip => {
        this.setToolTipText(tooltip.description);
        this.tooltips.comments[id] = tooltip.description
      },
      error => {
        this.setToolTipText('Could not get comment');
      }
    );
  }



  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  showCommentModal(id: string) {
    id = id.replace('end', 'en');
    id = this.establishedText.link + ';' + id;
    const modal = this.modalCtrl.create(
      CommentModalPage,
      { id: id, title: this.texts.CommentsFor + ' ' + this.establishedText.title },
      { showBackdrop: true });
    modal.present();
  }

  showPersonModal(id: string) {
    // const modal = this.modalCtrl.create(SemanticDataModalPage, { id: id, type: 'person' });
    // modal.present();
    const modal = this.modalCtrl.create(OccurrencesPage, { id: id, type: 'subject' });
    modal.present();
  }

  showPlaceModal(id: string) {
    const modal = this.modalCtrl.create(OccurrencesPage, { id: id, type: 'location' });
    modal.present();
  }

  showWorkModal(id: string) {
    const modal = this.modalCtrl.create(OccurrencesPage, { id: id, type: 'work' });
    modal.present();
  }

  showPopover(myEvent) {
    const popover = this.popoverCtrl.create(ReadPopoverPage, {}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
  }

  showSharePopover(myEvent) {
    const popover = this.popoverCtrl.create(SharePopoverPage, {}, { cssClass: 'share-popover' });
    popover.present({
      ev: myEvent
    });
  }

  presentDownloadActionSheet() {
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Ladda ner digital version',
      buttons: [
        {
          text: 'Epub',
          role: 'epub',
          handler: () => {
            console.log('Epub clicked');
          }
        }, {
          text: 'Kindle',
          role: 'kindle',
          handler: () => {
            console.log('Kindle clicked');
          }
        }, {
          text: 'PDF',
          role: 'pdf',
          handler: () => {
            console.log('PDF clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  openNewExternalView(view: string, id: any) {
    this.addView(view, id, null, true);
  }

  openNewView(event: any) {
    if (event.viewType === 'facsimiles') {
      this.addView(event.viewType, event.id);
    } else if (event.viewType === 'manuscriptFacsimile') {
      this.addView('facsimiles', event.id);
    } else if (event.viewType === 'facsimileManuscript') {
      this.addView('manuscripts', event.id);
    } else {
      this.addView(event.viewType, event.id);
    }
  }

  addView(type: string, id?: string, fab?: FabContainer, external?: boolean) {
    if (external === true) {
      this.external = id;
    } else {
      this.external = null;
    }
    if (this.availableViewModes.indexOf(type) !== -1) {
      this.views.push({
        content: `This is an upcoming ${type} view`,
        type,
        established: { show: (type === 'established'), id: id },
        comments: { show: (type === 'comments'), id: id },
        facsimiles: { show: (type === 'facsimiles'), id: id },
        manuscripts: { show: (type === 'manuscripts'), id: id },
        variations: { show: (type === 'variations'), id: id },
        introduction: { show: (type === 'introduction'), id: id },
        songexample: { show: (type === 'songexample'), id: id },
        illustrations: { show: (type === 'illustrations'), id: id }
      });

      this.updateURL();
      this.updateCachedViewModes();
      if (fab) {
        fab.close();
      }

      // Always open two variations if no variation is yet open
      // if (type === 'variations' && this.hasKey('variations', this.views) === false) {
      //   this.addView('variations');
      // }
    }
  }

  hasKey(nameKey: string, myArray: any) {
    for (let i = 0; i < (myArray.length - 1); i++) {
      const item: Object = myArray[i];
      if (item['variation'].show === true) {
        return true;
      }
    }
    return false;
  }

  removeSlide(i) {
    this.views.splice(i, 1);
    this.adjustSlidesSize();
    this.updateURL();
    this.updateCachedViewModes();
  }

  swipeTabs(prefix: string, id: number) {
    const elem1: HTMLElement = document.getElementById(prefix + id.toString());
    if (elem1.nextSibling !== null && elem1.nodeType === elem1.nextSibling.nodeType) {
      elem1.parentElement.insertBefore(elem1.nextSibling, elem1);
    } else if (elem1.previousSibling !== null && elem1.previousSibling.nodeType === elem1.nodeType) {
      elem1.parentElement.insertBefore(elem1, elem1.previousSibling);
    }
  }

  adjustSlidesSize() {

    let width = this.platform.width();
    const splitpane = document.querySelector('ion-split-pane');
    const splitPaneIsVisible = (splitpane.className.indexOf('split-pane-visible') >= 0);

    if (splitPaneIsVisible) {
      const splitPane = document.querySelector('ion-split-pane ion-menu.split-pane-side.menu-enabled');
      const dimensions = splitPane.getBoundingClientRect();
      width = width - dimensions.width;
    }

    if (width / this.viewsConfig.slideMinWidth < (this.views.length + 1)) {
      this.viewsConfig.slidesPerView = width / this.viewsConfig.slideMinWidth;
      this.viewsConfig.centeredSlides = true;
    } else {
      this.viewsConfig.slidesPerView = this.views.length + 1;
      this.viewsConfig.centeredSlides = false;
    }
  }

  swipePrevNext(myEvent) {
    if (myEvent.direction !== undefined) {
      if (myEvent.direction === 2) {
        this.next();
      } else if (myEvent.direction === 4) {
        this.previous();
      }
    }
  }

  async previous(test?: boolean) {
    if (this.legacyId === undefined) {
      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
    }
    const c_id = this.legacyId.split('_')[0];
    await this.storage.get('toc_' + c_id).then((toc) => {
      this.findTocItem(toc, 'prev');
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
    if (this.legacyId === undefined) {
      this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
    }
    const c_id = this.legacyId.split('_')[0];
    await this.storage.get('toc_' + c_id).then((toc) => {
      this.findTocItem(toc, 'next');
    });
    if (this.nextItem !== undefined && test !== true) {
      await this.open(this.nextItem);
    } else if (test && this.nextItem !== undefined) {
      return true;
    } else if (test && this.nextItem === undefined) {
      return false;
    }
  }

  findTocItem(toc, type?: string) {
    if (!toc) {
      return;
    }

    if (!toc.children && toc instanceof Array) {
      for (let i = 0; i < toc.length; i++) {
        if (toc[i].itemId && toc[i].itemId === this.legacyId) {
          if (type === 'next' && toc[i + 1]) {
            if (toc[i + 1].type === 'subtitle') {
              i = i + 1;
            }
            if (toc[i + 1] === undefined || i + 1 === toc.length) {
              if ((i + 1) === toc.length) {
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
              if (i === 0) {
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
      for (let j = 0; j < childs.length; j++) {
        if (childs[j] && childs[j].itemId && childs[j].itemId === this.legacyId) {

          if (childs[j + 1]) {
            if (childs[j + 1].itemId === '') {
              this.nextItem = childs[j + 2];
            } else {
              this.nextItem = childs[j + 1];
            }
          }

          if (childs[j - 1].itemId === '') {
            this.prevItem = childs[j - 2];
          } else {
            this.prevItem = childs[j - 1];
          }
        }
        if (childs[j] && childs[j].children) {
          this.findTocItem(childs[j].children, type);
        }
      }
    }
  }

  open(item) {
    const params = { tocItem: item, collection: { title: item.itemId } };
    this.storage.set('currentTOCItem', item);
    const nav = this.app.getActiveNavs();

    params['tocLinkId'] = item.itemId;
    const parts = item.itemId.split('_');
    params['collectionID'] = parts[0];
    params['publicationID'] = parts[1];

    // if (this.recentlyOpenViews !== undefined && this.recentlyOpenViews.length > 0) {
    //   params['recentlyOpenViews'] = this.recentlyOpenViews;
    // }

    console.log('Opening read from ReadPage.open()');
    nav[0].setRoot('read', params);
  }

  private scrollToElement(element: HTMLElement) {
    element.scrollIntoView();
    this.showToolTip = false;
    try {
      const elems: NodeListOf<HTMLSpanElement> = document.querySelectorAll('span');
      for (let i = 0; i < elems.length; i++) {
        if (elems[i].id === element.id) {
          elems[i].scrollIntoView();
        }
      }
    } catch (e) {

    }
  }

  keyPress(event) {
    console.log(event);
  }

  moveLeft() {
    this.ds.moveLeft();
  }

  moveRight() {
    this.ds.moveRight();
  }

  nextFacs() {
    this.events.publish('next:facsimile');
  }

  prevFacs() {
    this.events.publish('previous:facsimile');
  }

  zoomFacs() {
    this.events.publish('zoom:facsimile');
  }

  findItem(id: string, includePrevNext?: boolean): any {
    let prev: any;
    const returnData = { item: TableOfContentsItem, next: TableOfContentsItem, prev: TableOfContentsItem };

    let found = false;
    let cat, child, item;

    for (cat of this.tocRoot) {
      for (child of cat.items) {
        for (item of child.items) {
          if (found) { // we found it last iteration...
            returnData.next = item;
            return returnData;
          }

          if (item.id === id) {
            found = true;
            returnData.item = item;
            returnData.prev = prev;
            if (!includePrevNext) {
              return item;
            }
          }
          prev = item;
        }
      }
    }

    if (found) {
      return includePrevNext ? returnData : returnData.item;
    }
  }


  firstPage() {
    const c_id = this.legacyId.split('_')[0];
    const toc = this.storage.get('toc_' + c_id)
    let firstItemOfCollection;
    toc.then(val => {
      if (val.children) {
        firstItemOfCollection = val.children[1];
        // console.log(firstItemOfCollection);

        const params = {tocItem: firstItemOfCollection, collection: {title: firstItemOfCollection.itemId}};
        const nav = this.app.getActiveNavs();

        params['tocLinkId'] = firstItemOfCollection.itemId;
        const parts = firstItemOfCollection.itemId.split('_');
        params['collectionID'] = parts[0];
        params['publicationID'] = parts[1];

        console.log('Opening read from ReadPage.firstPage()');
        nav[0].setRoot('read', params);
      }
    }).catch(err => console.error(err));
  }
}
