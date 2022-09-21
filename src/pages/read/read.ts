import { Component, Renderer2, ElementRef, OnDestroy, ViewChild, Input, EventEmitter, SecurityContext, NgZone } from '@angular/core';
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
import { DownloadTextsModalPage } from '../download-texts-modal/download-texts-modal';
import { OccurrencesPage } from '../occurrences/occurrences';
import { OccurrenceResult } from '../../app/models/occurrence.model';
import { SearchAppPage } from '../search-app/search-app';
import { SocialSharing } from '@ionic-native/social-sharing';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

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

  textType: TextType = TextType.ReadText;

  id: string;
  multilingualEST: false;
  estLanguages = [];
  estLang: 'none';
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
  toolTipsSettings: Record<string, any> = {};
  toolTipPosType: string;
  toolTipPosition: object;
  toolTipMaxWidth: string;
  toolTipScaleValue: number;
  toolTipText: string;
  tooltipVisible: Boolean = false;
  infoOverlayPosType: string;
  infoOverlayPosition: object;
  infoOverlayWidth: string;
  infoOverlayText: string;
  infoOverlayTitle: string;
  intervalTimerId: number;
  nochapterPos: string;
  userIsTouching: Boolean = false;
  collectionAndPublicationLegacyId: string;
  illustrationsViewShown: Boolean = false;
  simpleWorkMetadata: Boolean;
  showURNButton: Boolean;
  showDisplayOptionsButton: Boolean = true;
  showTextDownloadButton: Boolean = false;
  usePrintNotDownloadIcon: Boolean = false;
  backdropWidth: number;

  prevItem: any;
  nextItem: any;

  divWidth = '100px';

  private unlistenFirstTouchStartEvent: () => void;
  private unlistenClickEvents: () => void;
  private unlistenMouseoverEvents: () => void;
  private unlistenMouseoutEvents: () => void;

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

  show = 'established'; // Mobile tabs

  availableViewModes = [
    'manuscripts',
    'variations',
    'comments',
    'established',
    'facsimiles',
    'introduction',
    'songexample',
    'illustrations',
    'legend'
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
    private renderer2: Renderer2,
    private ngZone: NgZone,
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
    private socialSharing: SocialSharing,
    private analyticsService: AnalyticsService
  ) {
    this.isCached();
    this.searchResult = null;

    this.toolTipPosType = 'fixed';
    this.toolTipMaxWidth = null;
    this.toolTipScaleValue = null;
    this.toolTipPosition = {
      top: 0 + 'px',
      left: -1500 + 'px'
    };
    this.infoOverlayText = '';
    this.infoOverlayTitle = '';
    this.infoOverlayWidth = null;
    this.infoOverlayPosType = 'fixed';
    this.infoOverlayPosition = {
      bottom: 0 + 'px',
      left: -1500 + 'px'
    };
    this.intervalTimerId = 0;

    this.backdropWidth = 0;

    try {
      this.appUsesAccordionToc = this.config.getSettings('AccordionTOC');
    } catch (e) {
      console.log(e);
    }

    try {
      const i18n = this.config.getSettings('i18n');
      console.log('i18n: ', i18n);

      if (i18n.multilingualEST !== undefined) {
        this.multilingualEST = i18n.multilingualEST;
      } else {
        this.multilingualEST = false;
      }
      if (i18n.estLanguages !== undefined) {
        this.estLanguages = i18n.estLanguages;
        this.estLang = i18n.estLanguages[0];
      } else {
        this.estLanguages = [];
        this.estLang = 'none';
      }
    } catch (e) {
      this.multilingualEST = false;
      this.estLanguages = [];
      this.estLang = 'none';
      console.error(e);
    }

    try {
      this.showURNButton = this.config.getSettings('showURNButton.pageRead');
    } catch (e) {
      this.showURNButton = true;
    }

    try {
      this.showDisplayOptionsButton = this.config.getSettings('showDisplayOptionsButton.pageRead');
    } catch (e) {
      this.showDisplayOptionsButton = true;
    }

    try {
      const textDownloadOptions = this.config.getSettings('textDownloadOptions');
      if (textDownloadOptions.enabledEstablishedFormats !== undefined &&
        textDownloadOptions.enabledEstablishedFormats !== null &&
        Object.keys(textDownloadOptions.enabledEstablishedFormats).length !== 0) {
          for (const [key, value] of Object.entries(textDownloadOptions.enabledEstablishedFormats)) {
            if (`${value}`) {
              this.showTextDownloadButton = true;
              break;
            }
          }
      }
      if (!this.showTextDownloadButton) {
        if (textDownloadOptions.enabledCommentsFormats !== undefined &&
          textDownloadOptions.enabledCommentsFormats !== null &&
          Object.keys(textDownloadOptions.enabledCommentsFormats).length !== 0) {
            for (const [key, value] of Object.entries(textDownloadOptions.enabledCommentsFormats)) {
              if (`${value}`) {
                this.showTextDownloadButton = true;
                break;
              }
            }
        }
      }
      if (textDownloadOptions.usePrintNotDownloadIcon !== undefined) {
        this.usePrintNotDownloadIcon = textDownloadOptions.usePrintNotDownloadIcon;
      }
    } catch (e) {
      this.showTextDownloadButton = false;
    }

    // Hide some or all of the display toggles (variations, facsimiles, established etc.)
    this.displayToggles = this.config.getSettings('settings.displayTypesToggles');

    try {
      this.toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      this.toolTipsSettings = undefined;
    }

    this.show = this.config.getSettings('defaults.ReadModeView');
  }

  ionViewDidLoad() {
    this.langService.getLanguage().subscribe(lang => {
      if (this.params.get('collectionID') !== 'songtypes') {
        this.setCollectionTitle();
      }


      if (this.userSettingsService.isMobile()) {
        // this.navBar.backButtonClick
      }

      let link = null;

      this.matches = [];
      this.availableViewModes = [];


      let foundTrueCount = 0;
      for (const toggle in this.displayToggles) {
        if (this.displayToggles[toggle] && toggle !== 'introduction') {
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



      const title = global.getSubtitle();
      this.tocRoot = this.params.get('root');
      this.establishedText = new EstablishedText({ link: link, id: this.id, title: title, text: '' });

      if (this.params.get('legacyId') !== undefined) {
        this.legacyId = this.params.get('legacyId');
        this.establishedText.link = this.params.get('legacyId');
      } else {

        this.legacyId = this.params.get('collectionID') + '_' + this.params.get('publicationID');
        this.establishedText.link = this.params.get('collectionID') + '_' + this.params.get('publicationID');

        if (this.params.get('chapterID') !== undefined && !this.params.get('chapterID').startsWith('nochapter') &&
        this.params.get('chapterID') !== ':chapterID' && this.params.get('chapterID') !== 'chapterID') {
          this.establishedText.link += '_' + this.params.get('chapterID');
        }

        if (this.params.get('chapterID') !== undefined && this.params.get('chapterID').startsWith('nochapter;')) {
          this.nochapterPos = this.params.get('chapterID').replace('nochapter;', '');
        } else {
          this.nochapterPos = null;
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

      // Save the id of the previous and current read view text in textService.
      if (this.establishedText && this.establishedText.link) {
        this.textService.previousReadViewTextId = this.textService.readViewTextId;
        this.textService.readViewTextId = this.establishedText.link;
      }

      if (this.params.get('matches') !== undefined) {
        this.matches = this.params.get('matches');
      }

      this.setDefaultViews();

      this.setTocCache();

      this.updateTexts();

      this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
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
    });
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
    if ( this.establishedText !== undefined && this.establishedText.title !== undefined ) {
      this.events.publish('pageLoaded:read', { 'title': this.establishedText.title });
    }

    this.setUpTextListeners();
    this.setCollectionAndPublicationLegacyId();
  }

  ionViewDidEnter() {
    this.events.publish('help:continue');
    this.analyticsService.doPageView('Read');
  }

  ionViewWillLeave() {
    this.unlistenClickEvents();
    this.unlistenMouseoverEvents();
    this.unlistenMouseoutEvents();
    this.unlistenFirstTouchStartEvent();
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewDidLeave() {
    this.storage.set('readpage_searchresults', undefined);
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(function () {
        try {
          const itemId = 'toc_' + this.establishedText.link;
          let foundElem = document.getElementById(itemId);
          if (foundElem === null) {
            // Scroll to toc item without position
            foundElem = document.getElementById(itemId.split(';').shift());
          }
          this.scrollToTOC(foundElem);
        } catch (e) {
          console.log(e);
        }
      }.bind(this), 1000);
    });
    this.setFabBackdropWidth();
  }

  ngOnDestroy() {
    this.events.unsubscribe('show:view');
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
          tocItems.selectedCollId = null;
          tocItems.selectedPubId = null;
          if (this.params.get('collectionID') && this.params.get('publicationID')) {
            tocItems.selectedCollId = this.params.get('collectionID');
            tocItems.selectedPubId = this.params.get('publicationID');
          }

          /** @TODO If the chapterID contains a position which is not in the TOC
           *  the search for correct toc item will fail. If there is a position,
           *  and the search doesn't find matches, the chapterID should be stripped
           *  of position and a new search for toc item be carried out.
           *
           *  Also, refreshing pages with nochapter doesn't select the correct toc
           *  item.
           */
          const chIDFromParams = this.params.get('chapterID');
          if (chIDFromParams !== undefined
          && chIDFromParams !== null
          && !chIDFromParams.startsWith('nochapter')
          && chIDFromParams !== ':chapterID'
          && chIDFromParams !== 'chapterID') {
            tocItems.selectedChapterId = chIDFromParams;
          } else {
            tocItems.selectedChapterId = '';
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

    let variationsViewOrderNumber = 0;
    let sameCollection = false;
    // Check if the same collection as the previous time page-read was loaded.
    if (this.textService.readViewTextId.split('_')[0] === this.textService.previousReadViewTextId.split('_')[0]) {
      sameCollection = true;
    } else {
      // A different collection than last time page-read was loaded --> clear read-texts and variations
      // stored in storage and variationsOrder array in textService.
      console.log('Clearing cached read-texts and variations from storage');
      this.clearReadtextsFromStorage();
      this.textService.variationsOrder = [];
      this.clearVariationsFromStorage();
    }

    viewmodes.forEach(function (viewmode) {
      // set the first viewmode as default
      this.show = viewmodes[0];

      // check if it is similar to established_sv
      const parts = viewmode.split('_');
      if (parts.length > 1) {
        this.addView(parts[0], null, null, null, null, parts[1]);
      } else {
        if (viewmode === 'variations') {
          // this.addView(viewmode, null, null, null, null, null, variationsViewOrderNumber);
          if (sameCollection && this.textService.variationsOrder.length > 0) {
            this.addView(viewmode, null, null, null, null, null, this.textService.variationsOrder[variationsViewOrderNumber]);
          } else {
            this.addView(viewmode, null, null, null, null, null, variationsViewOrderNumber);
            this.textService.variationsOrder.push(variationsViewOrderNumber);
          }
          variationsViewOrderNumber++;
        } else {
          this.addView(viewmode);
        }
      }
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
    } else if (viewmode === 'legend' && !this.displayToggles['legend']) {
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
        let defaultReadModeForMobileSelected = false;
        defaultReadModes.forEach(function (val) {
          if (!defaultReadModeForMobileSelected && this.displayToggles[val]) {
            /* Sets the default view on mobile to the first default read mode view which is available. */
            this.show = val;
            defaultReadModeForMobileSelected = true;
          }
          this.addView(val);
        }.bind(this));
      } else {
        this.show = defaultReadModes;
        this.addView(defaultReadModes);
      }
    } else {
      this.show = 'established';
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
    if (this.params.get('chapterID') !== undefined && !this.params.get('chapterID').startsWith('nochapter') &&
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

    if (viewModes.includes('illustrations')) {
      this.illustrationsViewShown = true;
    } else {
      this.illustrationsViewShown = false;
    }

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

  scrollToTOC(element: HTMLElement) {
    try {
      if (element !== null) {
        this.scrollElementIntoView(element);
      }
    } catch (e) {
      console.log(e);
    }
  }

  private getEventTarget(event) {
    let eventTarget: HTMLElement = document.createElement('div');

    if (event.target.hasAttribute('data-id')) {
      return event.target;
    }
    try {
      if (event.target !== undefined && event.target !== null) {
        if (event.target['classList'] !== undefined && event.target['classList'].contains('tooltiptrigger')) {
          eventTarget = event.target;
        } else if (event['target']['parentNode'] !== undefined && event['target']['parentNode'] !== null
        && event['target']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['classList'].contains('tooltiptrigger')) {
          eventTarget = event['target']['parentNode'];
        } else if (event['target']['parentNode']['parentNode'] !== undefined && event['target']['parentNode']['parentNode'] !== null
        && event['target']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['parentNode']['classList'].contains('tooltiptrigger')) {
          eventTarget = event['target']['parentNode']['parentNode'];
        } else if (event['target']['classList'] !== undefined && event['target']['classList'].contains('anchor')) {
          eventTarget = event.target;
        } else if (event['target']['classList'] !== undefined && event['target']['classList'].contains('variantScrollTarget')) {
          eventTarget = event.target;
        } else if (event['target']['parentNode'] !== undefined && event['target']['parentNode'] !== null
        && event['target']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['classList'].contains('variantScrollTarget')) {
          eventTarget = event['target']['parentNode'];
        } else if (event['target']['parentNode']['parentNode'] !== undefined && event['target']['parentNode']['parentNode'] !== null
        && event['target']['parentNode']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['parentNode']['classList'].contains('variantScrollTarget')) {
          eventTarget = event['target']['parentNode']['parentNode'];
        } else if (event['target']['classList'] !== undefined && event['target']['classList'].contains('anchorScrollTarget')) {
          eventTarget = event.target;
        } else if (event['target']['parentNode'] !== undefined && event['target']['parentNode'] !== null
        && event['target']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['classList'].contains('anchorScrollTarget')) {
          eventTarget = event['target']['parentNode'];
        } else if (event['target']['classList'] !== undefined && event['target']['classList'].contains('extVariantsTrigger')) {
          eventTarget = event.target;
        } else if (event['target']['parentNode'] !== undefined && event['target']['parentNode'] !== null
        && event['target']['parentNode']['classList'] !== undefined
        && event['target']['parentNode']['classList'].contains('extVariantsTrigger')) {
          eventTarget = event['target']['parentNode'];
        }
      }
    } catch (e) {
      console.log('Error resolving event target in getEventTarget() in read.ts');
      console.error(e);
    }
    return eventTarget;
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CHECK ONCE IF THE USER IF TOUCHING THE SCREEN */
      this.unlistenFirstTouchStartEvent = this.renderer2.listen(nElement, 'touchstart', (event) => {
        this.userIsTouching = true;
        // Don't listen for mouseover and mouseout events since they should have no effect on touch devices
        this.unlistenMouseoverEvents();
        this.unlistenMouseoutEvents();
        this.unlistenFirstTouchStartEvent();
      });

      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        if (!this.userIsTouching) {
          this.ngZone.run(() => {
            this.hideToolTip();
          });
        }
        let eventTarget = this.getEventTarget(event);
        let modalShown = false;

        // Modal trigger for person-, place- or workinfo and info overlay trigger for footnote and comment.
        // Loop needed for finding correct tooltip trigger when there are nested triggers.
        while (!modalShown && eventTarget['classList'].contains('tooltiptrigger')) {
          if (eventTarget.hasAttribute('data-id')) {
            if (eventTarget['classList'].contains('person')
            && this.readPopoverService.show.personInfo) {
              this.ngZone.run(() => {
                this.showPersonModal(eventTarget.getAttribute('data-id'));
              });
              modalShown = true;
            } else if (eventTarget['classList'].contains('placeName')
            && this.readPopoverService.show.placeInfo) {
              this.ngZone.run(() => {
                this.showPlaceModal(eventTarget.getAttribute('data-id'));
              });
              modalShown = true;
            } else if (eventTarget['classList'].contains('title')
            && this.readPopoverService.show.workInfo) {
              this.ngZone.run(() => {
                this.showWorkModal(eventTarget.getAttribute('data-id'));
              });
              modalShown = true;
            } else if (eventTarget['classList'].contains('comment')
            && this.readPopoverService.show.comments) {
              /* The user has clicked a comment lemma ("asterisk") in the reading-text.
                Check if comments view is shown. */
              const viewTypesShown = this.getViewTypesShown();
              const commentsViewIsShown = viewTypesShown.includes('comments');
              if (commentsViewIsShown && this.userSettingsService.isDesktop()) {
                // Scroll to comment in comments view and scroll lemma in reading-text view.
                const numId = eventTarget.getAttribute('data-id').replace( /^\D+/g, '');
                const targetId = 'start' + numId;
                let lemmaStart = document.querySelector('read-text').querySelector('[data-id="' + targetId + '"]') as HTMLElement;
                if (lemmaStart.parentElement !== null && lemmaStart.parentElement.classList.contains('ttFixed')) {
                  // The lemma is in a footnote, so we should get the second element with targetId.
                  lemmaStart = document.querySelector('read-text').querySelectorAll('[data-id="' + targetId + '"]')[1] as HTMLElement;
                }
                if (lemmaStart !== null && lemmaStart !== undefined) {
                  // Scroll to start of lemma in reading text and temporarily prepend arrow.
                  this.scrollToCommentLemma(lemmaStart);
                  // Scroll to comment in the comments-column.
                  const commentSettimeoutId = this.scrollToComment(numId);
                }
              } else {
                // If a comments view isn't shown or viewmode is mobile, show comment in infoOverlay.
                this.ngZone.run(() => {
                  this.showCommentInfoOverlay(eventTarget.getAttribute('data-id'), eventTarget);
                });
              }
              modalShown = true;
            } else if (eventTarget['classList'].contains('ttFoot') && eventTarget['classList'].contains('teiManuscript')) {
              // Footnote reference clicked in manuscript column
              this.ngZone.run(() => {
                this.showManuscriptFootnoteInfoOverlay(eventTarget.getAttribute('data-id'), eventTarget);
              });
              modalShown = true;
            } else if (eventTarget['classList'].contains('ttFoot')) {
              // Footnote reference clicked in reading text
              this.ngZone.run(() => {
                this.showFootnoteInfoOverlay(eventTarget.getAttribute('data-id'), eventTarget);
              });
              modalShown = true;
            }
          } else if ((eventTarget['classList'].contains('ttChanges')
          && this.readPopoverService.show.changes)
          || (eventTarget['classList'].contains('ttNormalisations')
          && this.readPopoverService.show.normalisations)
          || (eventTarget['classList'].contains('ttAbbreviations')
          && this.readPopoverService.show.abbreviations)) {
            this.ngZone.run(() => {
              this.showInfoOverlayFromInlineHtml(eventTarget);
            });
            modalShown = true;
          } else if (eventTarget['classList'].contains('ttMs')
          || eventTarget['classList'].contains('tooltipMs')) {
            if (eventTarget['classList'].contains('unclear') || eventTarget['classList'].contains('gap')) {
              /* Editorial note about unclear text, should be clickable only in
                 the reading text column. */
              let parentElem: HTMLElement = eventTarget as HTMLElement;
              parentElem = parentElem.parentElement;
              while (parentElem !== null && parentElem.tagName !== 'READ-TEXT') {
                parentElem = parentElem.parentElement;
              }
              if (parentElem !== null) {
                this.ngZone.run(() => {
                  this.showInfoOverlayFromInlineHtml(eventTarget);
                });
                modalShown = true;
              }
            }
          } else if (eventTarget.hasAttribute('id')
          && eventTarget['classList'].contains('ttFoot')
          && eventTarget['classList'].contains('teiVariant')) {
            // Footnote reference clicked in variant.
            this.ngZone.run(() => {
              this.showVariantFootnoteInfoOverlay(eventTarget.getAttribute('id'), eventTarget);
            });
            modalShown = true;
          } else if (eventTarget['classList'].contains('ttFoot')
          && !eventTarget.hasAttribute('id')
          && !eventTarget.hasAttribute('data-id')) {
            this.ngZone.run(() => {
              this.showInfoOverlayFromInlineHtml(eventTarget);
            });
            modalShown = true;
          } else if (eventTarget['classList'].contains('ttComment')) {
            console.log('comment');
            this.ngZone.run(() => {
              this.showInfoOverlayFromInlineHtml(eventTarget);
            });
            modalShown = true;
          }

          /* Get the parent node of the event target for the next iteration
             if a modal or infoOverlay hasn't been shown already. This is
             for finding nested tooltiptriggers, i.e. a person can be a
             child of a change. */
          if (!modalShown) {
            eventTarget = eventTarget['parentNode'];
            if (!eventTarget['classList'].contains('tooltiptrigger')
            && eventTarget['parentNode']['classList'].contains('tooltiptrigger')) {
              /* The parent isn't a tooltiptrigger, but the parent of the parent
                 is, use it for the next iteration. */
              eventTarget = eventTarget['parentNode'];
            }
          }
        }

        eventTarget = this.getEventTarget(event);
        if (eventTarget['classList'].contains('variantScrollTarget') || eventTarget['classList'].contains('anchorScrollTarget')) {
          // Click on variant lemma --> highlight and scroll all variant columns.

          eventTarget.classList.add('highlight');
          this.ngZone.run(() => {
            this.scrollToVariant(eventTarget);
          });
          window.setTimeout(function(elem) {
            elem.classList.remove('highlight');
          }.bind(null, eventTarget), 5000);
        } else if (eventTarget['classList'].contains('extVariantsTrigger')) {
          // Click on trigger for showing links to external variants
          if (eventTarget.nextElementSibling !== null && eventTarget.nextElementSibling !== undefined) {
            if (eventTarget.nextElementSibling.classList.contains('extVariants')
            && !eventTarget.nextElementSibling.classList.contains('show-extVariants')) {
              eventTarget.nextElementSibling.classList.add('show-extVariants');
            } else if (eventTarget.nextElementSibling.classList.contains('extVariants')
            && eventTarget.nextElementSibling.classList.contains('show-extVariants')) {
              eventTarget.nextElementSibling.classList.remove('show-extVariants');
            }
          }
        }

        // Possibly click on link.
        eventTarget = event.target as HTMLElement;
        if (eventTarget !== null && !eventTarget.classList.contains('xreference')) {
          eventTarget = eventTarget.parentElement;
          if (eventTarget !== null) {
            if (!eventTarget.classList.contains('xreference')) {
              eventTarget = eventTarget.parentElement;
            }
          }
        }

        if (eventTarget !== null && eventTarget.classList.contains('xreference')) {
          event.preventDefault();
          const anchorElem: HTMLAnchorElement = eventTarget as HTMLAnchorElement;

          if (eventTarget.classList.contains('footnoteReference')) {
            // Link to (foot)note reference in the same text.
            let targetId = '';
            if (anchorElem.hasAttribute('href')) {
              targetId = anchorElem.getAttribute('href');
            } else if (anchorElem.parentElement && anchorElem.parentElement.hasAttribute('href')) {
              targetId = anchorElem.parentElement.getAttribute('href');
            }

            if (targetId) {
              let targetColumnId = '';
              if (anchorElem.className.includes('targetColumnId_')) {
                for (let i = 0; i < anchorElem.classList.length; i++) {
                  if (anchorElem.classList[i].startsWith('targetColumnId_')) {
                    targetColumnId = anchorElem.classList[i].replace('targetColumnId_', '');
                  }
                }
              }

              // Find the containing scrollable element.
              let containerElem = null;
              if (targetColumnId) {
                containerElem = document.getElementById(targetColumnId);
              } else {
                containerElem = anchorElem.parentElement;
                while (containerElem !== null && containerElem.parentElement !== null &&
                !(containerElem.classList.contains('scroll-content') &&
                containerElem.parentElement.tagName === 'ION-SCROLL')) {
                  containerElem = containerElem.parentElement;
                }
                if (containerElem.parentElement === null) {
                  containerElem = null;
                }
                if (containerElem === null) {
                  // Check if a footnotereference link in infoOverlay. This method is used to find the container element if in mobile mode.
                  if (anchorElem.parentElement !== null
                  && anchorElem.parentElement.parentElement !== null
                  && anchorElem.parentElement.parentElement.hasAttribute('class')
                  && anchorElem.parentElement.parentElement.classList.contains('infoOverlayContent')) {
                    containerElem = document.querySelector('.mobile-mode-read-content > .scroll-content > ion-scroll > .scroll-content');
                  }
                }
              }

              if (containerElem !== null) {
                let dataIdSelector = '[data-id="' + String(targetId).replace('#', '') + '"]';
                if (anchorElem.classList.contains('teiVariant')) {
                  // Link to (foot)note reference in variant, uses id-attribute instead of data-id.
                  dataIdSelector = '[id="' + String(targetId).replace('#', '') + '"]';
                }
                const target = containerElem.querySelector(dataIdSelector) as HTMLElement;
                if (target !== null) {
                  this.scrollToHTMLElement(target, 'top');
                }
              }
            }
          } else if (anchorElem.classList.contains('ref_variant')) {
            // Click on link to another variant text
            const sid = 'sid-' + anchorElem.href.split(';sid-')[1];
            const varTargets = Array.from(document.querySelectorAll('#' + sid));

            if (varTargets.length > 0) {
              this.scrollElementIntoView(anchorElem);
              anchorElem.classList.add('highlight');
              window.setTimeout(function(elem) {
                elem.classList.remove('highlight');
              }.bind(null, anchorElem), 5000);

              varTargets.forEach(function(varTarget: HTMLElement) {
                this.scrollElementIntoView(varTarget);
                if (varTarget.firstElementChild !== null
                  && varTarget.firstElementChild !== undefined) {
                  if (varTarget.firstElementChild.classList.contains('var_margin')) {
                    const marginElem = varTarget.firstElementChild;

                    // Highlight all children of the margin element that have the ref_variant class
                    const refVariants = Array.from(marginElem.querySelectorAll('.ref_variant'));
                    refVariants.forEach(function(refVariant: HTMLElement) {
                      refVariant.classList.add('highlight');
                      window.setTimeout(function(elem) {
                        elem.classList.remove('highlight');
                      }.bind(null, refVariant), 5000);
                    });

                    if (marginElem.firstElementChild !== null && marginElem.firstElementChild !== undefined
                      && marginElem.firstElementChild.classList.contains('extVariantsTrigger')) {
                        marginElem.firstElementChild.classList.add('highlight');
                        window.setTimeout(function(elem) {
                          elem.classList.remove('highlight');
                        }.bind(null, marginElem.firstElementChild), 5000);
                    }
                  }
                }
              }.bind(this));
            }

          } else if (anchorElem.classList.contains('ref_external')) {
            // Link to external web page, open in new window/tab.
            if (anchorElem.hasAttribute('href')) {
              window.open(anchorElem.href, '_blank');
            }

          } else {
            // Link to a reading-text, comment or introduction.
            // Get the href parts for the targeted text.
            const hrefLink = anchorElem.href;
            const hrefTargetItems: Array<string> = decodeURIComponent(String(hrefLink).split('/').pop()).trim().split(' ');
            let publicationId = '';
            let textId = '';
            let chapterId = '';
            let positionId = '';

            if (anchorElem.classList.contains('ref_readingtext') || anchorElem.classList.contains('ref_comment')) {
              // Link to reading text or comment.

              let comparePageId = '';

              if (hrefTargetItems.length === 1 && hrefTargetItems[0].startsWith('#')) {
                // If only a position starting with a hash, assume it's in the same publication, text and chapter.
                publicationId = this.establishedText.link.split(';').shift().split('_')[0];
                textId = this.establishedText.link.split(';').shift().split('_')[1];
                chapterId = this.params.get('chapterID');
                if (chapterId !== undefined
                  && chapterId !== null
                  && !chapterId.startsWith('nochapter')
                  && chapterId !== ':chapterID'
                  && chapterId !== 'chapterID') {
                    chapterId = chapterId.split(';').shift();
                } else {
                  chapterId = '';
                }
                if (chapterId !== '') {
                  comparePageId = publicationId + '_' + textId + '_' + chapterId;
                } else {
                  comparePageId = publicationId + '_' + textId;
                }
              } else if (hrefTargetItems.length > 1) {
                publicationId = hrefTargetItems[0];
                textId = hrefTargetItems[1];
                comparePageId = publicationId + '_' + textId;
                if (hrefTargetItems.length > 2 && !hrefTargetItems[2].startsWith('#')) {
                  chapterId = hrefTargetItems[2];
                  comparePageId += '_' + chapterId;
                }
              }

              let legacyPageId = this.collectionAndPublicationLegacyId;
              const chIDFromParams = this.params.get('chapterID');
              if (chIDFromParams !== undefined
              && chIDFromParams !== null
              && !chIDFromParams.startsWith('nochapter')
              && chIDFromParams !== ':chapterID'
              && chIDFromParams !== 'chapterID') {
                legacyPageId += '_' + chIDFromParams.split(';').shift();
              }

              // Check if we are already on the same page.
              if ( (comparePageId === this.establishedText.link.split(';').shift() || comparePageId === legacyPageId)
              && hrefTargetItems[hrefTargetItems.length - 1].startsWith('#')) {
                // We are on the same page and the last item in the target href is a textposition.
                positionId = hrefTargetItems[hrefTargetItems.length - 1].replace('#', '');

                // Find the element in the correct column (read-text or comments) based on ref type.
                const matchingElements = document.getElementsByName(positionId);
                let targetElement = null;
                let refType = 'READ-TEXT';
                if (anchorElem.classList.contains('ref_comment')) {
                  refType = 'COMMENTS';
                }
                for (let i = 0; i < matchingElements.length; i++) {
                  let parentElem = matchingElements[i].parentElement;
                  while (parentElem !== null && parentElem.tagName !== refType) {
                    parentElem = parentElem.parentElement;
                  }
                  if (parentElem !== null && parentElem.tagName === refType) {
                    targetElement = matchingElements[i] as HTMLElement;
                    if (targetElement.parentElement.classList.contains('ttFixed')
                    || targetElement.parentElement.parentElement.classList.contains('ttFixed')) {
                      // Found position is in footnote --> look for next occurence since the first footnote element
                      // is not displayed (footnote elements are copied to a list at the end of the reading text and that's
                      // the position we need to find).
                    } else {
                      break;
                    }
                  }
                }
                if (targetElement !== null && targetElement.classList.contains('anchor')) {
                  this.scrollToHTMLElement(targetElement);
                }
              } else {
                // We are not on the same page, open in new window.
                // (Safari on iOS doesn't allow window.open() inside async calls so
                // we have to open the new window first and set its location later.)
                const newWindowRef = window.open();

                this.textService.getCollectionAndPublicationByLegacyId(publicationId + '_' + textId).subscribe(data => {
                  if (data[0] !== undefined) {
                    publicationId = data[0]['coll_id'];
                    textId = data[0]['pub_id'];
                  }

                  let hrefString = '#/publication/' + publicationId + '/text/' + textId + '/';
                  if (chapterId) {
                    hrefString += chapterId;
                    if (hrefTargetItems.length > 3 && hrefTargetItems[3].startsWith('#')) {
                      positionId = hrefTargetItems[3].replace('#', ';');
                      hrefString += positionId;
                    }
                  } else {
                    hrefString += 'nochapter';
                    if (hrefTargetItems.length > 2 && hrefTargetItems[2].startsWith('#')) {
                      positionId = hrefTargetItems[2].replace('#', ';');
                      hrefString += positionId;
                    }
                  }
                  hrefString += '/not/infinite/nosong/searchtitle/established&comments';
                  newWindowRef.location.href = hrefString;
                });
              }

            } else if (anchorElem.classList.contains('ref_introduction')) {
              // Link to introduction.
              publicationId = hrefTargetItems[0];

              this.textService.getCollectionAndPublicationByLegacyId(publicationId).subscribe(data => {
                if (data[0] !== undefined) {
                  publicationId = data[0]['coll_id'];
                }
                let hrefString = '#/publication-introduction/' + publicationId;
                if (hrefTargetItems.length > 1 && hrefTargetItems[1].startsWith('#')) {
                  positionId = hrefTargetItems[1];
                  hrefString += '/' + positionId;
                }
                // Open the link in a new window/tab.
                window.open(hrefString, '_blank');
              });
            }
          }
        }
      });

      /* MOUSE OVER EVENTS */
      this.unlistenMouseoverEvents = this.renderer2.listen(nElement, 'mouseover', (event) => {
        if (!this.userIsTouching) {
          // Mouseover effects only if using a cursor, not if the user is touching the screen
          let eventTarget = this.getEventTarget(event);
          // Loop needed for finding correct tooltip trigger when there are nested triggers.
          while (!this.tooltipVisible && eventTarget['classList'].contains('tooltiptrigger')) {
            if (eventTarget.hasAttribute('data-id')) {
              if (this.toolTipsSettings.personInfo
              && eventTarget['classList'].contains('person')
              && this.readPopoverService.show.personInfo) {
                this.ngZone.run(() => {
                  this.showPersonTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings.placeInfo
              && eventTarget['classList'].contains('placeName')
              && this.readPopoverService.show.placeInfo) {
                this.ngZone.run(() => {
                  this.showPlaceTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings.workInfo
              && eventTarget['classList'].contains('title')
              && this.readPopoverService.show.workInfo) {
                this.ngZone.run(() => {
                  this.showWorkTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings.comments
              && eventTarget['classList'].contains('comment')
              && this.readPopoverService.show.comments) {
                this.ngZone.run(() => {
                  this.showCommentTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              } else if (this.toolTipsSettings.footNotes
              && eventTarget['classList'].contains('teiManuscript')
              && eventTarget['classList'].contains('ttFoot')) {
                this.ngZone.run(() => {
                  this.showManuscriptFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              } else if (this.toolTipsSettings.footNotes
              && eventTarget['classList'].contains('ttFoot')) {
                this.ngZone.run(() => {
                  this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              }
            } else if ( (this.toolTipsSettings.changes && eventTarget['classList'].contains('ttChanges')
            && this.readPopoverService.show.changes)
            || (this.toolTipsSettings.normalisations && eventTarget['classList'].contains('ttNormalisations')
            && this.readPopoverService.show.normalisations)
            || (this.toolTipsSettings.abbreviations && eventTarget['classList'].contains('ttAbbreviations')
            && this.readPopoverService.show.abbreviations) ) {
              this.ngZone.run(() => {
                this.showTooltipFromInlineHtml(eventTarget);
              });
            } else if (eventTarget['classList'].contains('ttVariant')) {
              this.ngZone.run(() => {
                this.showVariantTooltip(eventTarget);
              });
            } else if (eventTarget['classList'].contains('ttMs')) {
              // Check if the tooltip trigger element is in a manuscripts column
              // since ttMs should generally only be triggered there.
              if (eventTarget['classList'].contains('unclear') || eventTarget['classList'].contains('gap')) {
                // Tooltips for text with class unclear or gap should be shown in other columns too.
                this.ngZone.run(() => {
                  this.showTooltipFromInlineHtml(eventTarget);
                });
              } else {
                let parentElem: HTMLElement = eventTarget as HTMLElement;
                parentElem = parentElem.parentElement;
                while (parentElem !== null && parentElem.tagName !== 'MANUSCRIPTS') {
                  parentElem = parentElem.parentElement;
                }
                if (parentElem !== null) {
                  this.ngZone.run(() => {
                    this.showTooltipFromInlineHtml(eventTarget);
                  });
                }
              }
            } else if (this.toolTipsSettings.footNotes && eventTarget.hasAttribute('id')
            && eventTarget['classList'].contains('teiVariant') && eventTarget['classList'].contains('ttFoot')) {
              this.ngZone.run(() => {
                this.showVariantFootnoteTooltip(eventTarget.getAttribute('id'), eventTarget);
              });
            } else if (eventTarget['classList'].contains('ttFoot')
            && !eventTarget.hasAttribute('id')
            && !eventTarget.hasAttribute('data-id')) {
              this.ngZone.run(() => {
                this.showTooltipFromInlineHtml(eventTarget);
              });
            } else if (eventTarget['classList'].contains('ttComment')
            && !eventTarget.hasAttribute('id')
            && !eventTarget.hasAttribute('data-id')) {
              this.ngZone.run(() => {
                this.showTooltipFromInlineHtml(eventTarget);
              });
            }

            /* Get the parent node of the event target for the next iteration if a tooltip hasn't been shown already.
            * This is for finding nested tooltiptriggers, i.e. a person can be a child of a change. */
            if (!this.tooltipVisible) {
              eventTarget = eventTarget['parentNode'];
              if (!eventTarget['classList'].contains('tooltiptrigger')
              && eventTarget['parentNode']['classList'].contains('tooltiptrigger')) {
                /* The parent isn't a tooltiptrigger, but the parent of the parent is, use it for the next iteration. */
                eventTarget = eventTarget['parentNode'];
              }
            }
          }

          /* Check if mouse over doodle image which has a parent tooltiptrigger */
          if (eventTarget.hasAttribute('data-id')
          && eventTarget['classList'].contains('doodle')
          && eventTarget['classList'].contains('unknown')) {
            if (eventTarget['parentNode'] !== undefined && eventTarget['parentNode'] !== null
            && eventTarget['parentNode']['classList'].contains('tooltiptrigger')) {
              eventTarget = eventTarget['parentNode'];
              this.ngZone.run(() => {
                this.showTooltipFromInlineHtml(eventTarget);
              });
            }
          }
        }
      });

      /* MOUSE OUT EVENTS */
      this.unlistenMouseoutEvents = this.renderer2.listen(nElement, 'mouseout', (event) => {
        if (!this.userIsTouching && this.tooltipVisible) {
          this.ngZone.run(() => {
            this.hideToolTip();
          });
        }
      });

    });
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

  private showText() {
    this.textType = TextType.ReadText;
  }

  /**
   * TODO: This function doesn't seem to work as intended. It probably fails because it uses
   * TODO: legacyId, which should be legacy_id if you look at what the API returns. Most projects
   * TODO: don't use legacy_id.
   */
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

  showPersonTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.persons[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.persons[id]);
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        let text = '';
        let uncertainPretext = '';
        let fictionalPretext = '';
        if (targetElem.classList.contains('uncertain')) {
          this.translate.get('uncertainPersonCorresp').subscribe(
            translation => {
              if (translation !== 'uncertainPersonCorresp') {
                uncertainPretext = translation + ' ';
              }
            }, error => { }
          );
        }
        if (targetElem.classList.contains('fictional')) {
          this.translate.get('fictionalPersonCorresp').subscribe(
            translation => {
              if (translation !== 'fictionalPersonCorresp') {
                fictionalPretext = translation + ':<br/>';
              }
            }, error => { }
          );
        }
        if ( tooltip.date_born !== null || tooltip.date_deceased !== null ) {
          // Get the born and deceased years without leading zeros and possible 'BC' indicators
          const year_born = String(tooltip.date_born).split('-')[0].replace(/^0+/, '').split(' ')[0];
          const year_deceased = String(tooltip.date_deceased).split('-')[0].replace(/^0+/, '').split(' ')[0];
          // Get translation for 'BC'
          let bcTranslation = 'BC';
          this.translate.get('BC').subscribe(
            translation => {
              bcTranslation = translation;
            }, error => { }
          );
          const bcIndicatorDeceased = (String(tooltip.date_deceased).includes('BC')) ? ' ' + bcTranslation : '';
          let bcIndicatorBorn = (String(tooltip.date_born).includes('BC')) ? ' ' + bcTranslation : '';
          if (String(tooltip.date_born).includes('BC') && bcIndicatorDeceased === bcIndicatorBorn) {
            // Born and deceased BC, don't add indicator to year born
            bcIndicatorBorn = '';
          }
          text = '<b>' + tooltip.name.trim() + '</b> (';
          if (year_born !== null && year_deceased !== null && year_born !== 'null' && year_deceased !== 'null') {
            text += year_born + bcIndicatorBorn + '–' + year_deceased + bcIndicatorDeceased;
          } else if (year_born !== null && year_born !== 'null') {
            text += '* ' + year_born + bcIndicatorBorn;
          } else if (year_deceased !== null && year_deceased !== 'null') {
            text += '&#8224; ' + year_deceased + bcIndicatorDeceased;
          }
          text += ')';
        } else {
          text = '<b>' + tooltip.name.trim() + '</b>';
        }

        if (tooltip.description !== null) {
          text += ', ' + tooltip.description
        }

        text = uncertainPretext + text;
        text = fictionalPretext + text;

        this.setToolTipPosition(targetElem, text);
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
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showPlaceTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.places[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.places[id]);
      this.setToolTipText(this.tooltips.places[id]);
      return;
    }

    this.tooltipService.getPlaceTooltip(id).subscribe(
      tooltip => {
        this.setToolTipPosition(targetElem, (tooltip.description) ?  tooltip.name + ', ' + tooltip.description : tooltip.name);
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
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showWorkTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.works[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.works[id]);
      this.setToolTipText(this.tooltips.works[id]);
      return;
    }

    if (this.simpleWorkMetadata === undefined) {
      try {
        this.simpleWorkMetadata = this.config.getSettings('useSimpleWorkMetadata');
      } catch (e) {
        this.simpleWorkMetadata = false;
      }
    }

    if (this.simpleWorkMetadata === false || this.simpleWorkMetadata === undefined) {
      this.semanticDataService.getSingleObjectElastic('work', id).subscribe(
        tooltip => {
          if ( tooltip.hits.hits[0] === undefined || tooltip.hits.hits[0]['_source'] === undefined ) {
            let noInfoFound = 'Could not get work information';
            this.translate.get('Occurrences.NoInfoFound').subscribe(
              translation => {
                noInfoFound = translation;
              }, err => { }
            );
            this.setToolTipPosition(targetElem, noInfoFound);
            this.setToolTipText(noInfoFound);
            return;
          }
          tooltip = tooltip.hits.hits[0]['_source'];
          const description = '<span class="work_title">' + tooltip.title  + '</span><br/>' + tooltip.reference;
          this.setToolTipPosition(targetElem, description);
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
          this.setToolTipPosition(targetElem, noInfoFound);
          this.setToolTipText(noInfoFound);
        }
      );
    } else {
      this.tooltipService.getWorkTooltip(id).subscribe(
        tooltip => {
          this.setToolTipPosition(targetElem, tooltip.description);
          this.setToolTipText(tooltip.description);
          this.tooltips.works[id] = tooltip.description;
        },
        error => {
          let noInfoFound = 'Could not get work information';
          this.translate.get('Occurrences.NoInfoFound').subscribe(
            translation => {
              noInfoFound = translation;
            }, err => { }
          );
          this.setToolTipPosition(targetElem, noInfoFound);
          this.setToolTipText(noInfoFound);
        }
      );
    }
  }

  showFootnoteTooltip(id: string, targetElem: HTMLElement) {
    if (this.tooltips.footnotes[id] && this.userSettingsService.isDesktop()) {
      this.setToolTipPosition(targetElem, this.tooltips.footnotes[id]);
      this.setToolTipText(this.tooltips.footnotes[id]);
      return;
    }

    let footnoteText: any = '';
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.firstElementChild !== null
    && targetElem.nextElementSibling.classList.contains('ttFoot')
    && targetElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && targetElem.nextElementSibling.firstElementChild.getAttribute('data-id') === id) {
      footnoteText = targetElem.nextElementSibling.firstElementChild.innerHTML;
      // MathJx problem with resolving the actual formula, not the translated formula.
      if (targetElem.nextElementSibling.firstElementChild.lastChild.nodeName === 'SCRIPT') {
        const tmpElem = <HTMLElement> targetElem.nextElementSibling.firstElementChild.lastChild;
        footnoteText = '$' + tmpElem.innerHTML + '$';
      }
    } else {
      return;
    }

    footnoteText = footnoteText.replace(' xmlns:tei="http://www.tei-c.org/ns/1.0"', '');

    // Get column id of the column where the footnote is.
    let containerElem = targetElem.parentElement;
    while (containerElem !== null && !(containerElem.classList.contains('read-column') &&
     containerElem.hasAttribute('id'))) {
      containerElem = containerElem.parentElement;
    }
    if (containerElem !== null) {
      const columnId = containerElem.getAttribute('id');

      // Prepend the footnoteindicator to the footnote text.
      const footnoteWithIndicator: string = '<div class="footnoteWrapper"><a class="xreference footnoteReference targetColumnId_'
      + columnId + '" href="#' + id + '">' + targetElem.textContent
      + '</a>' + '<p class="footnoteText">' + footnoteText  + '</p></div>';
      const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

      this.setToolTipPosition(targetElem, footNoteHTML);
      this.setToolTipText(footNoteHTML);
      if (this.userSettingsService.isDesktop()) {
        this.tooltips.footnotes[id] = footNoteHTML;
      }
    }
  }

  showVariantFootnoteTooltip(id: string, targetElem: HTMLElement) {
    const footNoteHTML: string = this.getVariantFootnoteText(id, targetElem);
    if (footNoteHTML) {
      this.setToolTipPosition(targetElem, footNoteHTML);
      this.setToolTipText(footNoteHTML);
    }
  }

  showManuscriptFootnoteTooltip(id: string, targetElem: HTMLElement) {
    const footNoteHTML: string = this.getManuscriptFootnoteText(id, targetElem);
    if (footNoteHTML) {
      this.setToolTipPosition(targetElem, footNoteHTML);
      this.setToolTipText(footNoteHTML);
    }
  }

  /* Use this method to get a footnote text in a variant text. Returns a string with the footnote html. */
  private getVariantFootnoteText(id: string, triggerElem: HTMLElement) {
    if (triggerElem.nextElementSibling !== null
    && triggerElem.nextElementSibling.firstElementChild !== null
    && triggerElem.nextElementSibling.classList.contains('teiVariant')
    && triggerElem.nextElementSibling.classList.contains('ttFoot')
    && triggerElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && triggerElem.nextElementSibling.firstElementChild.getAttribute('id') === id) {
      let ttText = triggerElem.nextElementSibling.firstElementChild.innerHTML;
      // MathJx problem with resolving the actual formula, not the translated formula.
      if (triggerElem.nextElementSibling.firstElementChild.lastChild.nodeName === 'SCRIPT') {
        const tmpElem = <HTMLElement> triggerElem.nextElementSibling.firstElementChild.lastChild;
        ttText = '$' + tmpElem.innerHTML + '$';
      }

      // Get column id of the column where the footnote is.
      let containerElem = triggerElem.parentElement;
      while (containerElem !== null && !(containerElem.classList.contains('read-column') &&
       containerElem.hasAttribute('id'))) {
        containerElem = containerElem.parentElement;
      }
      if (containerElem !== null) {
        const columnId = containerElem.getAttribute('id');

        // Prepend the footnoteindicator to the the footnote text.
        const footnoteWithIndicator: string = '<div class="footnoteWrapper">'
        + '<a class="xreference footnoteReference teiVariant targetColumnId_'
        + columnId + '" href="#' + id + '">' + triggerElem.textContent
        + '</a>' + '<p class="footnoteText">' + ttText  + '</p></div>';
        const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));
        return footNoteHTML;
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /* Use this method to get a footnote text in a manuscript text. Returns a string with the footnote html. */
  private getManuscriptFootnoteText(id: string, triggerElem: HTMLElement) {
    if (triggerElem.nextElementSibling !== null
    && triggerElem.nextElementSibling.firstElementChild !== null
    && triggerElem.nextElementSibling.classList.contains('teiManuscript')
    && triggerElem.nextElementSibling.classList.contains('ttFoot')
    && triggerElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && triggerElem.nextElementSibling.firstElementChild.getAttribute('data-id') === id) {
      let ttText = triggerElem.nextElementSibling.firstElementChild.innerHTML;
      // MathJx problem with resolving the actual formula, not the translated formula.
      if (triggerElem.nextElementSibling.firstElementChild.lastChild.nodeName === 'SCRIPT') {
        const tmpElem = <HTMLElement> triggerElem.nextElementSibling.firstElementChild.lastChild;
        ttText = '$' + tmpElem.innerHTML + '$';
      }

      // Get column id of the column where the footnote is.
      let containerElem = triggerElem.parentElement;
      while (containerElem !== null && !(containerElem.classList.contains('read-column') &&
       containerElem.hasAttribute('id'))) {
        containerElem = containerElem.parentElement;
      }
      if (containerElem !== null) {
        const columnId = containerElem.getAttribute('id');

        // Prepend the footnoteindicator to the the footnote text.
        const footnoteWithIndicator: string = '<div class="footnoteWrapper">'
        + '<a class="xreference footnoteReference teiManuscript targetColumnId_'
        + columnId + '" href="#' + id + '">' + triggerElem.textContent
        + '</a>' + '<p class="footnoteText">' + ttText  + '</p></div>';
        const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));
        return footNoteHTML;
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /* This method is used for showing tooltips for changes, normalisations, abbreviations and explanations in manuscripts. */
  showTooltipFromInlineHtml(targetElem: HTMLElement) {
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.classList.contains('tooltip')) {
      this.setToolTipPosition(targetElem, targetElem.nextElementSibling.innerHTML);
      this.setToolTipText(targetElem.nextElementSibling.innerHTML);
    }
  }

  showCommentTooltip(id: string, targetElem: HTMLElement) {
    if (this.tooltips.comments[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.comments[id]);
      this.setToolTipText(this.tooltips.comments[id]);
      return;
    }

    id = this.establishedText.link + ';' + id;
    this.tooltipService.getCommentTooltip(id).subscribe(
      tooltip => {
        this.setToolTipPosition(targetElem, tooltip.description);
        this.setToolTipText(tooltip.description);
        this.tooltips.comments[id] = tooltip.description
      },
      error => {
        let noInfoFound = 'Could not get comment information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, errorT => { }
        );
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showVariantTooltip(targetElem: HTMLElement) {
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.classList.contains('tooltip')) {
      this.setToolTipPosition(targetElem, targetElem.nextElementSibling.textContent);
      this.setToolTipText(targetElem.nextElementSibling.textContent);
    }
  }

  showFootnoteInfoOverlay(id: string, targetElem: HTMLElement) {
    if (this.tooltips.footnotes[id] && this.userSettingsService.isDesktop()) {
      this.translate.get('note').subscribe(
        translation => {
          this.setInfoOverlayTitle(translation);
        }, error => { }
      );
      this.setInfoOverlayPositionAndWidth(targetElem);
      this.setInfoOverlayText(this.tooltips.footnotes[id]);
      return;
    }

    let footnoteText: any = '';
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.firstElementChild !== null
    && targetElem.nextElementSibling.classList.contains('ttFoot')
    && targetElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && targetElem.nextElementSibling.firstElementChild.getAttribute('data-id') === id) {
      footnoteText = targetElem.nextElementSibling.firstElementChild.innerHTML;
      // MathJx problem with resolving the actual formula, not the translated formula.
      if (targetElem.nextElementSibling.firstElementChild.lastChild.nodeName === 'SCRIPT') {
        const tmpElem = <HTMLElement> targetElem.nextElementSibling.firstElementChild.lastChild;
        footnoteText = '$' + tmpElem.innerHTML + '$';
      }
    } else {
      return;
    }

    footnoteText = footnoteText.replace(' xmlns:tei="http://www.tei-c.org/ns/1.0"', '');

    let footnoteWithIndicator = '';
    if (this.userSettingsService.isDesktop()) {
      // Get column id of the column where the footnote is.
      let containerElem = targetElem.parentElement;
      while (containerElem !== null && !(containerElem.classList.contains('read-column') &&
      containerElem.hasAttribute('id'))) {
        containerElem = containerElem.parentElement;
      }
      if (containerElem !== null) {
        const columnId = containerElem.getAttribute('id');

        // Prepend the footnoteindicator to the footnote text.
        footnoteWithIndicator = '<div class="footnoteWrapper"><a class="xreference footnoteReference targetColumnId_'
        + columnId + '" href="#' + id + '">' + targetElem.textContent + '</a>'
        + '<p class="footnoteText">' + footnoteText + '</p></div>';
      }
    } else {
      // This is for mobile view.
      // Prepend the footnoteindicator to the footnote text.
      footnoteWithIndicator = '<div class="footnoteWrapper"><a class="xreference footnoteReference" href="#' + id + '">'
      + targetElem.textContent + '</a>' + '<p class="footnoteText">'
      + footnoteText + '</p></div>';
    }

    const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    this.setInfoOverlayPositionAndWidth(targetElem);
    this.setInfoOverlayText(footNoteHTML);
    if (this.userSettingsService.isDesktop()) {
      this.tooltips.footnotes[id] = footNoteHTML;
    }
  }

  showManuscriptFootnoteInfoOverlay(id: string, targetElem: HTMLElement) {
    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    const footNoteHTML: string = this.getManuscriptFootnoteText(id, targetElem);
    this.setInfoOverlayPositionAndWidth(targetElem);
    this.setInfoOverlayText(footNoteHTML);
  }

  showVariantFootnoteInfoOverlay(id: string, targetElem: HTMLElement) {
    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    const footNoteHTML: string = this.getVariantFootnoteText(id, targetElem);
    this.setInfoOverlayPositionAndWidth(targetElem);
    this.setInfoOverlayText(footNoteHTML);
  }

  showCommentInfoOverlay(id: string, targetElem: HTMLElement) {
    if (this.tooltips.comments[id]) {
      this.translate.get('Occurrences.Commentary').subscribe(
        translation => {
          this.setInfoOverlayTitle(translation);
        }, errorA => { }
      );
      this.setInfoOverlayPositionAndWidth(targetElem);
      this.setInfoOverlayText(this.tooltips.comments[id]);
      return;
    }

    id = this.establishedText.link + ';' + id;
    this.tooltipService.getCommentTooltip(id).subscribe(
      tooltip => {
        this.translate.get('Occurrences.Commentary').subscribe(
          translation => {
            this.setInfoOverlayTitle(translation);
          }, errorB => { }
        );
        this.setInfoOverlayPositionAndWidth(targetElem);
        this.setInfoOverlayText(tooltip.description);
        this.tooltips.comments[id] = tooltip.description
      },
      errorC => {
        let noInfoFound = 'Could not get comment information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, errorD => { }
        );
        this.translate.get('Occurrences.Commentary').subscribe(
          translation => {
            this.setInfoOverlayTitle(translation);
          }, errorE => { }
        );
        this.setInfoOverlayPositionAndWidth(targetElem);
        this.setInfoOverlayText(noInfoFound);
      }
    );
  }

  /* This method is used for showing infoOverlays for changes, normalisations and abbreviations. */
  showInfoOverlayFromInlineHtml(targetElem: HTMLElement) {
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.classList.contains('tooltip')) {
      let title = '';
      let text = '';
      let lemma = '';

      if (targetElem.nextElementSibling.classList.contains('ttChanges')) {
        // Change.
        title = 'editorialChange';
        if (targetElem.classList.contains('corr_red')) {
          lemma = targetElem.innerHTML;
        } else if (targetElem.firstElementChild !== null
        && targetElem.firstElementChild.classList.contains('corr_hide')) {
          lemma = '<span class="corr_hide">' + targetElem.firstElementChild.innerHTML + '</span>';
        } else if (targetElem.firstElementChild !== null
        && targetElem.firstElementChild.classList.contains('corr')) {
          lemma = targetElem.firstElementChild.innerHTML;
        }
        text = '<p class="infoOverlayText"><span class="ioLemma">'
        + lemma + '</span><span class="ioDescription">'
        + targetElem.nextElementSibling.innerHTML + '</span></p>';
      } else if (targetElem.nextElementSibling.classList.contains('ttNormalisations')) {
        // Normalisation.
        title = 'editorialNormalisation';
        if (targetElem.classList.contains('reg_hide')) {
          lemma = '<span class="reg_hide">' + targetElem.innerHTML + '</span>';
        } else {
          lemma = targetElem.innerHTML;
        }
        text = '<p class="infoOverlayText"><span class="ioLemma">'
        + lemma + '</span><span class="ioDescription">'
        + targetElem.nextElementSibling.innerHTML + '</span></p>';
      } else if (targetElem.nextElementSibling.classList.contains('ttAbbreviations')) {
        // Abbreviation.
        title = 'abbreviation';
        if (targetElem.firstElementChild !== null
        && targetElem.firstElementChild.classList.contains('abbr')) {
          text = '<p class="infoOverlayText"><span class="ioLemma">'
          + targetElem.firstElementChild.innerHTML
          + '</span><span class="ioDescription">'
          + targetElem.nextElementSibling.innerHTML + '</span></p>';
        }
      } else if (targetElem.nextElementSibling.classList.contains('ttComment')) {
        // Abbreviation.
        title = 'comments';
        if (targetElem.firstElementChild !== null
        && targetElem.firstElementChild.classList.contains('noteText')) {
          text = '<p class="infoOverlayText"><span class="ioLemma">'
          + targetElem.firstElementChild.innerHTML
          + '</span><span class="ioDescription">'
          + targetElem.nextElementSibling.innerHTML + '</span></p>';
        }
      } else if (targetElem.classList.contains('ttFoot')
      && targetElem.nextElementSibling !== null
      && targetElem.nextElementSibling.classList.contains('ttFoot')) {
        // Some other note coded as a footnote (but lacking id and data-id attributes).
        if (targetElem.nextElementSibling.firstElementChild !== null
        && targetElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')) {
          title = '';
          if (targetElem.classList.contains('revision')) {
            title = 'revisionNote';
            lemma = '';
          } else {
            lemma = '<span class="ioLemma">' + targetElem.innerHTML + '</span>';
          }
          text = '<p class="infoOverlayText">'
          + lemma + '<span class="ioDescription">'
          + targetElem.nextElementSibling.firstElementChild.innerHTML + '</span></p>';
        }
      } else {
        // Some other note, generally editorial remarks pertaining to a manuscript.
        title = '';
        if (targetElem.classList.contains('ttMs')) {
          title = 'criticalNote';
        }
        lemma = targetElem.textContent;
        if ( targetElem.classList.contains('deletion')
        || (targetElem.parentElement !== null && targetElem.classList.contains('tei_deletion_medium_wrapper')) ) {
          lemma = '<span class="deletion">' + lemma + '</span>';
        }
        text = '<p class="infoOverlayText"><span class="ioLemma">'
        + lemma + '</span><span class="ioDescription">'
        + targetElem.nextElementSibling.innerHTML + '</span></p>';
      }
      if (title) {
        this.translate.get(title).subscribe(
          translation => {
            this.setInfoOverlayTitle(translation);
          }, error => { }
        );
      } else {
        this.setInfoOverlayTitle('');
      }
      this.setInfoOverlayPositionAndWidth(targetElem);
      this.setInfoOverlayText(text);
    }
  }

  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  setInfoOverlayText(text: string) {
    this.infoOverlayText = text;
  }

  setInfoOverlayTitle(title: string) {
    this.infoOverlayTitle = String(title);
  }

  hideToolTip() {
    this.setToolTipText('');
    this.toolTipPosType = 'fixed'; // Position needs to be fixed so we can safely hide it outside viewport
    this.toolTipPosition = {
      top: 0 + 'px',
      left: -1500 + 'px'
    };
    this.tooltipVisible = false;
  }

  hideInfoOverlay() {
    this.setInfoOverlayText('');
    this.setInfoOverlayTitle('');
    this.infoOverlayPosType = 'fixed'; // Position needs to be fixed so we can safely hide it outside viewport
    this.infoOverlayPosition = {
      bottom: 0 + 'px',
      left: -1500 + 'px'
    };
  }

  setToolTipPosition(targetElem: HTMLElement, ttText: string) {
    // Set vertical offset and toolbar height.
    const yOffset = 5;
    const secToolbarHeight = 50;

    // Set how close to the edges of the "window" the tooltip can be placed. Currently this only applies if the
    // tooltip is set above or below the trigger.
    const edgePadding = 5;

    // Set "padding" around tooltip trigger – this is how close to the trigger element the tooltip will be placed.
    const triggerPaddingX = 8;
    const triggerPaddingY = 8;

    // Set min and max width for resized tooltips.
    const resizedToolTipMinWidth = 300;
    const resizedToolTipMaxWidth = 600;

    // Get viewport width and height.
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Get how much the read page has scrolled horizontally to the left.
    // Get read page content element and adjust viewport height with horizontal
    // scrollbar height if such is present.
    // Also get how much the read page has scrolled horizontally to the left.
    // Set horisontal offset due to possible side pane on the left.
    let scrollLeft = 0;
    let horizontalScrollbarOffsetHeight = 0;
    let sidePaneOffsetWidth = 0;
    let primaryToolbarHeight = 70;
    const contentElem = document.querySelector('page-read > ion-content > .scroll-content') as HTMLElement;
    if (contentElem !== null) {
      scrollLeft = contentElem.scrollLeft;
      sidePaneOffsetWidth = contentElem.getBoundingClientRect().left;
      primaryToolbarHeight = contentElem.getBoundingClientRect().top;

      if (contentElem.clientHeight < contentElem.offsetHeight) {
        horizontalScrollbarOffsetHeight = contentElem.offsetHeight - contentElem.clientHeight;
      }
    }

    // Adjust effective viewport height if horizontal scrollbar present.
    vh = vh - horizontalScrollbarOffsetHeight;

    // Set variable for determining if the tooltip should be placed above or below the trigger rather than beside it.
    let positionAboveOrBelowTrigger: Boolean = false;
    let positionAbove: Boolean = false;

    // Get rectangle which contains tooltiptrigger element. For trigger elements
    // spanning multiple lines tooltips are always placed above or below the trigger.
    const elemRects = targetElem.getClientRects();
    let elemRect = null;
    if (elemRects.length === 1) {
      elemRect = elemRects[0];
    } else {
      positionAboveOrBelowTrigger = true;
      if (elemRects[0].top - triggerPaddingY - primaryToolbarHeight - secToolbarHeight - edgePadding >
         vh - elemRects[elemRects.length - 1].bottom - triggerPaddingY - edgePadding) {
        elemRect = elemRects[0];
        positionAbove = true;
      } else {
        elemRect = elemRects[elemRects.length - 1];
      }
    }

    // Find the tooltip element.
    const tooltipElement: HTMLElement = document.querySelector('div.toolTip');
    if (tooltipElement === null) {
      return;
    }

    // Get tooltip element's default dimensions and computed max-width (latter set by css).
    const initialTTDimensions = this.getToolTipDimensions(tooltipElement, ttText, 0, true);
    let ttHeight = initialTTDimensions.height;
    let ttWidth = initialTTDimensions.width;
    if (initialTTDimensions.compMaxWidth) {
      this.toolTipMaxWidth = initialTTDimensions.compMaxWidth;
    } else {
      this.toolTipMaxWidth = '425px';
    }
    // Reset scale value for tooltip.
    if (this.toolTipScaleValue) {
      this.toolTipScaleValue = 1;
    }

    // Calculate default position, this is relative to the viewport's top-left corner.
    let x = elemRect.right + triggerPaddingX;
    let y = elemRect.top - primaryToolbarHeight - yOffset;

    // Check if tooltip would be drawn outside the viewport.
    let oversetX = x + ttWidth - vw;
    let oversetY = elemRect.top + ttHeight - vh;
    if (!positionAboveOrBelowTrigger) {
      if (oversetX > 0) {
        if (oversetY > 0) {
          // Overset both vertically and horisontally. Check if tooltip can be moved to the left
          // side of the trigger and upwards without modifying its dimensions.
          if (elemRect.left - sidePaneOffsetWidth > ttWidth + triggerPaddingX && y - secToolbarHeight > oversetY) {
            // Move tooltip to the left side of the trigger and upwards
            x = elemRect.left - ttWidth - triggerPaddingX;
            y = y - oversetY;
          } else {
            // Calc how much space there is on either side and attempt to place the tooltip on the side with more space.
            const spaceRight = vw - x;
            const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, maxSpace);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              this.toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        } else {
          // Overset only horisontally. Check if there is room on the left side of the trigger.
          if (elemRect.left - sidePaneOffsetWidth - triggerPaddingX > ttWidth) {
            // There is room on the left --> move tooltip there.
            x = elemRect.left - ttWidth - triggerPaddingX;
          } else {
            // There is not enough room on the left. Try to squeeze in the tooltip on whichever side has more room.
            // Calc how much space there is on either side.
            const spaceRight = vw - x;
            const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, maxSpace);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              this.toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        }
      } else if (oversetY > 0) {
        // Overset only vertically. Check if there is room to move the tooltip upwards.
        if (oversetY < y - secToolbarHeight) {
          // Move the y position upwards by oversetY.
          y = y - oversetY;
        } else {
          // There is not room to move the tooltip just upwards. Check if there is more room on the
          // left side of the trigger so the width of the tooltip could be increased there.
          const spaceRight = vw - x;
          const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;

          if (spaceLeft > spaceRight) {
            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, spaceLeft);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            if (ttWidth <= spaceLeft && ttWidth > resizedToolTipMinWidth &&
               ttHeight < vh - yOffset - primaryToolbarHeight - secToolbarHeight) {
              // There is enough space on the left side of the trigger. Calc new positions.
              this.toolTipMaxWidth = ttWidth + 'px';
              x = elemRect.left - triggerPaddingX - ttWidth;
              oversetY = elemRect.top + ttHeight - vh;
              y = y - oversetY;
            } else {
              positionAboveOrBelowTrigger = true;
            }
          } else {
            positionAboveOrBelowTrigger = true;
          }
        }
      }
    }

    if (positionAboveOrBelowTrigger) {
      // The tooltip could not be placed next to the trigger, so it has to be placed above or below it.
      // Check if there is more space above or below the tooltip trigger.
      let availableHeight = 0;
      if (elemRects.length > 1 && positionAbove) {
        availableHeight = elemRect.top - primaryToolbarHeight - secToolbarHeight - triggerPaddingY - edgePadding;
      } else if (elemRects.length > 1) {
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      } else if (elemRect.top - primaryToolbarHeight - secToolbarHeight > vh - elemRect.bottom) {
        positionAbove = true;
        availableHeight = elemRect.top - primaryToolbarHeight - secToolbarHeight - triggerPaddingY - edgePadding;
      } else {
        positionAbove = false;
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      }

      const availableWidth = vw - sidePaneOffsetWidth - (2 * edgePadding);

      if (initialTTDimensions.height <= availableHeight && initialTTDimensions.width <= availableWidth) {
        // The tooltip fits without resizing. Calculate position, check for possible overset and adjust.
        x = elemRect.left;
        if (positionAbove) {
          y = elemRect.top - initialTTDimensions.height - primaryToolbarHeight - triggerPaddingY;
        } else {
          y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
        }

        // Check if tooltip would be drawn outside the viewport horisontally.
        oversetX = x + initialTTDimensions.width - vw;
        if (oversetX > 0) {
          x = x - oversetX - edgePadding;
        }
      } else {
        // Try to resize the tooltip so it would fit in view.
        let newTTMaxWidth = Math.floor(availableWidth);
        if (newTTMaxWidth > resizedToolTipMaxWidth) {
          newTTMaxWidth = resizedToolTipMaxWidth;
        }
        // Calculate tooltip dimensions with new max-width
        const ttNewDimensions = this.getToolTipDimensions(tooltipElement, ttText, newTTMaxWidth);

        if (ttNewDimensions.height <= availableHeight && ttNewDimensions.width <= availableWidth) {
          // Set new max-width and calculate position. Adjust if overset.
          this.toolTipMaxWidth = ttNewDimensions.width + 'px';
          x = elemRect.left;
          if (positionAbove) {
            y = elemRect.top - ttNewDimensions.height - primaryToolbarHeight - triggerPaddingY;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          // Check if tooltip would be drawn outside the viewport horisontally.
          oversetX = x + ttNewDimensions.width - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        } else {
          // Resizing the width and height of the tooltip element won't make it fit in view.
          // Basically this means that the width is ok, but the height isn't.
          // As a last resort, scale the tooltip so it fits in view.
          const ratioX = availableWidth / ttNewDimensions.width;
          const ratioY = availableHeight / ttNewDimensions.height;
          const scaleRatio = Math.min(ratioX, ratioY) - 0.01;

          this.toolTipMaxWidth = ttNewDimensions.width + 'px';
          this.toolTipScaleValue = scaleRatio;
          x = elemRect.left;
          if (positionAbove) {
            y = elemRect.top - availableHeight - triggerPaddingY - primaryToolbarHeight;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          oversetX = x + ttNewDimensions.width - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        }
      }
    }

    // Set tooltip position
    this.toolTipPosition = {
      top: y + 'px',
      left: (x + scrollLeft - sidePaneOffsetWidth) + 'px'
    };
    if (this.userSettingsService.isDesktop()) {
      this.toolTipPosType = 'absolute';
    } else {
      this.toolTipPosType = 'fixed';
    }
    this.tooltipVisible = true;
  }

  private getToolTipDimensions(toolTipElem: HTMLElement, toolTipText: string, maxWidth = 0, returnCompMaxWidth: Boolean = false) {
    // Create hidden div and make it into a copy of the tooltip div. Calculations are done on the hidden div.
    const hiddenDiv: HTMLElement = document.createElement('div');

    // Loop over each class in the tooltip element and add them to the hidden div.
    if (toolTipElem.className !== '') {
      const ttClasses: string[] = Array.from(toolTipElem.classList);
      ttClasses.forEach(
        function(currentValue, currentIndex, listObj) {
          hiddenDiv.classList.add(currentValue);
        },
      );
    } else {
      return undefined;
    }

    // Don't display the hidden div initially. Set max-width if defined, otherwise the max-width will be determined by css.
    hiddenDiv.style.display = 'none';
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.left = '0';
    if (maxWidth > 0) {
      hiddenDiv.style.maxWidth = maxWidth + 'px';
    }
    // Append hidden div to the parent of the tooltip element.
    toolTipElem.parentNode.appendChild(hiddenDiv);
    // Add content to the hidden div.
    hiddenDiv.innerHTML = toolTipText;
    // Make div visible again to calculate its width and height.
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.style.display = 'block';
    const ttHeight = hiddenDiv.offsetHeight;
    const ttWidth = hiddenDiv.offsetWidth;
    let compToolTipMaxWidth = '';
    if (returnCompMaxWidth) {
      // Get default tooltip max-width from css of hidden div if possible.
      const hiddenDivCompStyles = window.getComputedStyle(hiddenDiv);
      compToolTipMaxWidth = hiddenDivCompStyles.getPropertyValue('max-width');
    }
    // Remove hidden div.
    hiddenDiv.remove();

    const dimensions = {
      width: ttWidth,
      height: ttHeight,
      compMaxWidth: compToolTipMaxWidth
    }
    return dimensions;
  }

  /**
   * Set position and width of infoOverlay element. This function is not exactly
   * the same as in introduction.ts due to different page structure on read page.
   */
  private setInfoOverlayPositionAndWidth(triggerElement: HTMLElement, defaultMargins = 20, maxWidth = 600) {
    let margins = defaultMargins;

    // Get viewport height and width.
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // Get read page content element and adjust viewport height with horizontal
    // scrollbar height if such is present. Also get how much the read page has
    // scrolled horizontally to the left.
    let scrollLeft = 0;
    let horizontalScrollbarOffsetHeight = 0;
    const contentElem = document.querySelector('page-read > ion-content > .scroll-content') as HTMLElement;
    if (contentElem !== null) {
      scrollLeft = contentElem.scrollLeft;

      if (contentElem.clientHeight < contentElem.offsetHeight) {
        horizontalScrollbarOffsetHeight = contentElem.offsetHeight - contentElem.clientHeight;
      }
    }

    // Get bounding rectangle of the div.scroll-content element which is the
    // container for the column that the trigger element resides in.
    let containerElem = triggerElement.parentElement;
    while (containerElem !== null && containerElem.parentElement !== null &&
      !(containerElem.classList.contains('scroll-content') &&
      containerElem.parentElement.tagName === 'ION-SCROLL')) {
      containerElem = containerElem.parentElement;
    }

    if (containerElem !== null && containerElem.parentElement !== null) {
      const containerElemRect = containerElem.getBoundingClientRect();
      let calcWidth = containerElem.clientWidth; // Width without scrollbar

      if (this.userSettingsService.isMobile() && vw > 800) {
        // Adjust width in mobile view when viewport size over 800 px
        // since padding changes through CSS then.
        margins = margins + 16;
      }

      if (calcWidth > maxWidth + 2 * margins) {
        margins = Math.floor((calcWidth - maxWidth) / 2);
        calcWidth = maxWidth;
      } else {
        calcWidth = calcWidth - 2 * margins;
      }

      // Set info overlay position
      this.infoOverlayPosition = {
        bottom: (vh - horizontalScrollbarOffsetHeight - containerElemRect.bottom) + 'px',
        left: (containerElemRect.left + scrollLeft + margins - contentElem.getBoundingClientRect().left) + 'px'
      };
      if (this.userSettingsService.isDesktop()) {
        this.infoOverlayPosType = 'absolute';
      } else {
        this.infoOverlayPosType = 'fixed';
      }

      // Set info overlay width
      this.infoOverlayWidth = calcWidth + 'px';
    }
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

  private showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalCtrl.create(ReferenceDataModalPage, {id: document.URL, type: 'reference', origin: 'page-read'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  private showDownloadModal() {
    const modal = this.modalCtrl.create(DownloadTextsModalPage, {textId: this.establishedText.link, origin: 'page-read'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
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
    } else if (event.viewType === 'illustrations') {
      this.addView(event.viewType, event.id, undefined, undefined, event);
    } else {
      this.addView(event.viewType, event.id);
    }
  }

  addView(type: string, id?: string, fab?: FabContainer, external?: boolean, image?: any, language?: string, variationSortOrder?: number) {
    if (fab !== undefined) {
      try {
        fab.close();
      } catch (e) {

      }
    }
    if (external === true) {
      this.external = id;
    } else {
      this.external = null;
    }

    if (this.availableViewModes.indexOf(type) !== -1) {
      const view = {
        content: `This is an upcoming ${type} view`,
        type,
        established: { show: (type === 'established' && !this.multilingualEST), id: id },
        comments: { show: (type === 'comments'), id: id },
        facsimiles: { show: (type === 'facsimiles'), id: id },
        manuscripts: { show: (type === 'manuscripts'), id: id },
        variations: { show: (type === 'variations'), id: id, variationSortOrder: variationSortOrder },
        introduction: { show: (type === 'introduction'), id: id },
        songexample: { show: (type === 'songexample'), id: id },
        illustrations: { show: (type === 'illustrations'), image: image },
        legend: { show: (type === 'legend'), id: id }
      }
      if (this.multilingualEST) {
        for (const lang of this.estLanguages) {
          view['established_' + lang] = { show: (type === 'established' && language === lang), id: id }
        }
        if (type === 'established' && language) {
          view['type'] = 'established_' + language;
        }
      }

      this.views.push(view);

      this.updateURL();
      this.updateCachedViewModes();

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
    this.removeVariationSortOrderFromService(i);
    this.views.splice(i, 1);
    this.updateURL();
    this.updateCachedViewModes();
  }

  /**
   * Moves the view with index id one step to the right, i.e. exchange
   * positions with the view on the right. If a FabContainer is passed
   * it is closed.
   */
  moveViewRight(id: number, fab?: FabContainer) {
    if (id > -1 && id < this.views.length - 1) {
      this.views = this.moveArrayItem(this.views, id, id + 1);
      this.updateURL();
      this.updateCachedViewModes();
      this.switchVariationSortOrdersInService(id, id + 1);
      if (fab !== undefined) {
        fab.close();
      }
    }
  }

  /**
   * Moves the view with index id one step to the left, i.e. exchange
   * positions with the view on the left. If a FabContainer is passed
   * it is closed.
   */
  moveViewLeft(id: number, fab?: FabContainer) {
    if (id > 0 && id < this.views.length) {
      this.views = this.moveArrayItem(this.views, id, id - 1);
      this.updateURL();
      this.updateCachedViewModes();
      this.switchVariationSortOrdersInService(id, id - 1);
      if (fab !== undefined) {
        fab.close();
      }
    }
  }

  /**
   * Reorders the given array by moving the item at position 'fromIndex'
   * to the position 'toIndex'. Returns the reordered array.
   */
  moveArrayItem(array: any[], fromIndex: number, toIndex: number) {
    const reorderedArray = array;
    if (fromIndex > -1 && toIndex > -1 && fromIndex < array.length
      && toIndex < array.length && fromIndex !== toIndex) {
      reorderedArray.splice(toIndex, 0, reorderedArray.splice(fromIndex, 1)[0]);
    }
    return reorderedArray;
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
    this.hideToolTip();
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

  private scrollToVariant(element: HTMLElement) {
    this.hideToolTip();
    try {
      if (element['classList'].contains('variantScrollTarget')) {
        const variantContElems: NodeListOf<HTMLElement> = document.querySelectorAll('variations');
        for (let v = 0; v < variantContElems.length; v++) {
          const elems: NodeListOf<HTMLElement> = variantContElems[v].querySelectorAll('.teiVariant');
          let variantNotScrolled = true;
          for (let i = 0; i < elems.length; i++) {
            if (elems[i].id === element.id) {
              if (!elems[i].classList.contains('highlight')) {
                elems[i].classList.add('highlight');
              }
              if (variantNotScrolled) {
                variantNotScrolled = false;
                this.scrollElementIntoView(elems[i]);
              }
              setTimeout(function () {
                if (elems[i] !== undefined) {
                  elems[i].classList.remove('highlight');
                }
              }, 5000);
            }
          }
        }
      } else if (element['classList'].contains('anchorScrollTarget')) {
        const elems: NodeListOf<HTMLElement> = document.querySelectorAll('.teiVariant.anchorScrollTarget');
        const elementClassList = element.className.split(' ');
        let targetClassName = '';
        let targetCompClassName = '';
        for (let x = 0; x < elementClassList.length; x++) {
          if (elementClassList[x].startsWith('struct')) {
            targetClassName = elementClassList[x];
            break;
          }
        }
        if (targetClassName.endsWith('a')) {
          targetCompClassName = targetClassName.substring(0, targetClassName.length - 1) + 'b';
        } else {
          targetCompClassName = targetClassName.substring(0, targetClassName.length - 1) + 'a';
        }
        let iClassList = [];
        for (let i = 0; i < elems.length; i++) {
          iClassList = elems[i].className.split(' ');
          for (let y = 0; y < iClassList.length; y++) {
            if (iClassList[y] === targetClassName || iClassList[y] === targetCompClassName) {
              elems[i].classList.add('highlight');
              setTimeout(function () {
                if (elems[i] !== undefined) {
                  elems[i].classList.remove('highlight');
                }
              }, 5000);
              if (iClassList[y] === targetClassName) {
                this.scrollElementIntoView(elems[i]);
              }
            }
          }
        }
      }
    } catch (e) {
    }
  }

  /* Use this function to scroll the lemma of a comment into view in the reading text view. */
  private scrollToCommentLemma(lemmaStartElem: HTMLElement, timeOut = 5000) {
    if (lemmaStartElem !== null && lemmaStartElem !== undefined && lemmaStartElem.classList.contains('anchor_lemma')) {

      if (this.commentService.activeLemmaHighlight.lemmaTimeOutId !== null) {
        // Clear previous lemma highlight if still active
        this.commentService.activeLemmaHighlight.lemmaElement.style.display = null;
        window.clearTimeout(this.commentService.activeLemmaHighlight.lemmaTimeOutId);
      }

      lemmaStartElem.style.display = 'inline';
      this.scrollElementIntoView(lemmaStartElem);
      const settimeoutId = setTimeout(() => {
        lemmaStartElem.style.display = null;
        this.commentService.activeLemmaHighlight = {
          lemmaTimeOutId: null,
          lemmaElement: null
        }

      }, timeOut);

      this.commentService.activeLemmaHighlight = {
        lemmaTimeOutId: settimeoutId,
        lemmaElement: lemmaStartElem
      }
    }
  }

  /**
   * Use this function to scroll to the comment with the specified numeric id
   * (excluding prefixes like 'end') in the first comments view on the page.
   * Alternatively, the comment element can be passed as an optional parameter.
   */
  private scrollToComment(numericId: string, commentElement?: HTMLElement) {
    let elem = commentElement;
    if (elem === undefined || elem === null || !elem.classList.contains('en' + numericId)) {
      // Find the comment in the comments view.
      const commentsWrapper = document.querySelector('comments') as HTMLElement;
      elem = commentsWrapper.getElementsByClassName('en' + numericId)[0] as HTMLElement;
    }
    if (elem !== null && elem !== undefined) {

      if (this.commentService.activeCommentHighlight.commentTimeOutId !== null) {
        // Clear previous comment highlight if still active
        this.commentService.activeCommentHighlight.commentLemmaElement.classList.remove('highlight');
        window.clearTimeout(this.commentService.activeCommentHighlight.commentTimeOutId);
      }

      // Scroll the comment into view.
      this.scrollElementIntoView(elem, 'center', -5);
      const noteLemmaElem = elem.getElementsByClassName('noteLemma')[0] as HTMLElement;
      noteLemmaElem.classList.add('highlight');
      const settimeoutId = setTimeout(() => {
        noteLemmaElem.classList.remove('highlight');
        this.commentService.activeCommentHighlight = {
          commentTimeOutId: null,
          commentLemmaElement: null
        }
      }, 5000);

      this.commentService.activeCommentHighlight = {
        commentTimeOutId: settimeoutId,
        commentLemmaElement: noteLemmaElem
      }
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

  // Scrolls element into view and prepends arrow for the duration of timeOut.
  private scrollToHTMLElement(element: HTMLElement, position = 'top', timeOut = 5000) {
    try {
      const tmpImage: HTMLImageElement = new Image();
      tmpImage.src = 'assets/images/ms_arrow_right.svg';
      tmpImage.alt = 'arrow image';
      tmpImage.classList.add('inl_ms_arrow');
      element.parentElement.insertBefore(tmpImage, element);
      this.scrollElementIntoView(tmpImage, position);
      setTimeout(function() {
        element.parentElement.removeChild(tmpImage);
      }, timeOut);
    } catch ( e ) {
      console.error(e);
    }
  }

  /**
   * This function can be used to scroll a container so that the element which it
   * contains is placed either at the top edge of the container or in the center
   * of the container. This function can be called multiple times simultaneously
   * on elements in different containers, unlike the native scrollIntoView function
   * which cannot be called multiple times simultaneously in Chrome due to a bug.
   * Valid values for yPosition are 'top' and 'center'.
   */
  private scrollElementIntoView(element: HTMLElement, yPosition = 'center', offset = 0) {
    if (element === undefined || element === null || (yPosition !== 'center' && yPosition !== 'top')) {
      return;
    }
    // Find the scrollable container of the element which is to be scrolled into view
    let container = element.parentElement;
    while (container !== null && container.parentElement !== null &&
      !container.classList.contains('scroll-content')) {
      container = container.parentElement;
    }
    if (container === null || container.parentElement === null) {
      return;
    }

    const y = Math.floor(element.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top);
    let baseOffset = 10;
    if (yPosition === 'center') {
      baseOffset = Math.floor(container.offsetHeight / 2);
      if (baseOffset > 45) {
        baseOffset = baseOffset - 45;
      }
    }
    container.scrollTo({top: y - baseOffset - offset, behavior: 'smooth'});
  }

  /**
   * This function scrolls the read-view horisontally to the last read column.
   * It's called after adding new views.
   * */
  scrollLastViewIntoView() {
    this.ngZone.runOutsideAngular(() => {
      let interationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = window.setInterval(function() {
        if (interationsLeft < 1) {
          clearInterval(this.intervalTimerId);
        } else {
          interationsLeft -= 1;
          const viewElements = document.getElementsByClassName('read-column');
          if (viewElements[0] !== undefined) {
            const lastViewElement = viewElements[viewElements.length - 1] as HTMLElement;
            const scrollingContainer = document.querySelector('page-read > ion-content > div.scroll-content');
            if (scrollingContainer !== null) {
              const x = lastViewElement.getBoundingClientRect().right + scrollingContainer.scrollLeft -
              scrollingContainer.getBoundingClientRect().left;
              scrollingContainer.scrollTo({top: 0, left: x, behavior: 'smooth'});
              clearInterval(this.intervalTimerId);
            }
          }
        }
      }.bind(this), 500);
    });
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-read-content';
    } else {
      return '';
    }
  }

  setCollectionAndPublicationLegacyId() {
    this.textService.getLegacyIdByPublicationId(this.params.get('publicationID')).subscribe(
      publication => {
        this.collectionAndPublicationLegacyId = '';
        if (publication[0].legacy_id) {
          this.collectionAndPublicationLegacyId = publication[0].legacy_id;
        }
      },
      error => {
        this.collectionAndPublicationLegacyId = '';
        console.log('could not get publication data trying to resolve collection and publication legacy id');
      }
    );
  }

/**
   * Removes all read-texts that are stored in storage based on the ids in the readtextIdsInStorage
   * array in textService, and empties the array.
   */
  clearReadtextsFromStorage() {
    if (this.textService.readtextIdsInStorage.length > 0) {
      this.textService.readtextIdsInStorage.forEach((readtextId) => {
        this.storage.remove(readtextId);
      });
      this.textService.readtextIdsInStorage = [];
    }
  }

  /**
   * Removes all variations that are stored in storage based on the ids in the varIdsInStorage
   * array in textService, and empties the array.
   */
  clearVariationsFromStorage() {
    if (this.textService.varIdsInStorage.length > 0) {
      this.textService.varIdsInStorage.forEach((varId) => {
        this.storage.remove(varId);
      });
      this.textService.varIdsInStorage = [];
    }
  }

  /**
   * Adds the sort order of a variation to the variationsOrder array in textService.
   */
  addVariationSortOrderToService(sortOrder: number) {
    if (sortOrder !== null && sortOrder !== undefined) {
      this.textService.variationsOrder.push(sortOrder);
    }
  }

  /**
   * Removes the sort order of the variations column with the given index from the variationsOrder
   * array in textService.
   */
  removeVariationSortOrderFromService(columnIndex: number) {
    const columnElem = document.querySelector('div#read_div_' + columnIndex);
    if (columnElem) {
      const currentVarElem = columnElem.querySelector('variations');
      if (currentVarElem) {
        /* Find the index of the current variations column among just the variations columns */
        const key = this.findVariationsColumnIndex(columnIndex);
        /* Remove the sort order of the removed variations column from textService */
        if (key !== undefined) {
          if (this.textService.variationsOrder[key] !== undefined) {
            this.textService.variationsOrder.splice(key, 1);
          }
        }
      }
    }
  }

  /**
   * Switches the positions of two variations columns' sort orders in the variationsOrder array
   * in textService.
   */
  switchVariationSortOrdersInService(currentColumnIndex: number, otherColumnIndex: number) {
    /* Check if either the current column or the one it is changing places with is a variations column */
    const currentColumnElem = document.querySelector('div#read_div_' + currentColumnIndex);
    const otherColumnElem = document.querySelector('div#read_div_' + otherColumnIndex);
    if (currentColumnElem && otherColumnElem) {
      const currentVarElem = currentColumnElem.querySelector('variations');
      const otherVarElem = otherColumnElem.querySelector('variations');
      if (currentVarElem && otherVarElem) {
        /* Find the indices of the two variations column among just the variations columns */
        const currentVarIndex = this.findVariationsColumnIndex(currentColumnIndex);
        let otherVarIndex = currentVarIndex + 1;
        if (otherColumnIndex < currentColumnIndex) {
          otherVarIndex = currentVarIndex - 1;
        }
        this.textService.variationsOrder = this.moveArrayItem(this.textService.variationsOrder, currentVarIndex, otherVarIndex);
      }
    }

  }

  /**
   * Given the read column index of a variations column, this function returns the index of the
   * column among just the variations columns in the read view. So, for instance, if there are
   * 3 read columns in total, 2 of which are variations columns, this function can tell if the
   * variations column with index columnIndex is the first or second variations column.
   */
  findVariationsColumnIndex(columnIndex: number) {
    const columnElems = Array.from(document.querySelectorAll('div.read-column'));
    const varColIds = [];
    columnElems.forEach(function(column) {
      const varElem = column.querySelector('variations');
      if (varElem) {
        varColIds.push(column.id);
      }
    });
    let varIndex = undefined;
    for (let i = 0; i < varColIds.length; i++) {
      if (varColIds[i] === 'read_div_' + columnIndex) {
        varIndex = i;
        break;
      }
    }
    return varIndex;
  }

  setFabBackdropWidth() {
    const pageReadElem = document.querySelector('page-read > ion-content > div.scroll-content');
    if (pageReadElem) {
      this.backdropWidth = pageReadElem.scrollWidth;
    }
  }

}
