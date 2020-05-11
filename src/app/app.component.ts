import { Component, ViewChild, Pipe, PipeTransform, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
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
  googleAnalyticsID: string;
  collectionDownloads: Array<String>;

  currentCollectionId = '';
  currentCollectionName = '';
  currentCollection: any;
  currentMarkdownId = null;
  openCollectionFromToc = false;

  accordionTOC = false;
  accordionMusic = false;

  storageCollections = {};



  browserWarning: string;
  browserWarningInfo: string;
  browserWarningClose: string;

  songTypesMenuMarkdownInfo: any;
  aboutMenuMarkdownInfo: any;

  songTypesMenuMarkdown = false;
  aboutMenuMarkdown = false;

  currentAccordionMenu = null;

  sideMenuMobile = false;
  splitPaneMobile = false;

  splitPaneOpen = false;
  previousSplitPaneOpenState = true;
  splitPanePossible = true;
  previousSplitPanePossibleState = true;

  pagesThatShallShow = {
    tocMenu: ['FeaturedFacsimilePage'],
    tableOfContentsMenu: ['SingleEditionPage', 'CoverPage'],
    aboutMenu: ['AboutPage'],
    contentMenu: ['HomePage', 'EditionsPage', 'ContentPage', 'MusicPage', 'FeaturedFacsimilePage']
  }

  pagesWithoutMenu = [];
  pagesWithClosedMenu = ['HomePage', 'HomePage'];

  public options: Array<TocAccordionMenuOptionModel>;
  public songTypesOptions: {
    toc: Array<TocAccordionMenuOptionModel>
  };

  mediaCollectionOptions: any[];
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
    collectionsAccordion: false,
    aboutMenuAccordion: false,
    pdfAccordion: false
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
  showBooks = false
  hasCover = true;
  tocItems: GeneralTocItem[];

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
    private galleryService: GalleryService
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

    this.mediaCollectionOptions = [];

    this.googleAnalyticsID = '';
    this.aboutPages = [];
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.googleAnalyticsID = this.config.getSettings('GoogleAnalyticsId');
    this.collectionDownloads = this.config.getSettings('collectionDownloads');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.showBooks = this.genericSettingsService.show('TOC.Books');
    } catch (e) {
      this.showBooks = false;
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

    console.log('openCollectionFromToc', this.openCollectionFromToc);

    try {
      this.accordionMusic = this.config.getSettings('AccordionMusic');
    } catch (e) {
      this.accordionMusic = false;
    }

    try {
      this.hasCover = this.config.getSettings('HasCover');
    } catch (e) {
      this.hasCover = true;
    }

    this.getCollectionsWithoutTOC();
    this.initializeApp();
    this.registerEventListeners();
    this.getCollectionList();
    this.getCollectionsWithTOC();
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

    this.nav.setRoot('single-edition', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  getCollectionsWithTOC() {
    (async () => {
      let collections = await this.digitalEditionListService.getDigitalEditionsPromise();
      if (!collections || !collections.length) {
        return;
      }

      collections = this.sortListRoman(collections);
      const collectionsTmp = [];
      const pdfCollections = [];
      collections.forEach(collection => {
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
    }).bind(this)();
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
      this.simpleAccordionsExpanded.collectionsAccordion = this.config.getSettings('AccordionsExpandedDefault.Collections');
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
      }).bind(this)();
    }
  }

  getCollectionTOC(collectionID) {
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
        if (this.genericSettingsService.show('TOC.MediaCollections')) {
          this.getMediaCollections();
        }
      });
      this.events.publish('pdfview:open', { 'isOpen': false });
    });
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

  registerEventListeners() {
    this.events.subscribe('CollectionWithChildrenPdfs:highlight', (collectionID) => {
      for (const collection of this.collectionsListWithTOC) {
        if (String(collection.id) === String(collectionID)) {
          collection['highlight'] = true;
          const selectedMenu = 'collectionsWithChildrenPdfs';
          this.currentAccordionMenu = selectedMenu;
          this.events.publish('SelectedItemInMenu', {
            menuID: selectedMenu,
            component: 'app-component'
          });
          this.simpleAccordionsExpanded.collectionsAccordion = true;
        } else {
          collection['highlight'] = false;
        }
      }
    });
    // Unselect accordion items that doesn't belong to current menu
    this.events.subscribe('SelectedItemInMenu', (menu) => {
      if (menu.component === 'table-of-contents-accordion-component' || this.currentAccordionMenu !== menu.menuID) {
        this.unSelectAllMusicAccordionItems();
        this.unSelectCollectionWithChildrenPdf();
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
      if (expand && !this.simpleAccordionsExpanded.collectionsAccordion) {
        this.simpleAccordionsExpanded.collectionsAccordion = true;
      } else if (!expand && this.simpleAccordionsExpanded.collectionsAccordion) {
        this.simpleAccordionsExpanded.collectionsAccordion = false;
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
      this.tocData = data;
      if (data.searchTocItem) {

        for (const collection of this.collectionsListWithTOC) {

          if (Number(collection.id) === Number(data.collectionID)) {
            collection.expanded = true;
            this.simpleAccordionsExpanded.collectionsAccordion = true;

            collection.accordionToc.toc = data.tocItems.children;
            collection.accordionToc = {
              toc: data.tocItems.children,
              searchTocItem: true,
              searchPublicationId: Number(data.publicationID),
              searchTitle: data.search_title ? data.search_title : null
            }

            break;
          }
        }
      }
      this.options = data.tocItems.children;
      console.log(this.options);
      this.currentCollectionId = data.tocItems.collectionId;
      this.currentCollectionName = data.tocItems.text;
    });

    this.events.subscribe('exitedTo', (page) => {
      this.setupPageSettings(page);
    });

    this.events.subscribe('ionViewWillEnter', (currentPage) => {
      const homeUrl = document.URL.indexOf('/#/home');
      if (homeUrl >= 0) {
        this.setupPageSettings(currentPage);
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
      this.nav.setRoot('EditionsPage', params, { animate: false });
    });
    this.events.subscribe('topMenu:about', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.language = lang;

        if (this.aboutMenuMarkdown && this.aboutOptionsMarkdown.toc && this.aboutOptionsMarkdown.toc.length) {
          const firstAboutPageID = this.aboutOptionsMarkdown.toc[0].id;
          this.openStaticPage(firstAboutPageID);
        } else {
          this.enableAboutMenu();
          this.openStaticPage(this.language + '-03-01');
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
      this.nav.setRoot('music', params, { animate: false });
    });
    this.events.subscribe('topMenu:front', () => {
      this.events.publish('SelectedItemInMenu', {
        menuID: 'topMenu',
        component: 'app-component'
      });

      this.openPage('HomePage');
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

    this.events.subscribe('language:change', () => {
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.language = lang;
        this.getStaticPagesMenus();
        this.getAboutPages();
        this.getMediaCollections();
      });
    });
  }

  mobileSplitPaneDetector() {
    this.events.subscribe('splitPaneToggle:disable', () => {
      if (this.userSettingsService.isMobile()) {
        this.hideSplitPane();
      }
    });
    this.events.subscribe('splitPaneToggle:enable', () => {
      if (this.userSettingsService.isMobile()) {
        this.showSplitPane();
      }
    });
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

    alert(currentPage);

    const p = currentPage;
    const pagesWith = this.pagesThatShallShow;

    this.doFor(p, pagesWith.tocMenu, () => {
      this.enableTableOfContentsMenu();
    });

    this.doFor(p, pagesWith.tableOfContentsMenu, () => {
      console.log('Enabling TOC Menu', p, this.openCollectionFromToc, pagesWith.tableOfContentsMenu);
      if (this.openCollectionFromToc) {
        this.enableTableOfContentsMenu();
      }
    });

    this.doFor(p, pagesWith.aboutMenu, () => {
      this.enableAboutMenu();

    });

    this.doFor(p, pagesWith.contentMenu, () => {
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
    this.menu.enable(true, 'tableOfContentsMenu');
    if (this.platform.is('core')) {
      this.events.publish('title-logo:show', true);
    } else {
      this.events.publish('title-logo:show', false);
    }
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
    this.nav.setRoot('content', params);
  }

  openPage(page, selectedMenu?) {
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
    this.nav.setRoot(page);
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
    const params = {
      type: searchPage.object_type,
      subtype: searchPage.object_subtype
    };

    this.nav.setRoot('person-search', params);
  }

  openFirstPage(collection: DigitalEdition) {
    const params = { tocItem: null, fetch: false, collection: { title: collection.title } };
    params['collectionID'] = collection.id
    try {
      params['publicationID'] = String(this.tocItems['children'][0]['itemId']).split('_')[1];
    } catch (e) {
      params['publicationID'] = '1';
    }

    const nav = this.app.getActiveNavs();
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

    console.log(collection, '<<-- open this...');
    if (this.hasCover === false) {
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
        const params = { collection: collection, fetch: false, id: collection.id };

        this.nav.setRoot('single-edition', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
      }
      this.cdRef.detectChanges();
    }
    if (this.openCollectionFromToc) {
      this.currentCollection = collection;
      console.log(this.options, 'options of the fn');
      this.enableTableOfContentsMenu();
    }
  }

  onShowAccordion(show: boolean) {
    this.showBackButton = show;
  }

  /* Legacy code */
  openGalleries() {
    const params = { fetch: true };
    this.nav.setRoot('galleries', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  /* Legacy code */
  openGalleryPage(galleryPage: string) {
    const params = { galleryPage: galleryPage, fetch: false };
    this.nav.setRoot('image-gallery', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  getMediaCollections() {
    if (this.mediaCollectionOptions) {
      (async () => {
        const mediaCollectionMenu: Array<object> = await this.galleryService.getGalleries(this.language);
        mediaCollectionMenu.sort(function (a, b) {
          if (a['title'] < b['title']) { return -1; }
          if (a['title'] > b['title']) { return 1; }
          return 0;
        });
        if (mediaCollectionMenu.length > 0) {
          let t_all = 'Alla';
          this.translate.get('TOC.All').subscribe(
            translation => {
              t_all = translation;
            }, error => { }
          );
          mediaCollectionMenu.unshift({ 'id': 'all', 'title': t_all });
          this.mediaCollectionOptions['toc_exists'] = true;
          this.mediaCollectionOptions['expanded'] = false;
          this.mediaCollectionOptions['loading'] = false;
          this.mediaCollectionOptions['accordionToc'] = {
            toc: mediaCollectionMenu,
            searchTocItem: false,
            searchTitle: '', // If toc item has to be searched by unique title also
            currentPublicationId: null
          };
          this.mediaCollectionOptions['has_children_pdfs'] = false;
          this.mediaCollectionOptions['isDownload'] = false;
          this.mediaCollectionOptions['highlight'] = false;
          this.mediaCollectionOptions['title'] = '';
        } else {
          this.mediaCollectionOptions = [];
        }
      }).bind(this)();
    }
  }

  openMediaCollections() {
    const params = {};
    this.nav.setRoot('media-collections', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
  }

  openMediaCollection(gallery) {
    const nav = this.app.getActiveNavs();
    const params = { mediaCollectionId: gallery.id, mediaTitle: this.makeTitle(gallery.image_path), fetch: false };
    nav[0].push('media-collection', params, { animate: true, direction: 'forward', animation: 'ios-transition' });
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
