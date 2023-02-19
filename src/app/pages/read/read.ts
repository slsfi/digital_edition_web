import { Component, Renderer2, ElementRef, OnDestroy, ViewChild, Input, EventEmitter, SecurityContext, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, IonFab, ModalController, PopoverController, ToastController } from '@ionic/angular';
import { TranslateModule, LangChangeEvent, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { global } from 'src/app/global';
import { CommentModalPage } from 'src/app/modals/comment-modal/comment-modal';
import { DownloadTextsModalPage } from 'src/app/modals/download-texts-modal/download-texts-modal';
import { OccurrencesPage } from 'src/app/modals/occurrences/occurrences';
import { ReadPopoverPage } from 'src/app/modals/read-popover/read-popover';
import { SearchAppPage } from 'src/app/modals/search-app/search-app';
import { SharePopoverPage } from 'src/app/modals/share-popover/share-popover';
import { EstablishedText } from 'src/app/models/established-text.model';
import { OccurrenceResult } from 'src/app/models/occurrence.model';
import { TableOfContentsItem } from 'src/app/models/table-of-contents-item.model';
import { TableOfContentsCategory } from 'src/app/models/table-of-contents.model';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { PublicationCacheService } from 'src/app/services/cache/publication-cache.service';
import { CommentService } from 'src/app/services/comments/comment.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { TooltipService } from 'src/app/services/tooltips/tooltip.service';
import { DragScrollComponent } from 'src/directives/ngx-drag-scroll/public-api';

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

// @IonicPage({
//   name: 'read',
//   segment: 'publication/:collectionID/text/:publicationID/:chapterID/:facs_id/:facs_nr/:song_id/:search_title/:urlviews'
// })
@Component({
  selector: 'page-read',
  templateUrl: './read.html',
  styleUrls: ['read.scss'],
})
export class ReadPage /*implements OnDestroy*/ {
  @ViewChild('nav', { read: DragScrollComponent }) ds!: DragScrollComponent;
  // @ViewChild('content') content!: ElementRef;
  // @ViewChild('readColumn') readColumn!: ElementRef;
  // @ViewChild('scrollBar') scrollBar!: ElementRef;
  // @ViewChild('toolbar') navBar!: ElementRef;
  // @ViewChild('fab') fabList: FabContainer;
  // @ViewChild('settingsIconElement') settingsIconElement: ElementRef;

  textType: TextType = TextType.ReadText;

  id?: string;
  multilingualEST: false;
  estLanguages = [];
  estLang: 'none';
  establishedText?: EstablishedText;
  errorMessage?: string;
  appName?: string;
  tocRoot?: TableOfContentsCategory[];
  popover?: ReadPopoverPage;
  sharePopover?: SharePopoverPage;
  subTitle?: string;
  cacheItem = false;
  collectionTitle?: string;
  hasOccurrenceResults = false;
  showOccurrencesModal = false;
  searchResult: string | null;
  toolTipsSettings?: Record<string, any> = {};
  toolTipPosType: string;
  toolTipPosition: any;
  toolTipMaxWidth: string | null;
  toolTipScaleValue: number | null;
  toolTipText: string = '';
  tooltipVisible: Boolean = false;
  infoOverlayPosType: string;
  infoOverlayPosition: any;
  infoOverlayWidth: string | null;
  infoOverlayText: string;
  infoOverlayTitle: string;
  intervalTimerId: number;
  nochapterPos?: any;
  userIsTouching: Boolean = false;
  collectionAndPublicationLegacyId?: string;
  illustrationsViewShown: Boolean = false;
  simpleWorkMetadata?: Boolean;
  showURNButton: Boolean;
  showDisplayOptionsButton: Boolean = true;
  showTextDownloadButton: Boolean = false;
  usePrintNotDownloadIcon: Boolean = false;
  backdropWidth: number;

  prevItem: any;
  nextItem: any;

  divWidth = '100px';

  private unlistenFirstTouchStartEvent?: () => void;
  private unlistenClickEvents?: () => void;
  private unlistenMouseoverEvents?: () => void;
  private unlistenMouseoutEvents?: () => void;

  // Used for infinite facsimile
  facs_id: any;
  facs_nr: any;
  song_id: any;
  search_title: any;

  matches?: Array<string>;
  external?: string;

  typeVersion?: string;
  displayToggles: any;
  displayToggle = true;

  prevnext: any;
  texts: any;

  occurrenceResult?: OccurrenceResult;

  legacyId = '';
  songDatafile = '';

  views = [] as any;

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
    'persons': {} as any,
    'comments': {} as any,
    'works': {} as any,
    'places': {} as any,
    'abbreviations': {} as any,
    'footnotes': {} as any
  };

  paramCollectionID: any;
  paramPublicationID: any;
  paramChapterID: any;
  paramFacsId: any;
  paramFacsNr: any;
  paramSongId: any;
  paramSearchTitle: any;
  paramUrlviews: any;

  queryParamTocItem: any
  queryParamRoot: any
  queryParamViews: any
  queryParamSearchResult: any
  queryParamOccurrenceResult: any
  queryParamId: any
  queryParamLegacyId: any
  queryParamSelectedItemInAccordion: any
  queryParamObjectType: any
  queryParamMatches: any
  queryParamShowOccurrencesModalOnRead: any
  queryParamTocLinkId: any

  paramsLoaded?: boolean
  queryParamsLoaded?: boolean

  constructor(
    // public viewCtrl: ViewController,
    // public navCtrl: NavController,
    // public params: NavParams,
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
    public tocService: TableOfContentsService,
    public translate: TranslateService,
    private langService: LanguageService,
    private events: EventsService,
    private storage: StorageService,
    public semanticDataService: SemanticDataService,
    public userSettingsService: UserSettingsService,
    public publicationCacheService: PublicationCacheService,
    private analyticsService: AnalyticsService,
    public commonFunctions: CommonFunctionsService,
    private route: ActivatedRoute,
    private router: Router,
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
      // console.log('i18n: ', i18n);

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
            if (value) {
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
              if (value) {
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

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.paramCollectionID = params['collectionID'];
      this.paramPublicationID = params['publicationID'];
      this.paramChapterID = params['chapterID'];
      this.paramFacsId = params['facs_id'];
      this.paramFacsNr = params['facs_nr'];
      this.paramSongId = params['song_id'];
      this.paramSearchTitle = params['search_title'];
      this.paramUrlviews = params['urlviews'];

      this.paramsLoaded = true;

      if (this.paramsLoaded && this.queryParamsLoaded) {
        this.ngOnInitLang();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tocItem']) {
        try {
          this.queryParamTocItem = JSON.parse(params['tocItem']);
        } catch(e: any) {}
      }
      if (params['root']) {
        try {
          this.queryParamRoot = JSON.parse(params['root']);
        } catch(e: any) {}
      }
      if (params['views']) {
        try {
          this.queryParamViews = JSON.parse(params['views']);
        } catch(e: any) {}
      }
      if (params['searchResult']) {
        try {
          this.queryParamSearchResult = JSON.parse(params['searchResult']);
        } catch(e: any) {}
      }
      if (params['occurrenceResult']) {
        try {
          this.queryParamOccurrenceResult = JSON.parse(params['occurrenceResult']);
        } catch(e: any) {}
      }
      if (params['matches']) {
        try {
          this.queryParamMatches = JSON.parse(params['matches']);
        } catch(e: any) {}
      }
      this.queryParamId = params['id'];
      this.queryParamLegacyId = params['legacyId'];
      this.queryParamSelectedItemInAccordion = params['selectedItemInAccordion'];
      this.queryParamObjectType = params['objectType'];
      this.queryParamShowOccurrencesModalOnRead = params['showOccurrencesModalOnRead'];
      this.queryParamTocLinkId = params['tocLinkId'];

      this.queryParamsLoaded = true;

      if (this.paramsLoaded && this.queryParamsLoaded) {
        this.ngOnInitLang();
      }
    });
  }

  ngOnInitLang() {
    this.langService.getLanguage().subscribe(lang => {
      if (this.paramCollectionID !== 'songtypes') {
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
        if (this.displayToggles[toggle as keyof typeof this.displayToggles] && toggle !== 'introduction') {
          this.availableViewModes.push(toggle);
          foundTrueCount++;
        }
      }
      if (foundTrueCount <= 1) {
        this.displayToggle = false;
      }



      if (this.queryParamTocItem !== undefined && this.queryParamTocItem !== null) {
        // @TODO: fix this. it is unmaintainable
        this.id = this.queryParamTocItem.itemId;
        const collectionIsUndefined = (this.queryParamTocItem.collection_id !== undefined);
        const linkIdIsNotUndefined = (this.queryParamTocItem.link_id !== undefined);
        const collectionID = this.queryParamTocItem.collection_id;

        link = (collectionIsUndefined ? collectionID : this.queryParamTocItem.toc_ed_id) + '_'
          + (this.queryParamTocItem.link_id || this.queryParamTocItem.toc_linkID);

      } else if (this.paramCollectionID !== undefined && this.queryParamId === 'introduction') {

      } else if (this.paramCollectionID !== undefined && this.queryParamId !== undefined) {
        this.id = this.queryParamId;
        link = this.paramCollectionID + '_' + this.id;
      }

      const title = global.getSubtitle();
      this.tocRoot = this.queryParamRoot;
      this.establishedText = new EstablishedText({ link: link, id: this.id, title: title, text: '' });

      if (this.queryParamLegacyId !== undefined) {
        this.legacyId = this.queryParamLegacyId;
        this.establishedText.link = this.queryParamLegacyId;
      } else {

        this.legacyId = this.paramCollectionID + '_' + this.paramPublicationID;
        this.establishedText.link = this.paramCollectionID + '_' + this.paramPublicationID;

        if (this.paramChapterID !== undefined && !this.paramChapterID.startsWith('nochapter') &&
        this.paramChapterID !== ':chapterID' && this.paramChapterID !== 'chapterID') {
          this.establishedText.link += '_' + this.paramChapterID;
        }

        if (this.paramChapterID !== undefined && this.paramChapterID.startsWith('nochapter;')) {
          this.nochapterPos = this.paramChapterID.replace('nochapter;', '');
        } else {
          this.nochapterPos = null;
        }

        // this.viewCtrl.setBackButtonText('');

        if (!this.queryParamSelectedItemInAccordion) {
          const searchTocItem = true;
          this.getTocRoot(this.paramCollectionID, searchTocItem);
        }

        if (this.paramCollectionID !== 'songtypes' && !this.appUsesAccordionToc) {
          // this.events.publish('pageLoaded:single-edition', { 'title': title });
        }
      }

      // Save the id of the previous and current read view text in textService.
      if (this.establishedText && this.establishedText.link) {
        this.textService.previousReadViewTextId = this.textService.readViewTextId;
        this.textService.readViewTextId = this.establishedText.link;
      }

      if (this.queryParamMatches !== undefined) {
        this.matches = this.queryParamMatches;
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

      // if (this.params.get('song_datafile') !== undefined && this.params.get('song_datafile').indexOf('.json') !== -1) {
      //   //
      // }

      if (this.queryParamSearchResult !== undefined) {
        this.searchResult = this.queryParamSearchResult;
      }

      if (this.queryParamOccurrenceResult !== undefined && this.queryParamShowOccurrencesModalOnRead) {
        this.hasOccurrenceResults = true;
        this.showOccurrencesModal = true;
        this.occurrenceResult = this.queryParamOccurrenceResult;
        this.storage.set('readpage_searchresults', this.queryParamOccurrenceResult);
      } else {
        this.storage.get('readpage_searchresults').then((occurrResult) => {
          if (occurrResult) {
            this.hasOccurrenceResults = true;
            this.occurrenceResult = occurrResult;
          }
        });
      }

      this.events.getShowView().subscribe((data) => {
        const { view, id, chapter } = data;
        // user and time are the same arguments passed in `events.publish(user, time)`
        console.log('Welcome', view, 'at', id, 'chapter', chapter);
        this.openNewExternalView(view, id);
      })

      this.getAdditionalParams();
    });
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishMusicAccordionReset(true);

    // if (this.userSettingsService.isMobile()) {
    //   this.viewCtrl.showBackButton(true);
    // } else {
    //   this.viewCtrl.showBackButton(false);
    // }
    if (this.paramPublicationID === 'first') {
      this.showFirstText();
    } else {
      this.showText();
    }
    if ( this.establishedText !== undefined && this.establishedText.title !== undefined ) {
      // this.events.publish('pageLoaded:read', { 'title': this.establishedText.title });
    }

    this.events.getUpdatePositionInPageRead().subscribe((params) => {
      /* This is triggered when the publication chapter that should be opened in page-read
         is the same as the previous, only with a different text position. Then page-read
         is not reloaded, but the read-text is just scrolled to the correct position. */
      console.log('Scrolling to new position in read text');

      const idParts = params.tocLinkId.split(';');
      if (idParts.length > 1 && idParts[1]) {
        this.textService.previousReadViewTextId = this.textService.readViewTextId;
        this.textService.readViewTextId = params.tocLinkId;
        if (this.establishedText) {
          this.establishedText.link = params.tocLinkId;
          this.establishedText.id = params.tocLinkId;
        }
        this.updatePositionInURL(params.tocLinkId);

        const posId = idParts[1];
        this.ngZone.runOutsideAngular(() => {
          try {
            this.scrollReadTextToAnchorPosition(posId);
            const itemId = 'toc_' + this.establishedText?.link;
            let foundElem = document.getElementById(itemId);
            if (foundElem === null) {
              // Scroll to toc item without position
              foundElem = document.getElementById(itemId.split(';').shift() || '');
            }
            if (foundElem) {
              this.scrollToTOC(foundElem);
            }
          } catch (e) {
          }
        });
      } else {
        // No position in params --> reload the view with the given params
        // const nav = this.app.getActiveNavs();
        // nav[0].setRoot('read', params);
        this.router.navigate([`/publication/${idParts[0]}/text/${idParts[1]}/`], { queryParams: params });
      }
    });

    this.setUpTextListeners();
    this.setCollectionAndPublicationLegacyId();
  }

  ionViewDidEnter() {
    this.events.publishHelpContinue();
    // this.events.publish('help:continue');
    this.analyticsService.doPageView('Read');
  }

  ionViewWillLeave() {
    this.unlistenClickEvents?.();
    this.unlistenMouseoverEvents?.();
    this.unlistenMouseoutEvents?.();
    this.unlistenFirstTouchStartEvent?.();
    this.events.getUpdatePositionInPageRead().complete();
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ionViewDidLeave() {
    this.storage.set('readpage_searchresults', undefined);
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      let iterationsLeft = 6;
      clearInterval(this.intervalTimerId);
      const that = this;
      this.intervalTimerId = window.setInterval(function() {
        try {
          if (iterationsLeft < 1) {
            clearInterval(that.intervalTimerId);
          } else {
            iterationsLeft -= 1;
            if (that.establishedText && that.establishedText.link) {
              const itemId = 'toc_' + that.establishedText.link;
              let foundElem = document.getElementById(itemId);
              if (foundElem === null || foundElem === undefined) {
                // Scroll to toc item without position
                foundElem = document.getElementById(itemId.split(';').shift() || '');
              }
              if (foundElem) {
                that.scrollToTOC(foundElem);
                clearInterval(that.intervalTimerId);
              }
            }
          }
        } catch (e) {
          console.log('error in setInterval function in PageRead.ngAfterViewInit()', e);
        }
      }.bind(this), 500);
    });
    this.setFabBackdropWidth();
  }

  ngOnDestroy() {
    this.events.getShowView().complete();
  }

  getAdditionalParams() {
    if (this.paramFacsId !== undefined &&
      this.paramFacsId !== ':facs_id' &&
      this.paramFacsNr !== undefined &&
      this.paramFacsNr !== ':facs_nr' &&
      this.paramFacsId !== 'not' &&
      this.paramFacsNr !== 'infinite') {
      this.facs_id = this.paramFacsId;
      this.facs_nr = this.paramFacsNr;

      if (this.paramSongId !== undefined &&
        this.paramSongId !== ':song_id' &&
        this.paramSongId !== 'nosong') {
        this.song_id = this.paramSongId;
      }
    } else {
      //
    }

    if (this. paramSearchTitle !== undefined &&
      this. paramSearchTitle !== ':song_id' &&
      this. paramSearchTitle !== 'searchtitle') {
      this.search_title = this. paramSearchTitle;
    }
    if (this.matches === undefined || this.matches.length < 1) {
      // Get search match phrases from search_title and decode them
      if (this.search_title) {
        const search_matches = this.search_title.split('_');
        search_matches.forEach((search_match: any) => {
          let decoded_match = decodeURIComponent(search_match);
          // Remove line break characters
          decoded_match = decoded_match.replace(/\n/gm, '');
          // Remove any script tags
          decoded_match = decoded_match.replace(/<script.+?<\/script>/gi, '');
          decoded_match = this.commonFunctions.encodeCharEntities(decoded_match);
          this.matches?.push(decoded_match);
        });
      }
    }
  }

  async openOccurrenceResult() {
    let showOccurrencesModalOnRead = false;
    let objectType = '';

    if (this.showOccurrencesModal) {
      showOccurrencesModalOnRead = true;
    }

    if (this.queryParamObjectType) {
      objectType = this.queryParamObjectType;
    }

    if (this.hasOccurrenceResults && this.occurrenceResult) {
      const occurrenceModal = await this.modalCtrl.create({
        component: OccurrencesPage,
        componentProps: {
          occurrenceResult: this.occurrenceResult,
          showOccurrencesModalOnRead: showOccurrencesModalOnRead,
          objectType: objectType
        }
      });

      occurrenceModal.present();
    }
  }

  async openSearchResult() {
    const searchModal = await this.modalCtrl.create({
      component: SearchAppPage,
      componentProps: { searchResult: this.searchResult }
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
        (tocItems: any) => {
          tocItems.selectedCollId = null;
          tocItems.selectedPubId = null;
          if (this.paramCollectionID && this.paramPublicationID) {
            tocItems.selectedCollId = this.paramCollectionID;
            tocItems.selectedPubId = this.paramPublicationID;
          }

          const chIDFromParams = this.paramChapterID;
          if (chIDFromParams !== undefined
          && chIDFromParams !== null
          && !chIDFromParams.startsWith('nochapter')
          && chIDFromParams !== ':chapterID'
          && chIDFromParams !== 'chapterID') {
            tocItems.selectedChapterId = chIDFromParams;
          } else {
            tocItems.selectedChapterId = '';
          }

          const tocLoadedParams = { tocItems: tocItems } as any;

          if (searchTocItem && this.appUsesAccordionToc) {
            tocLoadedParams['searchTocItem'] = true;
            tocLoadedParams['collectionID'] = this.paramCollectionID;
            tocLoadedParams['publicationID'] = this.paramPublicationID;
            tocLoadedParams['chapterID'] = this.paramChapterID;

            if (this.search_title) {
              tocLoadedParams['search_title'] = this.search_title;
            }
          }
          this.events.publishTableOfContentsLoaded(tocLoadedParams);
          this.storage.set('toc_' + id, tocItems);
        },
        error => { this.errorMessage = <any>error });
  }

  setTocCache() {
    const id = this.paramCollectionID;
    this.tocService.getTableOfContents(id)
      .subscribe(
        tocItems => {
          this.storage.set('toc_' + id, tocItems);
        },
        error => console.log(error)
      );
  }

  setCollectionTitle() {
    this.textService.getCollection(this.paramCollectionID).subscribe(
      collection => {
        this.collectionTitle = collection.name;
      },
      error => {
        console.log('could not get collection title');
      }
    );
  }

  setViews(viewmodes: any) {
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

    const that = this;
    viewmodes.forEach(function (viewmode: any) {
      // set the first viewmode as default
      that.show = viewmodes[0];

      // check if it is similar to established_sv
      const parts = viewmode.split('_');
      if (parts.length > 1) {
        that.addView(parts[0], null, null, null, null, parts[1]);
      } else {
        if (viewmode === 'variations') {
          // this.addView(viewmode, null, null, null, null, null, variationsViewOrderNumber);
          if (sameCollection && that.textService.variationsOrder.length > 0) {
            that.addView(viewmode, null, null, null, null, null, that.textService.variationsOrder[variationsViewOrderNumber]);
          } else {
            that.addView(viewmode, null, null, null, null, null, variationsViewOrderNumber);
            that.textService.variationsOrder.push(variationsViewOrderNumber);
          }
          variationsViewOrderNumber++;
        } else {
          that.addView(viewmode);
        }
      }
    }.bind(this));
  }

  showAllViews() {
    const that = this;
    this.availableViewModes.forEach(function (viewmode: any) {
      const viewTypesShown = that.getViewTypesShown();
      if (viewmode !== 'showAll' && that.viewModeShouldBeShown(viewmode) && viewTypesShown.indexOf(viewmode) === -1) {
        that.show = viewmode;
        that.addView(viewmode);
      }
    }.bind(this));
  }

  viewModeShouldBeShown(viewmode: any) {
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
      urlViews = this.paramUrlviews || '';
    } catch (e) {
      console.log(e);
    }
    const views = (urlViews + '').split('&');
    if (this.queryParamViews !== undefined) {
      this.setViewsFromSearchResults();
    } else {
      if (urlViews !== 'default' && urlViews.length > 0 && this.viewsExistInAvailableViewModes(views)) {
        this.openUrlViews(views);
      } else {
        this.setOpenedViewsFromLocalStorage();
      }
    }
  }

  openUrlViews(views: any) {
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
    for (const v of this.queryParamViews) {
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
        const that = this;
        defaultReadModes.forEach(function (val: any) {
          if (!defaultReadModeForMobileSelected && that.displayToggles[val]) {
            /* Sets the default view on mobile to the first default read mode view which is available. */
            that.show = val;
            defaultReadModeForMobileSelected = true;
          }
          that.addView(val);
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

    if (this.paramFacsId !== undefined &&
      this.paramFacsId !== 'not' &&
      this.paramFacsId !== ':facs_id' &&
      this.paramFacsNr !== undefined &&
      this.paramFacsNr !== 'infinite' &&
      this.paramFacsNr !== ':facs_nr') {
      facs_id = this.paramFacsId;
      facs_nr = this.paramFacsNr;
      if (this.paramSongId !== undefined &&
        this.paramSongId !== ':song_id' &&
        this.paramSongId !== 'nosong') {
        song_id = this.paramSongId;
      } else {
        song_id = 'nosong';
      }
    } else {
      facs_id = 'not';
      facs_nr = 'infinite';
      song_id = 'nosong';
    }

    let chapter_id = 'nochapter';
    if (this.paramChapterID !== undefined && !this.paramChapterID.startsWith('nochapter') &&
    this.paramChapterID !== ':chapterID' && this.paramChapterID !== 'chapterID') {
      chapter_id = this.paramChapterID;
    }

    if (this. paramSearchTitle !== undefined &&
      this. paramSearchTitle !== ':song_id' &&
      this. paramSearchTitle !== 'searchtitle') {
      search_title = this. paramSearchTitle;
    } else {
      search_title = 'searchtitle';
    }
    const colID = this.paramCollectionID;
    const pubID = this.paramPublicationID;

    const url = `/publication/${colID}/text/${pubID}/${chapter_id}/${facs_id}/${facs_nr}/${song_id}/${search_title}/`;

    const viewModes = this.getViewTypesShown();

    if (viewModes.includes('illustrations')) {
      this.illustrationsViewShown = true;
    } else {
      this.illustrationsViewShown = false;
    }

    // this causes problems with back, thus this check.
    // if (!this.navCtrl.canGoBack() ) {
    window.history.replaceState('', '', url.concat(viewModes.join('&')));
    // }
  }

  updatePositionInURL(textId: string) {
    const currentPage = String(window.location.href);
    let url = '/' + currentPage.split('/')[1];

    const idParts = textId.split('_');
    let chapter = '';
    if (textId.indexOf(';') > -1) {
      if (idParts.length > 2) {
        chapter = idParts[2];
      } else if (idParts.length > 1) {
        chapter = 'nochapter;' + idParts[1].split(';')[1];
      }
    }
    let pubId = url.slice(url.indexOf('/text/') + 6);
    let endPart = pubId.slice(pubId.indexOf('/') + 1);
    endPart = endPart.slice(endPart.indexOf('/'));
    pubId = pubId.slice(0, pubId.indexOf('/'));

    url = url.slice(0, url.indexOf('/text/') + 6) + pubId + '/' + chapter + endPart;
    const viewModes = this.getViewTypesShown();
    // this causes problems with back, thus this check.
    // if (!this.navCtrl.canGoBack() ) {
    //   window.history.replaceState('', '', url);
    // }
    this.router.navigate([url])
  }

  viewsExistInAvailableViewModes(viewmodes: any) {
    const that = this;
    viewmodes.forEach(function (viewmode: any) {
      if ( that.availableViewModes.indexOf(viewmode) === -1 ) {
        return false;
      }
      return viewmode;
    }.bind(this));

    return true;
  }

  getViewTypesShown() {
    const viewModes = [] as any;

    this.views.forEach(function (view: any) {
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
    const collectionID = this.paramCollectionID;
    const publicationID = this.queryParamId;
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

    const collectionID = this.paramCollectionID;
    const publicationID = this.paramPublicationID;

    if (this.cacheItem) {
      this.addToCache(collectionID, publicationID);
    } else if (!this.cacheItem) {
      this.removeFromCache(collectionID, publicationID);
    }
  }

  async addToCache(collectionID: any, publicationID: any) {
    const id = collectionID + '_' + publicationID;
    const types = ['est', 'ms', 'var'];
    const added = true;

    if (this.collectionTitle) {
      await this.publicationCacheService.cachePublication(collectionID, publicationID, this.collectionTitle);
    }
    await this.storage.set(id + '_cached', true);

    let status = 'Something went wrong';
    if (added) {
      status = 'Publication was successfully added to cache';
    }

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.present();
  }

  async removeFromCache(collectionID: any, publicationID: any) {
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

    let status = 'Something went wrong'
    if (removed) {
      status = 'Publication was successfully removed from cache';
    }

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.present();
  }

  scrollToTOC(element: HTMLElement) {
    try {
      if (element !== null) {
        this.commonFunctions.scrollElementIntoView(element);
      }
    } catch (e) {
      console.log(e);
    }
  }

  private getEventTarget(event: any) {
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
        this.unlistenMouseoverEvents?.();
        this.unlistenMouseoutEvents?.();
        this.unlistenFirstTouchStartEvent?.();
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
                let lemmaStart = document.querySelector('page-read:not([hidden]) read-text') as HTMLElement;
                lemmaStart = lemmaStart.querySelector('[data-id="' + targetId + '"]') as HTMLElement;
                if (lemmaStart.parentElement !== null && lemmaStart.parentElement.classList.contains('ttFixed')) {
                  // The lemma is in a footnote, so we should get the second element with targetId.
                  lemmaStart = document.querySelector('page-read:not([hidden]) read-text') as HTMLElement;
                  lemmaStart = lemmaStart.querySelectorAll('[data-id="' + targetId + '"]')[1] as HTMLElement;
                }
                if (lemmaStart !== null && lemmaStart !== undefined) {
                  // Scroll to start of lemma in reading text and temporarily prepend arrow.
                  this.commentService.scrollToCommentLemma(lemmaStart);
                  // Scroll to comment in the comments-column.
                  this.commentService.scrollToComment(numId);
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
              let parentElem: any = eventTarget;
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
            && eventTarget['parentNode']
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
          window.setTimeout(function(elem: any) {
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
              targetId = anchorElem.getAttribute('href') || '';
            } else if (anchorElem.parentElement && anchorElem.parentElement.hasAttribute('href')) {
              targetId = anchorElem.parentElement.getAttribute('href') || '';
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
                containerElem = document.querySelector('page-read:not([hidden]) #' + targetColumnId);
              } else {
                containerElem = anchorElem.parentElement;
                while (containerElem !== null && containerElem.parentElement !== null &&
                !(containerElem.classList.contains('scroll-content') &&
                containerElem.parentElement.tagName === 'ION-SCROLL')) {
                  containerElem = containerElem.parentElement;
                }
                if (containerElem?.parentElement === null) {
                  containerElem = null;
                }
                if (containerElem === null) {
                  // Check if a footnotereference link in infoOverlay. This method is used to find the container element if in mobile mode.
                  if (anchorElem.parentElement !== null
                  && anchorElem.parentElement.parentElement !== null
                  && anchorElem.parentElement.parentElement.hasAttribute('class')
                  && anchorElem.parentElement.parentElement.classList.contains('infoOverlayContent')) {
                    containerElem = document.querySelector('page-read:not([hidden]) .mobile-mode-read-content > .scroll-content > ion-scroll > .scroll-content');
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
                  this.commonFunctions.scrollToHTMLElement(target, 'top');
                }
              }
            }
          } else if (anchorElem.classList.contains('ref_variant')) {
            // Click on link to another variant text
            const sid = 'sid-' + anchorElem.href.split(';sid-')[1];
            const varTargets = Array.from(document.querySelectorAll('#' + sid));

            if (varTargets.length > 0) {
              this.commonFunctions.scrollElementIntoView(anchorElem);
              anchorElem.classList.add('highlight');
              window.setTimeout(function(elem: any) {
                elem.classList.remove('highlight');
              }.bind(null, anchorElem), 5000);

              varTargets.forEach((varTarget: any) => {
                this.commonFunctions.scrollElementIntoView(varTarget);
                if (varTarget.firstElementChild !== null
                  && varTarget.firstElementChild !== undefined) {
                  if (varTarget.firstElementChild.classList.contains('var_margin')) {
                    const marginElem = varTarget.firstElementChild;

                    // Highlight all children of the margin element that have the ref_variant class
                    const refVariants = Array.from(marginElem.querySelectorAll('.ref_variant'));
                    refVariants.forEach((refVariant: any) => {
                      refVariant.classList.add('highlight');
                      window.setTimeout(function(elem: any) {
                        elem.classList.remove('highlight');
                      }.bind(null, refVariant), 5000);
                    });

                    if (marginElem.firstElementChild !== null && marginElem.firstElementChild !== undefined
                      && marginElem.firstElementChild.classList.contains('extVariantsTrigger')) {
                        marginElem.firstElementChild.classList.add('highlight');
                        window.setTimeout(function(elem: any) {
                          elem.classList.remove('highlight');
                        }.bind(null, marginElem.firstElementChild), 5000);
                    }
                  }
                }
              });
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
            const hrefTargetItems: Array<string> = decodeURIComponent(String(hrefLink).split('/').pop() || '').trim().split(' ');
            let publicationId = '';
            let textId = '';
            let chapterId = '';
            let positionId = '';

            if (anchorElem.classList.contains('ref_readingtext') || anchorElem.classList.contains('ref_comment')) {
              // Link to reading text or comment.

              let comparePageId = '';

              if (hrefTargetItems.length === 1 && hrefTargetItems[0].startsWith('/')) {
                // If only a position starting with a hash, assume it's in the same publication, text and chapter.
                publicationId = this.establishedText?.link.split(';').shift()?.split('_')[0] || '';
                textId = this.establishedText?.link.split(';').shift()?.split('_')[1] || '';
                chapterId = this.paramChapterID;
                if (chapterId !== undefined
                  && chapterId !== null
                  && !chapterId.startsWith('nochapter')
                  && chapterId !== ':chapterID'
                  && chapterId !== 'chapterID') {
                    chapterId = chapterId.split(';').shift() || chapterId;
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
                if (hrefTargetItems.length > 2 && !hrefTargetItems[2].startsWith('/')) {
                  chapterId = hrefTargetItems[2];
                  comparePageId += '_' + chapterId;
                }
              }

              let legacyPageId = this.collectionAndPublicationLegacyId;
              const chIDFromParams = this.paramChapterID;
              if (chIDFromParams !== undefined
              && chIDFromParams !== null
              && !chIDFromParams.startsWith('nochapter')
              && chIDFromParams !== ':chapterID'
              && chIDFromParams !== 'chapterID') {
                legacyPageId += '_' + chIDFromParams.split(';').shift();
              }

              // Check if we are already on the same page.
              if ( (comparePageId === this.establishedText?.link.split(';').shift() || comparePageId === legacyPageId)
              && hrefTargetItems[hrefTargetItems.length - 1].startsWith('/')) {
                // We are on the same page and the last item in the target href is a textposition.
                positionId = hrefTargetItems[hrefTargetItems.length - 1].replace('/', '');

                // Find the element in the correct column (read-text or comments) based on ref type.
                const matchingElements = document.querySelectorAll('page-read:not([hidden]) [name="' + positionId + '"]');
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
                    if (targetElement.parentElement?.classList.contains('ttFixed')
                    || targetElement.parentElement?.parentElement?.classList.contains('ttFixed')) {
                      // Found position is in footnote --> look for next occurence since the first footnote element
                      // is not displayed (footnote elements are copied to a list at the end of the reading text and that's
                      // the position we need to find).
                    } else {
                      break;
                    }
                  }
                }
                if (targetElement !== null && targetElement.classList.contains('anchor')) {
                  this.commonFunctions.scrollToHTMLElement(targetElement);
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

                  let hrefString = '/publication/' + publicationId + '/text/' + textId + '/';
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
                  if (newWindowRef) {
                    newWindowRef.location.href = hrefString;
                  }
                });
              }

            } else if (anchorElem.classList.contains('ref_introduction')) {
              // Link to introduction.
              publicationId = hrefTargetItems[0];

              this.textService.getCollectionAndPublicationByLegacyId(publicationId).subscribe(data => {
                if (data[0] !== undefined) {
                  publicationId = data[0]['coll_id'];
                }
                let hrefString = '/publication-introduction/' + publicationId;
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
              if (this.toolTipsSettings?.['personInfo']
              && eventTarget['classList'].contains('person')
              && this.readPopoverService.show.personInfo) {
                this.ngZone.run(() => {
                  this.showPersonTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings?.['placeInfo']
              && eventTarget['classList'].contains('placeName')
              && this.readPopoverService.show.placeInfo) {
                this.ngZone.run(() => {
                  this.showPlaceTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings?.['workInfo']
              && eventTarget['classList'].contains('title')
              && this.readPopoverService.show.workInfo) {
                this.ngZone.run(() => {
                  this.showWorkTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                });
              } else if (this.toolTipsSettings?.['comments']
              && eventTarget['classList'].contains('comment')
              && this.readPopoverService.show.comments) {
                this.ngZone.run(() => {
                  this.showCommentTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              } else if (this.toolTipsSettings?.['footNotes']
              && eventTarget['classList'].contains('teiManuscript')
              && eventTarget['classList'].contains('ttFoot')) {
                this.ngZone.run(() => {
                  this.showManuscriptFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              } else if (this.toolTipsSettings?.['footNotes']
              && eventTarget['classList'].contains('ttFoot')) {
                this.ngZone.run(() => {
                  this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget);
                });
              }
            } else if ( (this.toolTipsSettings && this.toolTipsSettings['changes'] && eventTarget['classList'].contains('ttChanges')
            && this.readPopoverService.show.changes)
            || (this.toolTipsSettings && this.toolTipsSettings['normalisations'] && eventTarget['classList'].contains('ttNormalisations')
            && this.readPopoverService.show.normalisations)
            || (this.toolTipsSettings && this.toolTipsSettings['abbreviations'] && eventTarget['classList'].contains('ttAbbreviations')
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
                let parentElem: HTMLElement | null = eventTarget as HTMLElement;
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
            } else if (this.toolTipsSettings?.['footNotes'] && eventTarget.hasAttribute('id')
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
    if (this.establishedText) {
      this.establishedText.content = '';
    }
    this.getIntroduction(this.paramCollectionID, this.translate.currentLang);
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
    const cache_id = 'col_' + this.paramCollectionID + 'first_pub';
    let inCache = false;

    this.storage.get(cache_id).then((content) => {
      if (content) {
        this.establishedText = content;
        inCache = true;
      }
    });

    if (!inCache) {
      this.textService.getCollectionPublications(this.paramCollectionID).subscribe(
        pub => {
          if (this.establishedText) {
            this.establishedText.content = '';
            this.establishedText.title = pub[0].name;
            this.establishedText.link = pub[0].legacyId;
          }
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
    // this.viewCtrl.dismiss();
  }

  setText(id: any, data: any) {

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

      tmpContent = documentFragment.querySelector(selector)?.innerHTML || '';
    }

    if (this.establishedText) {
      this.establishedText.content = tmpContent.replace(/images\//g, 'assets/images/').replace(/\.png/g, '.svg');
    }
  }

  getIntroduction(id: string, lang: string) {
    this.textService.getIntroduction(id, lang).subscribe(
      res => {
        // in order to get id attributes for tooltips
        // console.log('recieved introduction,..,', res.content);
        if (this.establishedText) {
          this.establishedText.content = this.sanitizer.bypassSecurityTrustHtml(
            res.content.replace(/images\//g, 'assets/images/')
              .replace(/\.png/g, '.svg')
          );
        }
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
        const text = this.tooltipService.constructPersonTooltipText(tooltip, targetElem);
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
        let text = '<b>' + tooltip.name.trim() + '</b>';
        if (tooltip.description) {
          text = text + ', ' + tooltip.description.trim();
        }
        this.setToolTipPosition(targetElem, text);
        this.setToolTipText(text);
        this.tooltips.places[id] = text;
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
      if (targetElem.nextElementSibling.firstElementChild.lastChild?.nodeName === 'SCRIPT') {
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
      const footNoteHTML: string | null = this.sanitizer.sanitize(SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

      if (footNoteHTML) {
        this.setToolTipPosition(targetElem, footNoteHTML);
        this.setToolTipText(footNoteHTML);
      }
      if (this.userSettingsService.isDesktop()) {
        this.tooltips.footnotes[id] = footNoteHTML;
      }
    }
  }

  showVariantFootnoteTooltip(id: string, targetElem: HTMLElement) {
    const footNoteHTML: string | null = this.getVariantFootnoteText(id, targetElem);
    if (footNoteHTML) {
      this.setToolTipPosition(targetElem, footNoteHTML);
      this.setToolTipText(footNoteHTML);
    }
  }

  showManuscriptFootnoteTooltip(id: string, targetElem: HTMLElement) {
    const footNoteHTML: string | null = this.getManuscriptFootnoteText(id, targetElem);
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
      if (triggerElem.nextElementSibling.firstElementChild.lastChild?.nodeName === 'SCRIPT') {
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
        const footNoteHTML: string | null = this.sanitizer.sanitize(SecurityContext.HTML,
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
      if (triggerElem.nextElementSibling.firstElementChild.lastChild?.nodeName === 'SCRIPT') {
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
        const footNoteHTML: string | null = this.sanitizer.sanitize(SecurityContext.HTML,
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

    id = this.establishedText?.link + ';' + id;
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
      if (targetElem.nextElementSibling.textContent) {
        this.setToolTipPosition(targetElem, targetElem.nextElementSibling.textContent);
        this.setToolTipText(targetElem.nextElementSibling.textContent);
      }
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
      if (targetElem.nextElementSibling.firstElementChild.lastChild?.nodeName === 'SCRIPT') {
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

    const footNoteHTML: string | null = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    this.setInfoOverlayPositionAndWidth(targetElem);
    if (footNoteHTML) {
      this.setInfoOverlayText(footNoteHTML);
    }
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
    const footNoteHTML: string | null = this.getManuscriptFootnoteText(id, targetElem);
    this.setInfoOverlayPositionAndWidth(targetElem);
    if (footNoteHTML) {
      this.setInfoOverlayText(footNoteHTML);
    }
  }

  showVariantFootnoteInfoOverlay(id: string, targetElem: HTMLElement) {
    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    const footNoteHTML: string | null = this.getVariantFootnoteText(id, targetElem);
    this.setInfoOverlayPositionAndWidth(targetElem);
    if (footNoteHTML) {
      this.setInfoOverlayText(footNoteHTML);
    }
  }

  showCommentInfoOverlay(id: string, targetElem: HTMLElement) {
    if (this.tooltips.comments[id as keyof typeof this.tooltips.comments]) {
      this.translate.get('Occurrences.Commentary').subscribe(
        translation => {
          this.setInfoOverlayTitle(translation);
        }, errorA => { }
      );
      this.setInfoOverlayPositionAndWidth(targetElem);
      this.setInfoOverlayText(this.tooltips.comments[id as keyof typeof this.tooltips.comments]);
      return;
    }

    id = this.establishedText?.link + ';' + id;
    this.tooltipService.getCommentTooltip(id).subscribe(
      (tooltip) => {
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
        lemma = targetElem.textContent || '';
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
    const ttProperties = this.tooltipService.getTooltipProperties(targetElem, ttText, 'page-read');

    if (ttProperties !== undefined && ttProperties !== null) {
      // Set tooltip width, position and visibility
      this.toolTipMaxWidth = ttProperties.maxWidth;
      this.toolTipScaleValue = ttProperties.scaleValue;
      this.toolTipPosition = {
        top: ttProperties.top,
        left: ttProperties.left
      };
      this.toolTipPosType = 'absolute';
      if (!this.userSettingsService.isDesktop()) {
        this.toolTipPosType = 'fixed';
      }
      this.tooltipVisible = true;
    }
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
    const contentElem = document.querySelector('page-read:not([hidden]) > ion-content > .scroll-content') as HTMLElement;
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

  async showCommentModal(id: string) {
    id = id.replace('end', 'en');
    id = this.establishedText?.link + ';' + id;
    const modal = await this.modalCtrl.create({
      component: CommentModalPage,
      componentProps: { id: id, title: this.texts.CommentsFor + ' ' + this.establishedText?.title },
      showBackdrop: true
    });
    modal.present();
  }

  async showPersonModal(id: string) {
    const modal = await this.modalCtrl.create({
      component: OccurrencesPage,
      componentProps: { id: id, type: 'subject' }
    });
    modal.present();
  }

  async showPlaceModal(id: string) {
    const modal = await this.modalCtrl.create({
      component: OccurrencesPage,
      componentProps: { id: id, type: 'location' }
    });
    modal.present();
  }

  async showWorkModal(id: string) {
    const modal = await this.modalCtrl.create({
      component: OccurrencesPage,
      componentProps: { id: id, type: 'work' }
    });
    modal.present();
  }

  async showPopover(myEvent: any) {
    const popover = await this.popoverCtrl.create({
      component: ReadPopoverPage,
      cssClass: 'popover_settings'
    });
    popover.present(myEvent);
  }

  async showSharePopover(myEvent: any) {
    const popover = await this.popoverCtrl.create({
      component: SharePopoverPage,
      cssClass: 'share-popover'
    })
    popover.present(myEvent);
  }

  public async showReference() {
    // Get URL of Page and then the URI
    const modal = await this.modalCtrl.create({
      component: DownloadTextsModalPage,
      componentProps: { id: document.URL, type: 'reference', origin: 'page-read' }
    })
    modal.present();
  }

  public async showDownloadModal() {
    const modal = await this.modalCtrl.create({
      component: DownloadTextsModalPage,
      componentProps: { textId: this.establishedText?.link, origin: 'page-read' }
    })
    modal.present();
  }

  async presentDownloadActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Ladda ner digital version',
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
    this.addView(view, id, undefined, true);
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

  addView(type: string, id?: string | null, fab?: IonFab | null, external?: boolean | null, image?: any | null, language?: string | null, variationSortOrder?: number) {
    if (fab !== undefined) {
      try {
        fab?.close();
      } catch (e) {

      }
    }
    if (external === true) {
      this.external = id ? id : undefined;
    } else {
      this.external = undefined;
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
      } as any
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
      const item: any = myArray[i];
      if (item['variation'].show === true) {
        return true;
      }
    }
    return false;
  }

  removeSlide(i: any) {
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
  moveViewRight(id: number, fab?: IonFab) {
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
  moveViewLeft(id: number, fab?: IonFab) {
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

  swipePrevNext(myEvent: any) {
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
      this.legacyId = this.paramCollectionID + '_' + this.paramPublicationID;
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
    return;
  }

  async next(test?: boolean) {
    if (this.legacyId === undefined) {
      this.legacyId = this.paramCollectionID + '_' + this.paramPublicationID;
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
    return;
  }

  findTocItem(toc: any, type?: string) {
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

  open(item: any) {
    const params = { tocItem: JSON.stringify(item), collection: JSON.stringify({ title: item.itemId }) } as any;
    this.storage.set('currentTOCItem', item);

    params['tocLinkId'] = item.itemId;
    const parts = item.itemId.split('_');
    // params['collectionID'] = parts[0];
    // params['publicationID'] = parts[1];

    // if (this.recentlyOpenViews !== undefined && this.recentlyOpenViews.length > 0) {
    //   params['recentlyOpenViews'] = this.recentlyOpenViews;
    // }

    console.log('Opening read from ReadPage.open()');
    this.router.navigate([`/publication/${parts[0]}/text/${parts[1]}/`], { queryParams: params })
  }

  private scrollToVariant(element: HTMLElement) {
    this.hideToolTip();
    try {
      if (element['classList'].contains('variantScrollTarget')) {
        const variantContElems: NodeListOf<HTMLElement> = document.querySelectorAll('page-read:not([hidden]) variations');
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
                this.commonFunctions.scrollElementIntoView(elems[i]);
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
        const elems: NodeListOf<HTMLElement> = document.querySelectorAll('page-read:not([hidden]) .teiVariant.anchorScrollTarget');
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
                this.commonFunctions.scrollElementIntoView(elems[i]);
              }
            }
          }
        }
      }
    } catch (e) {
    }
  }

  keyPress(event: any) {
    console.log(event);
  }

  moveLeft() {
    this.ds.moveLeft();
  }

  moveRight() {
    this.ds.moveRight();
  }

  nextFacs() {
    this.events.publishNextFacsimile();
  }

  prevFacs() {
    this.events.publishPreviousFacsimile();
  }

  zoomFacs() {
    this.events.publishZoomFacsimile();
  }

  findItem(id: string, includePrevNext?: boolean): any {
    let prev: any;
    const returnData = { item: TableOfContentsItem, next: TableOfContentsItem, prev: TableOfContentsItem };

    let found = false;
    let cat, child, item;

    if (this.tocRoot) {
      for (cat of this.tocRoot) {
        if (cat.items) {
          for (child of cat.items) {
            for (item of child.items) {
              item = item as any;
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

        const params = {tocItem: JSON.stringify(firstItemOfCollection), collection: JSON.stringify({title: firstItemOfCollection.itemId})} as any;

        params['tocLinkId'] = firstItemOfCollection.itemId;
        const parts = firstItemOfCollection.itemId.split('_');
        // params['collectionID'] = parts[0];
        // params['publicationID'] = parts[1];

        console.log('Opening read from ReadPage.firstPage()');
        // nav[0].setRoot('read', params);
        this.router.navigate([`/publication/${parts[0]}/text/${parts[1]}/`], { queryParams: params });
      }
    }).catch(err => console.error(err));
  }

  private scrollColumnIntoView(columnElement: HTMLElement, offset = 26) {
    if (columnElement === undefined || columnElement === null) {
      return;
    }
    const scrollingContainer = document.querySelector('page-read:not([hidden]) > ion-content > div.scroll-content');
    if (scrollingContainer !== null) {
      const x = columnElement.getBoundingClientRect().left + scrollingContainer.scrollLeft -
      scrollingContainer.getBoundingClientRect().left - offset;
      scrollingContainer.scrollTo({top: 0, left: x, behavior: 'smooth'});
    }
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-read-content';
    } else {
      return '';
    }
  }

  setCollectionAndPublicationLegacyId() {
    this.textService.getLegacyIdByPublicationId(this.paramPublicationID).subscribe(
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
    const columnElem = document.querySelector('page-read:not([hidden]) div#read_div_' + columnIndex);
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
    const currentColumnElem = document.querySelector('page-read:not([hidden]) div#read_div_' + currentColumnIndex);
    const otherColumnElem = document.querySelector('page-read:not([hidden]) div#read_div_' + otherColumnIndex);
    if (currentColumnElem && otherColumnElem) {
      const currentVarElem = currentColumnElem.querySelector('variations');
      const otherVarElem = otherColumnElem.querySelector('variations');
      if (currentVarElem && otherVarElem) {
        /* Find the indices of the two variations column among just the variations columns */
        const currentVarIndex = this.findVariationsColumnIndex(currentColumnIndex);
        let otherVarIndex = (currentVarIndex || 0) + 1;
        if (otherColumnIndex < currentColumnIndex) {
          otherVarIndex = (currentVarIndex || 0) - 1;
        }
        this.textService.variationsOrder = this.moveArrayItem(this.textService.variationsOrder, (currentVarIndex || 0), otherVarIndex);
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
    const columnElems = Array.from(document.querySelectorAll('page-read:not([hidden]) div.read-column'));
    const varColIds = [] as any;
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
    const pageReadElem = document.querySelector('page-read:not([hidden]) > ion-content > div.scroll-content');
    if (pageReadElem) {
      this.backdropWidth = pageReadElem.scrollWidth;
    }
  }

  scrollReadTextToAnchorPosition(posId: string) {
    const container = document.querySelectorAll('page-read:not([hidden]) read-text')[0];
    if (container) {
      const targets = container.querySelectorAll('a[name="' + posId + '"].anchor');
      if (targets && targets.length > 0) {
        let target = targets[0] as HTMLAnchorElement;
        if ( target && ((target.parentElement && target.parentElement.classList.contains('ttFixed'))
        || (target.parentElement?.parentElement && target.parentElement.parentElement.classList.contains('ttFixed'))) ) {
          // Position in footnote --> look for second target
          if (targets.length > 1) {
            target = targets[1] as HTMLAnchorElement;
          }
        }
        if (target) {
          if (!this.userSettingsService.isMobile()) {
            let columnElement = container as HTMLElement;
            while (columnElement.parentElement !== null && !columnElement.parentElement.classList.contains('read-column')) {
              columnElement = columnElement.parentElement;
            }
            this.scrollColumnIntoView(columnElement);
          }
          this.commonFunctions.scrollToHTMLElement(target);
        }
      }
    }
  }

  /*
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
  */

}
