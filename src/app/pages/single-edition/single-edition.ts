import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DigitalEdition } from 'src/app/models/digital-edition.model';
import { GeneralTocItem, TableOfContentsCategory } from 'src/app/models/table-of-contents.model';
import { Platform, PopoverController } from '@ionic/angular';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { TextService } from 'src/app/services/texts/text.service';
import { HtmlContentService } from 'src/app/services/html/html-content.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { EventsService } from 'src/app/services/events/events.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ActivatedRoute, Router } from '@angular/router';
import { global } from '../../../app/global';
import { ReadPopoverPage } from 'src/app/modals/read-popover/read-popover';

/**
 * Desktop version shows collection cover page.
 * Mobile version lists collection publications.
 * Also mobile version of collection cover page and introduction is accessed from this page.
 */

// @IonicPage({
//   name: 'single-edition',
//   segment: 'publication-toc/:id',
//   priority: 'high'
// })
@Component({
  selector: 'page-single-edition',
  templateUrl: 'single-edition.html',
  styleUrls: ['single-edition.scss']
})
export class SingleEditionPage {

  collection?: any;
  shallFetch?: boolean;
  errorMessage?: string;
  image?: string;

  appName?: string;
  subTitle?: string;
  tableOfContents?: TableOfContentsCategory[];
  tocItems?: any;
  parentItem?: GeneralTocItem;
  root?: TableOfContentsCategory[];
  items: any;
  collectionDescription: any;
  language = 'sv';
  defaultSelectedItem: string;
  description?: string;
  showPage = false;
  show?: string;
  hasCover: boolean;
  hasTitle: boolean;
  hasForeword: boolean;
  hasIntro: boolean;
  childrenPdfs = [];
  hasDigitalEditionListChildren = false;

  constructor(
    protected popoverCtrl: PopoverController,
    protected tableOfContentsService: TableOfContentsService,
    protected config: ConfigService,
    protected textService: TextService,
    protected htmlService: HtmlContentService,
    protected translate: TranslateService,
    protected langService: LanguageService,
    protected events: EventsService,
    protected sanitizer: DomSanitizer,
    protected platform: Platform,
    protected userSettingsService: UserSettingsService,
    protected mdcontentService: MdContentService,
    protected pdfService: PdfService,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.collectionDescription = { content: null };
    this.language = this.config.getSettings('i18n.locale');
    this.langService.getLanguage().subscribe((lang) => {
      this.appName = this.config.getSettings('app.name.' + lang);
      this.show = this.config.getSettings('defaults.ReadModeView');
    });

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
      this.defaultSelectedItem = this.config.getSettings('defaultSelectedItem');
    } catch (e) {
      this.defaultSelectedItem = 'cover';
    }
  }

  async ngOnInit() {
    this.route.params.subscribe(params => {
      this.collection = { id: params['id'] };

      if (this.collection !== undefined && this.collection.id !== undefined && this.collection.id !== 'mediaCollections') {
        if (this.collection.title !== undefined) {
          global.setSubtitle(this.collection.title);
        }
        this.getCollectionDescription(this.collection.id);
      }
  
      if (this.collection) {
        this.collection.title = global.getSubtitle();
      }

      const collectionImages = this.config.getSettings('editionImages');
      if ( this.collection?.id !== undefined  && this.collection.id !== 'mediaCollections' ) {
        this.image = collectionImages[this.collection.id];
        this.setCollectionTitle();
        this.events.publishTitleLogoCollectionTitle(this.subTitle);
        this.getDescriptions();
        this.childrenPdfs = this.pdfService.getCollectionChildrenPdfs(this.collection.id);
      }

      if ( this.childrenPdfs !== undefined && Array.isArray(this.childrenPdfs) && this.childrenPdfs.length) {
        this.hasDigitalEditionListChildren = true;
        this.events.publishCollectionWithChildrenPdfsHighlight(this.collection?.id);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['collection']) {
        this.collection = params['collection'];
      }

      this.parentItem = params['tocItem'];
      this.shallFetch = params['fetch'];

      if (!this.shallFetch && params['tocItem'] && params['tocItem'].items) {
        this.items = params['tocItem'].items;
        this.root = params['root'];
      }
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Single-edition');
    if (this.hasDigitalEditionListChildren && this.platform.is('mobile')) {
      this.events.publishSplitPaneToggleDisable();
    }
  }

  getDescriptions() {
    this.mdcontentService.getStaticPagesToc(this.language)
      .subscribe(
        staticToc => {
          let descriptions: any;
          try {
            if (staticToc.children[4].children !== undefined) {
              descriptions = staticToc.children[4].children;
            } else {
              descriptions = [];
            }
          } catch (e) {
            descriptions = [];
          }
          let mdFileStartingNumber = '';

          try {
            if (this.collection.id) {
              if (Number(this.collection.id) < 10) {
                mdFileStartingNumber = '0' + this.collection.id;
              } else {
                mdFileStartingNumber = this.collection.id;
              }
            }
          } catch (e) {
            mdFileStartingNumber = '01';
          }

          for (const d of descriptions) {
            if (d.basename.split('_desc')[0] === mdFileStartingNumber) {
              this.getSingleDescription(d.id);
            }
          }
        },
        err => console.error(err),
        () => console.log('get descriptions')
      );
  }

  getSingleDescription(fileId: any) {
    this.mdcontentService.getMdContent(fileId)
      .subscribe(
        description => {
          this.description = description.content;
        },
        err => console.error(err),
        () => console.log('get single description')
      );
  }

  async setCollectionTitle() {
    if ( this.collection.id !== 'mediaCollections' ) {
      await this.textService.getCollection(this.collection.id).subscribe(
        collection => {
          this.subTitle = collection[0].name;
          this.events.publishTitleLogoCollectionTitle(collection[0].name);
        },
        error => {
          console.log('could not get collection title');
        },
        () => console.log(this.subTitle)
      );
    }
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem(true);
    this.events.publishMusicAccordionReset(true);
    if (this.collection.id && !this.collection.isDownloadOnly) {
      this.getTocRoot(this.collection.id);
      
    } else {
      console.log(this.collection.id, 'perhaps maybe');
    }
    console.log('single collection ion will enter...');
    // this.events.publishPageLoadedSingleEdition({ 'title': this.subTitle });
    // this.events.publish('pageLoaded:single-edition', { 'title': this.subTitle });
  }

  getTocRoot(id: string) {
    this.tableOfContentsService.getTableOfContents(id)
      .subscribe(
        tocItems => {
          this.tocItems = tocItems;
          this.maybeLoadIntroductionPage(this.collection.id);
        },
        error => { this.errorMessage = <any>error });
  }

  getTableOfContents(id: string) {
    this.tableOfContentsService.getTableOfContents(id)
      .subscribe(
        (tableOfContents: any) => {
          this.root = tableOfContents;
          this.tableOfContents = tableOfContents;
        },
        error => { this.errorMessage = <any>error });
  }

  getCollectionDescription(id: string) {
    this.htmlService.getHtmlContent(id + '_desc')
      .subscribe(
        collectionDescription => {
          this.collectionDescription = collectionDescription;
        },
        error => { this.errorMessage = <any>error });
  }

  async showPopover(myEvent: any) {
    const popover = await this.popoverCtrl.create({
      component: ReadPopoverPage,
    });
    popover.present(myEvent);
  }

  openFirstPage() {
    const params = { tocItem: null, fetch: false, collection: { title: this.subTitle } } as any;
    params['collectionID'] = this.collection.id
    try {
      const publicationId = String(this.tocItems['children'][0]['itemId']).split('_')[1];
      console.log('Opening read from SingleEdition.openFirstPage()');
      this.router.navigate([`/publication/${this.collection.id}/${publicationId}/`], { queryParams: params});
    } catch (e) {
      this.maybeLoadIntroductionPage(params['collectionID']);
    }
  }

  maybeLoadIntroductionPage(collectionID: string) {
      const params = { collection: this.collection, fetch: true };
      if ( this.hasCover && this.defaultSelectedItem === 'cover' ) {
        this.router.navigate([`/publication-cover/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('cover-page', params);
      } else if ( this.hasTitle && this.defaultSelectedItem === 'title' ) {
        this.router.navigate([`/publication-title/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('title-page', params);
      } else if ( this.hasForeword && this.defaultSelectedItem === 'foreword' ) {
        this.router.navigate([`/publication-foreword/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('foreword-page', params);
      } else if ( this.hasIntro && this.defaultSelectedItem === 'introduction' ) {
        this.router.navigate([`/publication-introduction/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('introduction', params);
      } else if ( this.hasCover ) {
        this.router.navigate([`/publication-cover/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('cover-page', params);
      } else if ( this.hasTitle ) {
        this.router.navigate([`/publication-title/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('title-page', params);
      } else if ( this.hasForeword ) {
        this.router.navigate([`/publication-foreword/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('foreword-page', params);
      } else if ( this.hasIntro ) {
        this.router.navigate([`/publication-introduction/${this.collection.id}`], { queryParams: params });
        // nav[0].setRoot('introduction', params);
      }
  }
}
