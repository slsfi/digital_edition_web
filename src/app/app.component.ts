import { Component, ViewChild, Pipe, PipeTransform, ChangeDetectionStrategy,
  ViewEncapsulation, ChangeDetectorRef, Renderer2, NgZone } from '@angular/core';
import './rxjs-operators';
import { Nav, Platform, MenuController, IonicPage, Events, App, NavParams, AlertController } from 'ionic-angular';
import { LangChangeEvent, TranslateService/*, TranslatePipe*/ } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';

import { ConfigService } from '@ngx-config/core';

import { Title } from '@angular/platform-browser';
import { LanguageService } from './services/languages/language.service';
import { MdContentService } from './services/md/md-content.service';
import { StaticPage } from './models/static-pages.model';
import { UserSettingsService } from './services/settings/user-settings.service';
import { GenericSettingsService } from './services/settings/generic-settings.service';
import { SplashScreen } from '@ionic-native/splash-screen';
import { DigitalEditionListService } from './services/toc/digital-edition-list.service';
import { ThrowStmt } from '@angular/compiler';
import { MenuOptionModel } from './models/menu-option.model';
import { HomePage } from '../pages/home/home';
import { ArrayObservable } from 'rxjs/observable/ArrayObservable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { SideMenuSettings } from './models/side-menu-settings';
import { TocAccordionMenuOptionModel } from './models/toc-accordion-menu-option.model';
import { TableOfContentsService } from './services/toc/table-of-contents.service';
import { DigitalEdition } from './models/digital-edition.model';
import { GeneralTocItem } from './models/table-of-contents.model';
import { TutorialService } from './services/tutorial/tutorial.service';
import { TableOfContentsAccordionComponent } from '../components/table-of-contents-accordion/table-of-contents-accordion';
import { GalleryService } from './services/gallery/gallery.service';
import { MetadataService } from './services/metadata/metadata.service';

@Component({
  templateUrl: `app.html`,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  // encapsulation: ViewEncapsulation.None
})

export class DigitalEditionsApp {
  @ViewChild(Nav) nav: Nav;
  @ViewChild('aboutMenuMarkdownAccordion') aboutMenuMarkdownAccordion: TableOfContentsAccordionComponent

  rootPage = 'HomePage';
  aboutPages: any[];
  language = 'sv';
  languages = [];
  appName: string;
  enableLanguageChanges: false;
  errorMessage: string;
  collectionsAccordionOpen = false;
  splitPane = false;
  collectionsList: any[];
  collectionsListWithTOC: any[];
  tocData: any;
  pdfCollections: any[];
  currentContentName: string;
  showBackButton = true;
  readMenuOpen = false;
  galleryMenuOpen = false; // legacy
  personSearchTypes = [];
  apiEndPoint: string;
  projectMachineName: string;
  staticPagesMenus = [];
  staticPagesMenusInTOC = [];
  collectionsWithoutTOC: Array<Number> = [];
  menuConditionals = {
    songTypesMenuOpen: false
  }
  tocLoaded = false;
  collectionDownloads: Array<String>;

  currentCollectionId = '';
  currentCollectionName = '';
  currentCollection: any;
  currentMarkdownId = null;
  openCollectionFromToc = false;

  pageFirstLoad = true;

  accordionTOC = false;
  accordionMusic = false;

  storageCollections = {};

  defaultSelectedItem: String = 'title';

  collectionSortOrder: any;

  browserWarning: string;
  browserWarningInfo: string;
  browserWarningClose: string;

  songTypesMenuMarkdownInfo: any;
  aboutMenuMarkdownInfo: any;

  songTypesMenuMarkdown = false;
  aboutMenuMarkdown = false;

  currentAccordionMenu = null;

  songTypesMarkdownName = 'songTypesMarkdown';
  songTypesMarkdownId = 'songTypesMarkdown';
  songtypesId = 'songtypes';
  songtypesName = 'songtypes';

  aboutMarkdownId = 'aboutMarkdown';
  aboutMarkdownName = 'About';

  sideMenuMobile = false;
  splitPaneMobile = false;

  splitPaneOpen = false;
  previousSplitPaneOpenState = true;
  splitPanePossible = true;
  previousSplitPanePossibleState = true;

  pagesThatShallShow = {
    tocMenu: ['FeaturedFacsimilePage'],
    tableOfContentsMenu: ['SingleEditionPage', 'CoverPage', 'TitlePage', 'ForewordPage', 'IntroductionPage'],
    aboutMenu: ['AboutPage'],
    contentMenu: ['HomePage', 'EditionsPage', 'ContentPage', 'MusicPage', 'FeaturedFacsimilePage', 'ElasticSearchPage']
  }

  pagesWithoutMenu = [];
  pagesWithClosedMenu = ['HomePage'];

  public options: Array<TocAccordionMenuOptionModel>;
  public songTypesOptions: {
    toc: Array<TocAccordionMenuOptionModel>
  };

  mediaCollectionOptions: any;
  songTypesOptionsMarkdown = {
    toc: []
  };
  aboutOptionsMarkdown = {
    toc: []
  };

  public sideMenuSettings: SideMenuSettings = {
    accordionMode: true,
    showSelectedOption: true,
    selectedOptionClass: 'selected-toc-item',
    subOptionIndentation: {
      md: '56px',
      ios: '64px',
      wp: '56px'
    }
  };

  simpleAccordionsExpanded = {
    musicAccordion: false,
    songTypesAccordion: false,
    galleryAccordion: false,
    collectionsAccordion: [false],
    aboutMenuAccordion: false,
    pdfAccordion: false,
    epubs: false
  }

  musicAccordion = {
    personSearchTypes: {
      show: false,
      selected: false
    },
    tagSearch: {
      show: false,
      selected: false
    },
    placeSearch: {
      show: false,
      selected: false
    },
    musicianSearch: {
      selected: false
    },
    music: {
      show: false,
      selected: false
    },
    writerSearch: {
      selected: false
    },
    playmanTraditionPage: {
      show: false,
      selected: false
    }
  }
  showBooks = false;
  hasCover = false;
  hasTitle = false;
  hasForeword = false;
  hasIntro = false;
  tocItems: GeneralTocItem[];

  availableEpubs: any[];
  epubNames: any[];

  galleryInReadMenu = true;
  splitReadCollections: any[];

  tocPersonSearchSelected = false;
  tocPlaceSearchSelected = false;
  tocTagSearchSelected = false;
  tocWorkSearchSelected = false;
  tocHomeSelected = false;

  constructor(
    private platform: Platform,
    public translate: TranslateService,
    public storage: Storage,
    public languageService: LanguageService,
    private config: ConfigService,
    private menu: MenuController,
    public events: Events,
    public mdcontentService: MdContentService,
    private userSettingsService: UserSettingsService,
    public app: App,
    public genericSettingsService: GenericSettingsService,
    public titleService: Title,
    private splashScreen: SplashScreen,
    public digitalEditionListService: DigitalEditionListService,
    protected tableOfContentsService: TableOfContentsService,
    public cdRef: ChangeDetectorRef,
    private alertCtrl: AlertController,
    private tutorial: TutorialService,
    private galleryService: GalleryService,
    private metadataService: MetadataService,
    private ngZone: NgZone
  ) {

    // Check for IE11
    if (this.platform.userAgent().match('WOW64; Trident/7.0') !== null) {
      this.translate.get('BrowserWarning').subscribe(
        BrowserWarning => {
          this.browserWarning = BrowserWarning;
          this.translate.get('BrowserWarningInfo').subscribe(
            BrowserWarningInfo => {
              this.browserWarningInfo = BrowserWarningInfo;
              this.translate.get('BrowserWarningClose').subscribe(
                BrowserWarningClose => {
                  this.browserWarningClose = BrowserWarningClose;
                  this.presentAlert();
                }, error => { }
              );
            }, error => { }
          );
        }, error => { }
      );
    }

    this.mediaCollectionOptions = {};

    this.aboutPages = [];
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.collectionDownloads = this.config.getSettings('collectionDownloads');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.showBooks = this.genericSettingsService.show('TOC.Books');
    } catch (e) {
      this.showBooks = false;
    }

    try {
      this.splitReadCollections = this.genericSettingsService.show('TOC.splitReadCollections');
      if ( this.splitReadCollections === null || this.splitReadCollections.length <= 0 ) {
        this.splitReadCollections = [''];
      }
    } catch (e) {
      this.splitReadCollections = [''];
    }

    try {
      this.collectionSortOrder = this.config.getSettings('app.CollectionSortOrder');
    } catch (e) {
      this.collectionSortOrder = undefined;
    }
    this.sideMenuMobileConfig();
    this.songTypesMenuMarkdownConfig();
    this.aboutMenuMarkdownConfig();
    try {
      this.accordionTOC = this.config.getSettings('AccordionTOC');
    } catch (e) {
      this.accordionTOC = false;
    }

    try {
      this.openCollectionFromToc = this.config.getSettings('OpenCollectionFromToc');
    } catch (e) {
      this.openCollectionFromToc = false;
    }

    try {
      this.galleryInReadMenu = this.config.getSettings('ImageGallery.ShowInReadMenu');
    } catch (e) {
      this.galleryInReadMenu = true;
    }

    try {
      this.accordionMusic = this.config.getSettings('AccordionMusic');
    } catch (e) {
      this.accordionMusic = false;
    }

    try {
      this.hasCover = this.config.getSettings('HasCover');
    } catch (e) {
      this.hasCover = false;
    }
    try {
      this.hasTitle = this.config.getSettings('HasTitle');
    } catch (e) {
      this.hasTitle = false;
    }
    try {
      this.hasForeword = this.config.getSettings('HasForeword');
    } catch (e) {
      this.hasForeword = false;
    }
    try {
      this.hasIntro = this.config.getSettings('HasIntro');
    } catch (e) {
      this.hasIntro = false;
    }

    try {
      this.availableEpubs = this.config.getSettings('AvailableEpubs');
      this.epubNames = Object.keys(this.availableEpubs);
    } catch (e) {
      this.availableEpubs = [];
      this.epubNames = [];
    }
    this.unSelectAllEpubsInToc();

    try {
      this.defaultSelectedItem = this.config.getSettings('defaultSelectedItem');
    } catch (e) {
      this.defaultSelectedItem = 'title';
    }

    this.getCollectionsWithoutTOC();
    this.initializeApp();
    this.registerEventListeners();
    this.getCollectionList();
    // If we have MediaCollections we need to add these first
    if (this.genericSettingsService.show('TOC.MediaCollections')) {
      this.getMediaCollections().then((mediaCollectionMenu) => {
        if (mediaCollectionMenu && mediaCollectionMenu.length > 0) {
          mediaCollectionMenu.sort(function (a, b) {
            if (a['title'] < b['title']) { return -1; }
            if (a['title'] > b['title']) { return 1; }
            return 0;
          });

          let t_all = 'Alla';
          this.translate.get('TOC.All').subscribe(
            translation => {
              t_all = translation;
            }, error => { }
          );
          mediaCollectionMenu.unshift({ 'id': 'all', 'title': t_all, 'highlight': true });
          mediaCollectionMenu.forEach(item => {
            item['is_gallery'] = true;
          });
          this.mediaCollectionOptions.toc_exists = true;
          this.mediaCollectionOptions.expanded = false;
          this.mediaCollectionOptions.loading = false;
          this.mediaCollectionOptions.accordionToc = {
            toc: mediaCollectionMenu,
            searchTocItem: true,
            searchTitle: '', // If toc item has to be searched by unique title also
            currentPublicationId: null
          };
          this.mediaCollectionOptions.has_children_pdfs = false;
          this.mediaCollectionOptions.isDownload = false;
          this.mediaCollectionOptions.highlight = false;
          this.mediaCollectionOptions.title = 'media';
          this.mediaCollectionOptions.id = 'mediaCollections';
          this.mediaCollectionOptions.collectionId = 'mediaCollections';
        } else {
          this.mediaCollectionOptions = {};
        }
        this.digitalEditionListService.getDigitalEditionsPromise().then((data) => {
          this.getCollectionsWithTOC(data, this.mediaCollectionOptions);
        })
      });
    } else {
      this.digitalEditionListService.getDigitalEditionsPromise().then((data) => {
        this.getCollectionsWithTOC(data);
      })
    }
    this.setMusicAccordionItems();
    this.setDefaultOpenAccordions();
  }

  presentAlert() {
    const alert = this.alertCtrl.create({
      title: this.browserWarning,
      subTitle: this.browserWarningInfo,
      buttons: [this.browserWarningClose]
    });
    alert.present();
  }

  songTypesMenuMarkdownConfig() {
    try {
      this.songTypesMenuMarkdown = this.config.getSettings('SongTypesMenuMarkdown');
    } catch (e) {
      this.songTypesMenuMarkdown = false;
    }
  }

  aboutMenuMarkdownConfig() {
    try {
      this.aboutMenuMarkdown = this.config.getSettings('AboutMenuAccordion');
    } catch (e) {
      this.aboutMenuMarkdown = false;
    }
  }

  sideMenuMobileConfig() {
    try {
      this.sideMenuMobile = this.config.getSettings('SidemenuMobile');
    } catch (e) {
      this.sideMenuMobile = false;
    }
  }

  getCollectionsWithoutTOC() {
    try {
      this.collectionsWithoutTOC = this.config.getSettings('CollectionsWithoutTOC');
    } catch (e) {
    }
  }

  toggleSplitPane() {
    this.splitPaneOpen ? this.hideSplitPane() : this.showSplitPane();
  }

  hideSplitPane() {
    this.splitPaneOpen = false;
  }

  showSplitPane() {
    this.splitPaneOpen = true;

    this.closeSplitPane();
  }

  closeSplitPane() {
    setTimeout(() => {
        const shadow = document.querySelector('.shadow');

        if (shadow !== null) {
            shadow.addEventListener('click', () => {
                if (this.splitPaneOpen) {
                    this.splitPaneOpen = false;
                }
            });
        }
    }, 1);
  }

  disableSplitPane() {
    this.splitPanePossible = false;
  }

  enableSplitPane() {
    this.splitPanePossible = true;
  }

  openBook(collection) {
    collection.isDownloadOnly = true;
    this.pdfCollections.forEach(element => {
      if (collection.id === element.id) {
        element.highlight = true;
      } else {
        element.highlight = false;
      }
    });
    this.openCollectionPage(collection);
  }

  toggleSingleCollectionAccordion(collection) {

    if (collection.isDownload) {
      if (collection.id in this.collectionDownloads['pdf']) {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/pdf/' +
          this.collectionDownloads['pdf'][collection.id] + '/';
        const ref = window.open(dURL, '_self', 'location=no');
      } else if (collection.id in this.collectionDownloads['epub']) {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/epub/' +
          this.collectionDownloads['epub'][collection.id] + '/';
        const ref = window.open(dURL, '_self', 'location=no');
      }
    } else {
      collection.expanded = !collection.expanded;

      // Open collection if accordion is toggled open OR has children pdfs (toggle button isn't shown in this case)
      if (collection.expanded || collection.has_children_pdfs) {
        this.openCollectionPage(collection);
      }

      if (!collection.accordionToc.toc.length) {
        collection.loading = true;
        this.tableOfContentsService.getTableOfContents(collection.id)
          .subscribe(
            tocItems => {
              if (String(tocItems.collectionId) === String(collection.id)) {
                collection.accordionToc.toc = tocItems.children;
                collection.loading = false;
              }
            },
            error => {
              this.errorMessage = <any>error;
              collection.loading = false;
            });
      }
    }
  }

  openCollectionPage(collection) {
    this.currentContentName = collection.title;
    const params = { collection: collection, fetch: false, id: collection.id };
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('single-edition', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  getCollectionsWithTOC(collections, media?) {
      if (this.genericSettingsService.show('TOC.MediaCollections') && this.galleryInReadMenu) {
        collections.push(media);
      }
      if (!collections || !collections.length) {
        return;
      }

      if ( this.collectionSortOrder === undefined ) {
        collections = this.sortListRoman(collections);
      } else if ( Object.keys(this.collectionSortOrder).length > 0 )  {
        collections = this.sortListDefined(collections, this.collectionSortOrder);
      }

      const collectionsTmp = [];
      const pdfCollections = [];
      collections.forEach(collection => {
        if ( collection.id !== 'mediaCollections' ) {
          if (!(this.collectionsWithoutTOC.indexOf(collection.id) !== -1)) {
            collection['toc_exists'] = true;
            collection['expanded'] = false;
            collection['loading'] = false;
            collection['accordionToc'] = {
              toc: [],
              searchTocItem: false,
              searchTitle: '', // If toc item has to be searched by unique title also
              currentPublicationId: null
            };
          } else {
            collection['toc_exists'] = false;
          }

          collection['has_children_pdfs'] = this.collectionHasChildrenPdfs(collection.id);

          if (collection.id in this.collectionDownloads['pdf']) {
            collection['isDownload'] = true;
          } else if (collection.id in this.collectionDownloads['epub']) {
            collection['isDownload'] = true;
          } else {
            collection['isDownload'] = false;
          }
          collection['highlight'] = false;
        }
        if (!collection['has_children_pdfs'] || !this.showBooks) {
          collectionsTmp.push(collection);
        } else {
          pdfCollections.push(collection);
        }
      });
      this.collectionsListWithTOC = collectionsTmp;

      if (this.showBooks) {
        this.pdfCollections = pdfCollections;
        this.pdfCollections.sort(function (a, b) {
          if (a['title'] < b['title']) { return -1; }
          if (a['title'] > b['title']) { return 1; }
          return 0;
        });
      }
  }

  collectionHasChildrenPdfs(collectionID) {
    let hasChildrenPdfs = false;
    let childrenPdfs = [];

    try {
      childrenPdfs = this.config.getSettings(`collectionChildrenPdfs.${collectionID}`);
    } catch (e) {
      hasChildrenPdfs = false;
    }

    if (childrenPdfs.length) {
      hasChildrenPdfs = true;
    }

    return hasChildrenPdfs;
  }

  sortListRoman(list) {
    for (const coll of list) {
      const romanNumeral = coll.title.split(' ')[0];
      const order = this.romanToInt(romanNumeral);
      coll['order'] = order;
    }

    list.sort((a, b) => {
      if (typeof a['order'] === 'number') {
        return (a['order'] - b['order']);
      } else {
        return ((a['order'] < b['order']) ? -1 : ((a['order'] > b['order']) ? 1 : 0));
      }
    });

    return list;
  }

  sortListDefined(list, sort) {
    for (const coll of list) {
      let order = sort[coll.id];
      // If the sort order is not defined in the config, just set a high number
      // so that it will be at the end of the list.
      if ( order === undefined ) {
        order = 9999;
      }
      coll['order'] = order;
    }

    list.sort((a, b) => {
      if (typeof a['order'] === 'number') {
        return (a['order'] - b['order']);
      } else {
        return ((a['order'] < b['order']) ? -1 : ((a['order'] > b['order']) ? 1 : 0));
      }
    });

    return list;
  }

  openMusicAccordionItem(musicAccordionItem, findInMusicAccordion?) {
    Object.keys(this.musicAccordion).forEach(key => this.musicAccordion[key].selected = false);
    if (findInMusicAccordion) {
      this.musicAccordion[musicAccordionItem].selected = true;
    } else {
      musicAccordionItem.selected = true;
    }
  }

  setMusicAccordionItems() {
    if (!this.accordionMusic) {
      return;
    }

    try {
      this.musicAccordion.personSearchTypes.show = this.config.getSettings('MusicAccordionShow.PersonSearchTypes');
      this.musicAccordion.tagSearch.show = this.config.getSettings('MusicAccordionShow.TagSearch');
      this.musicAccordion.placeSearch.show = this.config.getSettings('MusicAccordionShow.PlaceSearch');
      this.musicAccordion.music.show = this.config.getSettings('MusicAccordionShow.Music');
      this.musicAccordion.playmanTraditionPage.show = this.config.getSettings('MusicAccordionShow.PlaymanTraditionPage');
    } catch (e) {
    }
  }

  resetMusicAccordion() {
    Object.keys(this.musicAccordion).forEach(key => this.musicAccordion[key].selected = false);
  }

  setDefaultOpenAccordions() {
    if (!this.accordionTOC || !this.accordionMusic) {
      return;
    }

    try {
      this.simpleAccordionsExpanded.songTypesAccordion = this.config.getSettings('AccordionsExpandedDefault.SongTypes');
      this.simpleAccordionsExpanded.musicAccordion = this.config.getSettings('AccordionsExpandedDefault.Music');
      for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
        this.simpleAccordionsExpanded.collectionsAccordion[i] = this.config.getSettings('AccordionsExpandedDefault.Collections');
      }
    } catch (e) {
    }
  }

  getSongTypes() {
    if (this.genericSettingsService.show('TOC.SongTypes')) {
      if (this.songTypesMenuMarkdown) {
        (async () => {
          const songTypesMarkdownMenu = await this.mdcontentService.getMarkdownMenu(this.language, this.songTypesMenuMarkdownInfo.idNumber);
          this.songTypesOptionsMarkdown.toc = songTypesMarkdownMenu.children;
        }).bind(this)();
      } else {
        this.tableOfContentsService.getTableOfContents('songtypes')
          .subscribe(
            tocItems => {
              this.songTypesOptions.toc = tocItems.children;
            },
            error => { this.errorMessage = <any>error });
      }
    }
  }

  getAboutPages() {
    if (this.aboutMenuMarkdown) {
      (async () => {
        const aboutMarkdownMenu = await this.mdcontentService.getMarkdownMenu(this.language, this.aboutMenuMarkdownInfo.idNumber);
        this.aboutOptionsMarkdown.toc = aboutMarkdownMenu.children;
        if (this.aboutMenuMarkdownAccordion !== undefined) {
          this.aboutMenuMarkdownAccordion.ngOnChanges(aboutMarkdownMenu.children);
        }
        this.events.publish('aboutMarkdownTOC:loaded', this.aboutOptionsMarkdown.toc);
        this.cdRef.detectChanges();
      }).bind(this)();
    }
  }

  getCollectionTOC(collectionID) {
    console.log('Getting collection TOC in app component');
    this.tableOfContentsService.getTableOfContents(collectionID)
      .subscribe(
        tocItems => {
          return tocItems;
        },
        error => { this.errorMessage = <any>error });
  }


  initializeApp() {
    this.platform.ready().then(() => {
      const platforms = [
        'android',
        'cordova',
        'core',
        'ios',
        'ipad',
        'iphone',
        'mobile',
        'mobileweb',
        'phablet',
        'tablet',
        'windows',
      ]
      // platforms.map(p => console.log(`${p}: ${this.platform.is(p)}`));
      this.splashScreen.hide();
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.language = lang;
        this.appName = this.config.getSettings('app.name.' + lang);
        this.titleService.setTitle(this.appName);
        this.getPersonSearchTypes();
        this.getStaticPagesMenus();
        this.setRootPage();
        this.getSongTypes();
        this.getAboutPages();
      });
      this.events.publish('pdfview:open', { 'isOpen': false });
    });

    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription();
    this.metadataService.addKeywords();
  }

  resizeTOCMenu( event: MouseEvent, splitPaneItem, initialtWidth ) {
    const relativeWidth = Number(String(event.clientX).replace('px', ''));
    if ( relativeWidth > 0 ) {
      splitPaneItem.style.minWidth =  (initialtWidth + relativeWidth) + 'px';
    }
  }

  toggleMusicAccordion() {
    this.simpleAccordionsExpanded.musicAccordion = !this.simpleAccordionsExpanded.musicAccordion;
  }

  unSelectAllMusicAccordionItems() {
    Object.keys(this.musicAccordion).forEach(
      key => {
        this.musicAccordion[key].selected = false;
      }
    );
  }

  unSelectCollectionWithChildrenPdf() {
    if ( this.collectionsListWithTOC !== undefined ) {
      try {
        for (const collection of this.collectionsListWithTOC) {
          if (collection.has_children_pdfs && collection.highlight) {
            collection.highlight = false;
          }
        }
      } catch (e) {
        // handle error
      }
    }
  }

  registerEventListeners() {
    this.events.subscribe('digital-edition-list:open', (collection) => {
      console.log('listened to digital-edition-list:open');
      if (String(collection.id).endsWith('.epub')) {
        this.openPage('epub', null, collection.id);
      } else {
        this.openCollection(collection);
      }
    });
    this.events.subscribe('CollectionWithChildrenPdfs:highlight', (collectionID) => {
      if ( this.collectionsListWithTOC !== undefined && this.collectionsListWithTOC ) {
        for (const collection of this.collectionsListWithTOC) {
          if (String(collection.id) === String(collectionID)) {
            collection['highlight'] = true;
            const selectedMenu = 'collectionsWithChildrenPdfs';
            this.currentAccordionMenu = selectedMenu;
            this.events.publish('SelectedItemInMenu', {
              menuID: selectedMenu,
              component: 'app-component'
            });
            if ( this.splitReadCollections !== undefined ) {
              for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
                this.simpleAccordionsExpanded.collectionsAccordion[i] = true;
              }
            }
          } else {
            collection['highlight'] = false;
          }
        }
      }
    });

    this.events.subscribe('exitActiveCollection', () => {
      this.enableContentMenu();
      // Try to close all the expanded Collections
      try {
        // Check if we have many Read Collections, if so, minimize all
        if ( this.splitReadCollections.length > 1 ) {
          for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
            this.simpleAccordionsExpanded.collectionsAccordion[i] = false;
          }
          this.cdRef.detectChanges();
        }
      } catch ( e ) {
      }
    });

    // Unselect accordion items that doesn't belong to current menu
    this.events.subscribe('SelectedItemInMenu', (menu) => {
      // console.log('subscription to selected toc item in app.component activated', menu);
      if (menu.component === 'table-of-contents-accordion-component' || this.currentAccordionMenu !== menu.menuID) {
        this.unSelectAllMusicAccordionItems();
        this.unSelectCollectionWithChildrenPdf();
        this.tocHomeSelected = false;
        this.tocPersonSearchSelected = false;
        this.tocPlaceSearchSelected = false;
        this.tocTagSearchSelected = false;
        this.tocWorkSearchSelected = false;
        this.unSelectAllMediaCollectionsInToc();
        this.unSelectAllEpubsInToc();
      }
      if (menu && menu.component && menu.menuID) {
        if (menu.component === 'home') {
          this.tocHomeSelected = true;
        } else if (menu.component === 'person-search') {
          this.tocPersonSearchSelected = true;
        } else if (menu.component === 'place-search') {
          this.tocPlaceSearchSelected = true;
        } else if (menu.component === 'tag-search') {
          this.tocTagSearchSelected = true;
        } else if (menu.component === 'work-search') {
          this.tocWorkSearchSelected = true;
        } else if (menu.component === 'media-collections') {
          this.selectMediaCollectionInToc('all');
          this.simpleAccordionsExpanded.galleryAccordion = true;
        } else if (menu.component === 'media-collection') {
          this.selectMediaCollectionInToc(menu.menuID);
          this.simpleAccordionsExpanded.galleryAccordion = true;
        } else if (menu.component === 'page-epub') {
          this.selectEpubInToc(menu.menuID);
          this.simpleAccordionsExpanded.epubs = true;
        }
      }
    });
    this.events.subscribe('musicAccordion:SetSelected', (data) => {
      if (!data || !this.musicAccordion) {
        return;
      }

      const musicAccordionKey = data.musicAccordionKey;
      this.openMusicAccordionItem(musicAccordionKey, true);
    });
    this.events.subscribe('musicAccordion:reset', (data) => {
      if (!data) {
        return;
      }

      this.resetMusicAccordion();
    });
    this.events.subscribe('collectionsAccordion:change', (data) => {
      if (!data) {
        return;
      }

      const expand = data.expand;

      // Check if there is a need to expand
      // Otherwise we might change smth after user clicks on accordion
      for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
        if (expand && !this.simpleAccordionsExpanded.collectionsAccordion[i]) {
          this.simpleAccordionsExpanded.collectionsAccordion[i] = true;
        } else if (!expand && this.simpleAccordionsExpanded.collectionsAccordion) {
          this.simpleAccordionsExpanded.collectionsAccordion[i] = false;
        }
      }
      this.cdRef.detectChanges();
    });
    this.events.subscribe('typesAccordion:change', (data) => {
      if (!data) {
        return;
      }

      const expand = data.expand;

      // Check if there is a need to expand
      // Otherwise we might change smth after user clicks on accordion
      if (expand && !this.simpleAccordionsExpanded.songTypesAccordion) {
        this.simpleAccordionsExpanded.songTypesAccordion = true;
      } else if (!expand && this.simpleAccordionsExpanded.songTypesAccordion) {
        this.simpleAccordionsExpanded.songTypesAccordion = false;
      }

      // If music accordion isn't open by default, we've to open it as well
      // since SongTypesAccordion is a child to MusicAccordion
      if (expand && !this.simpleAccordionsExpanded.musicAccordion) {
        this.simpleAccordionsExpanded.musicAccordion = true;
      }
    });
    this.events.subscribe('aboutAccordion:change', (data) => {
      if (!data) {
        return;
      }

      const expand = data.expand;

      if (expand && !this.simpleAccordionsExpanded.aboutMenuAccordion) {
        this.simpleAccordionsExpanded.aboutMenuAccordion = true;
      } else if (!expand && this.simpleAccordionsExpanded.aboutMenuAccordion) {
        this.simpleAccordionsExpanded.songTypesAccordion = false;
      }
    });
    this.events.subscribe('tableOfContents:loaded', (data) => {
      if (data === undefined || data.tocItems === undefined) {
        console.log('undefined toc-data listening to tableOfContents:loaded in app.component.ts', data);
      }
      this.tocData = data;
      this.tocLoaded = true;

      if (this.collectionsListWithTOC === undefined || this.collectionsListWithTOC.length < 1) {
        console.log('undefined or 0 length collectionsListWithTOC listening to tableOfContents:loaded in app.component.ts. ');
        // In the rare occasion that collections haven't had time to load we need to wait for them, otherwise the TOC will be empty
        this.ngZone.runOutsideAngular(() => {
          let iterationsLeft = 6;
          const intervalTimerId = window.setInterval(function() {
            if (iterationsLeft < 1) {
              this.ngZone.run(() => {
                this.setTocDataWhenSubscribingToTocLoadedEvent(data);
              });
              clearInterval(intervalTimerId);
            } else {
              iterationsLeft -= 1;
              if (this.collectionsListWithTOC !== undefined && this.collectionsListWithTOC.length > 0) {
                this.ngZone.run(() => {
                  this.setTocDataWhenSubscribingToTocLoadedEvent(data);
                });
                clearInterval(intervalTimerId);
              }
            }
          }.bind(this), 1000);
        });
      } else {
        this.setTocDataWhenSubscribingToTocLoadedEvent(data);
      }
    });

    this.events.subscribe('exitedTo', (page) => {
      this.setupPageSettings(page);
    });

    this.events.subscribe('ionViewWillEnter', (currentPage) => {
      this.tocLoaded = false;
      const homeUrl = document.URL.indexOf('/#/home');
      if (homeUrl >= 0) {
        this.setupPageSettings(currentPage);
      } else if ( document.URL.indexOf('/#/') > 0 ) {
        if ( this.splitPaneOpen === false && this.pageFirstLoad === true ) {
          this.showSplitPane();
          this.pageFirstLoad = false;
        }
      }
    });

    this.events.subscribe('ionViewWillLeave', (className) => {
    });

    this.events.subscribe('ionViewDidLeave', (className) => {
    });

    this.events.subscribe('topMenu:content', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });
      this.currentContentName = 'Digital Publications';
      const params = {};
      const nav = this.app.getActiveNavs();
      this.enableContentMenu();
      nav[0].setRoot('EditionsPage', params, { animate: false });
    });
    this.events.subscribe('topMenu:about', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });
      this.enableAboutMenu();
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.language = lang;

        if (this.aboutMenuMarkdown && this.aboutOptionsMarkdown.toc && this.aboutOptionsMarkdown.toc.length) {
          let firstAboutPageID = this.aboutOptionsMarkdown.toc[0].id;
          if ( this.config.getSettings('StaticPagesMenus')[0]['initialAboutPage'] !== undefined ) {
            firstAboutPageID = this.language + '-' + this.config.getSettings('StaticPagesMenus')[0]['initialAboutPage'];
          } else {
            if (this.aboutOptionsMarkdown.toc[0].type === 'folder') {
              firstAboutPageID = this.aboutOptionsMarkdown.toc[0].children[0].id;
            }
          }
          this.openStaticPage(firstAboutPageID);
        } else {

          this.enableAboutMenu();
          if ( this.config.getSettings('StaticPagesMenus')[0]['initialAboutPage'] === undefined ) {
            this.staticPagesMenus['initialAboutPage'] = this.language + '-03-01';
          } else {
            this.staticPagesMenus['initialAboutPage'] = this.language + '-' + this.config.getSettings('StaticPagesMenus')[0]['initialAboutPage'];
          }
          this.openStaticPage(this.staticPagesMenus['initialAboutPage']);
        }
      });
    });
    this.events.subscribe('topMenu:music', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });
      this.musicAccordion['music'].selected = true;

      // Open music accordion as well
      this.simpleAccordionsExpanded.musicAccordion = true;
      const params = {};
      const nav = this.app.getActiveNavs();
      nav[0].setRoot('music', params, { animate: false });
    });
    this.events.subscribe('topMenu:front', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });

      this.enableContentMenu();
      // Try to close all the expanded accordions in toc
      try {
        for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
          this.simpleAccordionsExpanded.collectionsAccordion[i] = false;
        }
        this.simpleAccordionsExpanded.aboutMenuAccordion = false;
        this.simpleAccordionsExpanded.epubs = false;
        this.simpleAccordionsExpanded.galleryAccordion = false;
        this.simpleAccordionsExpanded.musicAccordion = false;
        this.simpleAccordionsExpanded.pdfAccordion = false;
        this.simpleAccordionsExpanded.songTypesAccordion = false;
        this.cdRef.detectChanges();
      } catch ( e ) {
      }
      const params = {};
      const nav = this.app.getActiveNavs();
      nav[0].setRoot('HomePage', params, { animate: false });
    });

    this.events.subscribe('DigitalEditionList:recieveData', (data) => {
      this.collectionsList = data.digitalEditions;
      let sortCollectionsByRomanNumerals = false;
      try {
        sortCollectionsByRomanNumerals = this.config.getSettings('SortCollectionsByRomanNumerals');
      } catch (e) { }

      if (sortCollectionsByRomanNumerals) {
        this.sortCollectionsRoman();
      }
    });

    this.events.subscribe('pdfview:open', (params) => {
      this.storage.set('pdfIsOpen', Boolean(params['isOpen']));
    });

    this.events.subscribe('language-static:change', () => {
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.language = lang;
        this.getStaticPagesMenus();
        this.getAboutPages();
      });
    });

    this.events.subscribe('topMenu:elasticSearch', () => {
      const params = {};
      this.nav.push('elastic-search', params, { animate: false }).then(e => {
      });
      this.tocLoaded = true;
      // this.resetCurrentCollection();
      this.enableContentMenu();
    });
  }

  setTocDataWhenSubscribingToTocLoadedEvent(data) {
    if (data.searchTocItem && this.collectionsListWithTOC !== undefined) {
      for (const collection of this.collectionsListWithTOC) {

        if ((data.collectionID !== undefined && String(collection.id) === String(data.collectionID.id))
        || (data.collectionID !== undefined && Number(collection.id) === Number(data.collectionID))) {
          collection.expanded = true;
          for ( let i = 0; i < this.splitReadCollections.length; i++ ) {
            this.simpleAccordionsExpanded.collectionsAccordion[i] = true;
          }

          if ( data.chapterID ) {
            data.itemId = Number(data.collectionID) + '_' + Number(data.publicationID) + '_' + data.chapterID;
          }

          if ( data.itemId === undefined && data.collectionID !== undefined && data.publicationID !== undefined) {
            data.itemId = String(data.collectionID) + '_' + String(data.publicationID);
          }

          let dataPublicationID = data.publicationID;
          if (dataPublicationID) {
            dataPublicationID = Number(dataPublicationID);
          }
          let dataCollectionID = data.collectionID;
          if (dataCollectionID) {
            dataCollectionID = Number(dataCollectionID);
          }

          collection.accordionToc = {
            toc: data.tocItems.children,
            searchTocItem: true,
            searchItemId: data.itemId,
            searchPublicationId: dataPublicationID,
            searchCollectionId: dataCollectionID,
            searchTitle:  null
          }
          collection.accordionToc.toc = data.tocItems.children;
          this.currentCollection = collection;
          break;
        }
      }
    }
    if ( data.tocItems.children !== undefined ) {
      this.options = data.tocItems.children;
    } else {
      this.options = data.tocItems;
    }
    if ( data.tocItems && data.tocItems.collectionId !== undefined ) {
      this.currentCollectionId = data.tocItems.collectionId;
    } else if ( data.collectionID !== undefined ) {
      this.currentCollectionId = data.collectionID;
    }
    if ( data.tocItems.text === undefined ) {
      this.currentCollectionName = 'media';
      this.currentCollection.title = 'media';
    } else {
      this.currentCollectionName = data.tocItems.text;
    }

    this.enableTableOfContentsMenu();
  }

  resetCurrentCollection() {
    this.currentCollection = null;
    this.currentCollectionId = null;
    this.currentCollectionName = '';
    this.options = null;
  }

  mobileSplitPaneDetector() {
  }

  doFor(needle, haystack, callback) {
    for (const straw of haystack) {
      if (straw === needle) {
        callback();
      }
    }
  }

  setSplitPaneState(currentPage) {
    const p = currentPage;
    this.previousSplitPaneOpenState = this.splitPaneOpen;
    this.previousSplitPanePossibleState = this.splitPanePossible;

    if (!this.platform.is('mobile')) {
      this.showSplitPane();
      this.enableSplitPane();
    }
    this.doFor(p, this.pagesWithoutMenu, () => {
      this.hideSplitPane();
      this.disableSplitPane();
      this.splitPanePossible = false;
    });

    this.doFor(p, this.pagesWithClosedMenu, () => {
      this.hideSplitPane();
    });

    // this closes the menu after opening a page when you are on mobile
    if (this.platform.is('mobile')) {
      this.hideSplitPane();
    }
  }

  setupPageSettings(currentPage) {
    const p = currentPage;
    const pagesWith = this.pagesThatShallShow;

    this.doFor(p, pagesWith.tocMenu, () => {
      this.enableTableOfContentsMenu();
    });

    this.doFor(p, pagesWith.tableOfContentsMenu, () => {
      console.log('Enabling TOC Menu for', p, this.openCollectionFromToc);
      if (this.openCollectionFromToc) {
        this.enableTableOfContentsMenu();
      }
    });

    this.doFor(p, pagesWith.aboutMenu, () => {
      console.log('enabling about menu for ' + p);
      this.enableAboutMenu();

    });

    this.doFor(p, pagesWith.contentMenu, () => {
      console.log('enabling content menu for ' + p);
      this.enableContentMenu();
    });

    this.setSplitPaneState(p);
  }

  sortCollectionsRoman() {
    for (const coll of this.collectionsList) {
      const romanNumeral = coll.title.split(' ')[0];
      const order = this.romanToInt(romanNumeral);
      coll['order'] = order;
    }

    this.collectionsList.sort((a, b) => {
      if (typeof a['order'] === 'number') {
        return (a['order'] - b['order']);
      } else {
        return ((a['order'] < b['order']) ? -1 : ((a['order'] > b['order']) ? 1 : 0));
      }
    });
  }

  romanToInt(str1) {
    if (str1 == null) {
      return -1;
    }

    let num = this.romanCharToInt(str1.charAt(0));
    let pre;
    let curr;

    for (let i = 1; i < str1.length; i++) {
      curr = this.romanCharToInt(str1.charAt(i));
      pre = this.romanCharToInt(str1.charAt(i - 1));
      if (curr <= pre) {
        num += curr;
      } else {
        num = num - pre * 2 + curr;
      }
    }

    return num;
  }

  romanCharToInt(c) {
    switch (c) {
      case 'I': return 1;
      case 'V': return 5;
      case 'X': return 10;
      case 'L': return 50;
      case 'C': return 100;
      case 'D': return 500;
      case 'M': return 1000;
      default: return -1;
    }
  }

  getCollectionList() {
    let loadCollectionsFromAssets = false;
    try {
      loadCollectionsFromAssets = this.config.getSettings('LoadCollectionsFromAssets')
    } catch (e) {

    }

    if (loadCollectionsFromAssets) {
      this.digitalEditionListService.getCollectionsFromAssets()
        .subscribe(digitalEditions => {
          this.collectionsList = digitalEditions;
        });
    } else {
      this.digitalEditionListService.getDigitalEditions()
        .subscribe(
          digitalEditions => {
            this.collectionsList = digitalEditions;
          },
          error => { this.errorMessage = <any>error }
        );
    }
  }

  async getCollectionListAsync() {
    let loadCollectionsFromAssets = false;
    try {
      loadCollectionsFromAssets = this.config.getSettings('LoadCollectionsFromAssets')
    } catch (e) {

    }

    if (loadCollectionsFromAssets) {
      this.digitalEditionListService.getCollectionsFromAssets()
        .subscribe(digitalEditions => {
          return digitalEditions;
        });
    } else {
      this.digitalEditionListService.getDigitalEditions()
        .subscribe(
          digitalEditions => {
            return digitalEditions;
          },
          error => { this.errorMessage = <any>error }
        );
    }
  }

  menuConditional(menu) {
    return this.menuConditionals[menu];
  }

  setMenuConditionalFalse(menu) {
    this.menuConditionals[menu] = false;
  }

  spClickedBack(clickedBack: boolean, menu) {
    if (clickedBack) {
      this.setMenuConditionalFalse(menu);
    }
  }

  getPersonSearchTypes() {
    this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
  }

  getStaticPagesMenus() {
    try {
      this.staticPagesMenus = this.config.getSettings('StaticPagesMenus');
    } catch (e) {

    }
    try {
      this.staticPagesMenusInTOC = this.config.getSettings('StaticPagesMenusInTOC');
    } catch (e) {

    }

    for (const menu of this.staticPagesMenusInTOC) {
      if (menu.menuID === 'songTypesMenu') {
        this.songTypesMenuMarkdownInfo = menu;
      } else if (menu.menuID === 'aboutMenu') {
        this.aboutMenuMarkdownInfo = menu;
      }
    }
  }

  setRootPage() {
    const homeUrl = document.URL.indexOf('/#/home');
    if (homeUrl >= 0 || document.URL.indexOf('#') < 0) {
      this.rootPage = 'HomePage';
    }
  }

  disableMenu() {
    this.menu.enable(false, 'readMenu');
    this.menu.enable(false, 'aboutMenu');
    this.menu.enable(false, 'contentMenu');
    this.menu.enable(false, 'tableOfContentsMenu');
  }

  enableContentMenu() {
    this.menu.enable(true, 'contentMenu');
  }

  enableAboutMenu() {
    this.menu.enable(true, 'aboutMenu');
  }

  enableTableOfContentsMenu() {
    if (this.tocLoaded) {
      console.log('Toc is loaded');
      try {
        this.menu.enable(true, 'tableOfContentsMenu');
        if (this.platform.is('core')) {
          this.events.publish('title-logo:show', true);
        } else {
          this.events.publish('title-logo:show', false);
        }
      } catch (e) {
        console.log('error att App.enableTableOfContentsMenu');
      }
    } else {
      console.log('Toc is not loaded');
    }
    this.cdRef.detectChanges();
  }

  openPlaymanTraditionPage() {
    this.openStaticPage(this.language + '-03-03');
    this.unSelectCollectionWithChildrenPdf();
    this.currentAccordionMenu = 'musicAccordion';
    this.events.publish('SelectedItemInMenu', {
      menuID: 'musicAccordion',
      component: 'app-component'
    });
  }

  openStaticPage(id: string) {
    const params = { id: id };
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('content', params);
  }

  openPage(page, selectedMenu?, selectedFile?) {
    if (selectedMenu) {
      this.unSelectCollectionWithChildrenPdf();
      // Notify other menus to unselect selected items
      this.currentAccordionMenu = selectedMenu;
      this.events.publish('SelectedItemInMenu', {
        menuID: selectedMenu,
        component: 'app-component'
      });
    }
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    /*if ( this.platform.is('mobile') ) {
      this.events.publish('splitPaneToggle:disable');
    }*/
    try {
      const nav = this.app.getActiveNavs();
      if ( selectedFile !== undefined ) {
        nav[0].setRoot(page, {'selectedFile': selectedFile});
      } else {
        nav[0].setRoot(page);
      }
    } catch (e) {
      console.error('Error opening page');
    }
  }

  openPersonSearchPage(searchPage, selectedMenu?) {
    if (selectedMenu) {
      this.unSelectCollectionWithChildrenPdf();
      // Notify other menus to unselect selected items
      this.currentAccordionMenu = selectedMenu;
      this.events.publish('SelectedItemInMenu', {
        menuID: selectedMenu,
        component: 'app-component'
      });
    }
    if ( searchPage.object_subtype === undefined || searchPage.object_subtype === '' ) {
      searchPage.object_subtype = encodeURI('subtype');
    }
    const params = {
      type: searchPage.object_type,
      subtype: searchPage.object_subtype
    };
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('person-search', params);
  }

  openFirstPage(collection: DigitalEdition) {
    const params = { tocItem: null, fetch: false, collection: { title: collection.title } };
    params['collectionID'] = collection.id;

    /*
    try {
      params['publicationID'] = String(this.tocItems['children'][0]['itemId']).split('_')[1];
    } catch (e) {
      params['publicationID'] = '1';
    }
    */

    // Search the toc for the first item with itemId. This method is not perfect:
    // it's depth first and changes the top level branch every time a sub branch reaches
    // its end without finding an itemId. But it should be sufficient in practice.
    const tocLength = this.tocItems['children'].length;
    let currentTocTier = 0;
    let currentTocItem = this.tocItems['children'][0];
    let tocItemId = this.tocItems['children'][0]['itemId'];
    while (tocItemId === undefined) {
      if (currentTocItem['children'] !== undefined) {
        currentTocItem = currentTocItem['children'][0];
        if (currentTocItem !== undefined) {
          tocItemId = currentTocItem['itemId'];
        } else {
          tocItemId = undefined;
        }
      } else if ( (currentTocItem['children'] === undefined && currentTocTier < tocLength - 1)
      || (currentTocItem === undefined && currentTocTier < tocLength - 1) ) {
        currentTocTier = currentTocTier + 1;
        currentTocItem = this.tocItems['children'][currentTocTier];
        if (currentTocItem !== undefined) {
          tocItemId = currentTocItem['itemId'];
        } else {
          tocItemId = undefined;
        }
      } else if ( (currentTocItem === undefined && currentTocTier >= tocLength)
      || (currentTocItem['children'] === undefined && currentTocTier >= tocLength) ) {
        break;
      }
    }

    if (tocItemId !== undefined) {
      const itemIdparts = String(tocItemId).split('_');
      if (itemIdparts.length > 2) {
        params['publicationID'] = itemIdparts[1];
        params['chapterID'] = itemIdparts[2];
      } else if (itemIdparts.length > 1) {
        params['publicationID'] = itemIdparts[1];
        params['chapterID'] = 'nochapter';
      } else {
        params['publicationID'] = 'first';
      }
    } else {
      params['publicationID'] = 'first';
    }

    const nav = this.app.getActiveNavs();
    console.log('Opening read from App.openFirstPage()');
    nav[0].setRoot('read', params);
  }

  getTocRoot(collection: DigitalEdition) {
    this.tableOfContentsService.getTableOfContents(collection.id)
      .subscribe(
        tocItems => {
          this.tocItems = tocItems;
          this.openFirstPage(collection);
        },
        error => { this.errorMessage = <any>error });
  }

  openCollection(collection: any) {
    if (this.hasCover === false && this.hasTitle === false && this.hasForeword === false && this.hasIntro === false) {
      this.getTocRoot(collection);
    } else {
      const downloadOnly = this.config.getSettings('collectionDownloads.isDownloadOnly');
      if (collection.isDownload && downloadOnly) {
        if (collection.id in this.collectionDownloads['pdf']) {
          const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/pdf/' +
            this.collectionDownloads['pdf'][collection.id] + '/';
          const ref = window.open(dURL, '_self', 'location=no');
        } else if (collection.id in this.collectionDownloads['epub']) {
          const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/epub/' +
            this.collectionDownloads['epub'][collection.id] + '/';
          const ref = window.open(dURL, '_self', 'location=no');
        }
      } else {
        this.currentContentName = collection.title;
        this.collectionsListWithTOC.forEach((coll) => {
          if ( coll.id === collection.id ) {
            collection = coll;
          }
        })
        if (collection.id && !collection.isDownloadOnly) {
          // Open the collection from its initial page: cover, title, foreword, intro or first text
          this.openCollectionInitialPage(collection);
        } else {
          // Open collection in single-edition page
          const params = { collection: collection, fetch: false, id: collection.id };
          const nav = this.app.getActiveNavs();
          nav[0].setRoot('single-edition', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
        }
      }
      this.cdRef.detectChanges();
    }
    if (this.openCollectionFromToc) {
      this.currentCollection = collection;
      try {
        // if (this.options) {
          this.enableTableOfContentsMenu();
        // }
      } catch (e) {
        console.log('Error enabling enableTableOfContentsMenu');
      }
    }
    this.currentCollectionId = collection.id;
    if ( collection.id === 'mediaCollections' ) {
      collection.title = 'media';
    }
    this.cdRef.detectChanges();
  }

  openCollectionInitialPage(collection: DigitalEdition) {
    console.log('Opening collection from App.openCollectionInitialPage()');
    const nav = this.app.getActiveNavs();
    const params = { collection: collection, fetch: true, collectionID: collection.id };
    if ( this.hasCover && this.defaultSelectedItem === 'cover' ) {
      nav[0].setRoot('cover-page', params);
    } else if ( this.hasTitle && this.defaultSelectedItem === 'title' ) {
      nav[0].setRoot('title-page', params);
    } else if ( this.hasForeword && this.defaultSelectedItem === 'foreword' ) {
      nav[0].setRoot('foreword-page', params);
    } else if ( this.hasIntro && this.defaultSelectedItem === 'introduction' ) {
      nav[0].setRoot('introduction', params);
    } else if ( this.hasCover ) {
      nav[0].setRoot('cover-page', params);
    } else if ( this.hasTitle ) {
      nav[0].setRoot('title-page', params);
    } else if ( this.hasForeword ) {
      nav[0].setRoot('foreword-page', params);
    } else if ( this.hasIntro ) {
      nav[0].setRoot('introduction', params);
    }
  }

  onShowAccordion(show: boolean) {
    this.showBackButton = show;
  }

  /* Legacy code */
  openGalleries() {
    const params = { fetch: true };
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('galleries', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  /* Legacy code */
  openGalleryPage(galleryPage: string) {
    const params = { galleryPage: galleryPage, fetch: false };
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('image-gallery', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  async getMediaCollections(): Promise<any> {
    return await this.galleryService.getGalleries(this.language);
  }

  openMediaCollections() {
    this.selectMediaCollectionInToc('all');
    const params = {};
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('media-collections', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  openMediaCollection(gallery) {
    this.mediaCollectionOptions['accordionToc']['toc'].forEach(element => {
      if (gallery.id === element.id) {
        element.highlight = true;
      } else {
        element.highlight = false;
      }
    });
    const nav = this.app.getActiveNavs();
    const params = { mediaCollectionId: gallery.id, mediaTitle: this.makeTitle(gallery.image_path), fetch: false };
    nav[0].push('media-collection', params, { animate: true, direction: 'forward', animation: 'ios-transition' });
  }

  selectMediaCollectionInToc(id: string) {
    if (id && this.mediaCollectionOptions
    && this.mediaCollectionOptions['accordionToc'] && this.mediaCollectionOptions['accordionToc']['toc']) {
      this.mediaCollectionOptions['accordionToc']['toc'].forEach(element => {
        if (id === element.id) {
          element.highlight = true;
        } else {
          element.highlight = false;
        }
      });
    }
  }

  unSelectAllMediaCollectionsInToc() {
    if (this.mediaCollectionOptions
    && this.mediaCollectionOptions['accordionToc'] && this.mediaCollectionOptions['accordionToc']['toc']) {
      this.mediaCollectionOptions['accordionToc']['toc'].forEach(element => {
        element.highlight = false;
      });
    }
  }

  selectEpubInToc(filename: string) {
    if (filename && this.epubNames.length) {
      this.epubNames.forEach(name => {
        if (this.availableEpubs[name]['filename'] === filename) {
          this.availableEpubs[name]['highlight'] = true;
        } else {
          this.availableEpubs[name]['highlight'] = false;
        }
      });
    }
  }

  unSelectAllEpubsInToc() {
    if (this.epubNames.length) {
      this.epubNames.forEach(name => {
        this.availableEpubs[name]['highlight'] = false;
      });
    }
  }

  public front() {
    this.events.publish('topMenu:front');
  }

  public about() {
    const nav = this.app.getActiveNavs();
    this.events.publish('splitPaneToggle:disable');
    this.events.publish('topMenu:about');
  }

  makeTitle(foldername) {
    foldername = foldername.replace(/_/g, ' ');
    return foldername.charAt(0).toUpperCase() + foldername.substring(1);
  }

}
