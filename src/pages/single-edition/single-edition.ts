import { Component } from '@angular/core';
import { App, NavController, ViewController, NavParams, PopoverController, IonicPage, Events, Platform } from 'ionic-angular';

import { TableOfContentsList } from '../../app/table-of-contents/table-of-contents';
import { ConfigService } from '@ngx-config/core';
import { global } from '../../app/global';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ReadPopoverPage } from '../read-popover/read-popover';
import { DomSanitizer } from '@angular/platform-browser';
import { Storage } from '@ionic/storage';
import { TextService } from '../../app/services/texts/text.service';
import { HtmlContentService } from '../../app/services/html/html-content.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { DigitalEdition } from '../../app/models/digital-edition.model';
import { TableOfContentsCategory, GeneralTocItem } from '../../app/models/table-of-contents.model';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import leaflet from 'leaflet';
import { PdfService } from '../../app/services/pdf/pdf.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

/**
 * Desktop version shows collection cover page.
 * Mobile version lists collection publications.
 * Also mobile version of collection cover page and introduction is accessed from this page.
 */

@IonicPage({
  name: 'single-edition',
  segment: 'publication-toc/:id',
  priority: 'high'
})
@Component({
  selector: 'page-single-edition',
  templateUrl: 'single-edition.html'
})
export class SingleEditionPage {

  collection: DigitalEdition;
  shallFetch: boolean;
  errorMessage: string;
  image: string;

  appName: string;
  subTitle: string;
  tableOfContents: TableOfContentsCategory[];
  tocItems: GeneralTocItem[];
  parentItem: GeneralTocItem;
  root: TableOfContentsCategory[];
  items: any;
  collectionDescription: any;
  language = 'sv';
  defaultSelectedItem: string;
  description: string;
  showPage = false;
  show: string;
  hasCover: boolean;
  hasTitle: boolean;
  hasForeword: boolean;
  hasIntro: boolean;
  childrenPdfs = [];
  hasDigitalEditionListChildren = false;

  constructor(
    protected navCtrl: NavController,
    protected viewCtrl: ViewController,
    protected params: NavParams,
    protected popoverCtrl: PopoverController,
    protected tableOfContentsService: TableOfContentsService,
    protected config: ConfigService,
    protected textService: TextService,
    protected htmlService: HtmlContentService,
    protected translate: TranslateService,
    protected app: App,
    private storage: Storage,
    protected langService: LanguageService,
    protected events: Events,
    protected sanitizer: DomSanitizer,
    protected platform: Platform,
    protected userSettingsService: UserSettingsService,
    protected mdcontentService: MdContentService,
    protected pdfService: PdfService,
    private analyticsService: AnalyticsService
  ) {
    this.collection = this.params.get('collection') || { id: this.params.get('id') };
    this.parentItem = this.params.get('tocItem');
    this.shallFetch = this.params.get('fetch');
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

    if (this.collection !== undefined && this.collection.id !== undefined && this.collection.id !== 'mediaCollections') {
      if (this.collection.title !== undefined) {
        global.setSubtitle(this.collection.title);
      }
      this.getCollectionDescription(this.collection.id);
    }

    this.collection.title = global.getSubtitle();

    if (!this.shallFetch && this.params.data.tocItem && this.params.data.tocItem.items) {
      this.items = this.params.data.tocItem.items;
      this.root = this.params.data.root;
    }

    const collectionImages = this.config.getSettings('editionImages');
    if ( this.collection.id !== undefined  && this.collection.id !== 'mediaCollections' ) {
      this.image = collectionImages[this.collection.id];
      this.setCollectionTitle();
      this.events.publish('title-logo:collectionTitle', this.subTitle);
      this.getDescriptions();
      this.childrenPdfs = this.pdfService.getCollectionChildrenPdfs(this.collection.id);
    }

    if ( this.childrenPdfs !== undefined && Array.isArray(this.childrenPdfs) && this.childrenPdfs.length) {
      this.hasDigitalEditionListChildren = true;
      this.events.publish('CollectionWithChildrenPdfs:highlight', this.collection.id);
    }
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Single-edition');
    if (this.hasDigitalEditionListChildren && this.platform.is('mobile')) {
      this.events.publish('splitPaneToggle:disable');
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
            if (this.params !== undefined && this.params) {
              if (Number(this.params.get('id')) < 10) {
                mdFileStartingNumber = '0' + this.params.get('id');
              } else {
                mdFileStartingNumber = this.params.get('id');
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

  getSingleDescription(fileId) {
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
    if ( this.params.get('id') !== 'mediaCollections' ) {
      await this.textService.getCollection(this.params.get('id')).subscribe(
        collection => {
          this.subTitle = collection[0].name;
          this.events.publish('title-logo:collectionTitle', collection[0].name);
        },
        error => {
          console.log('could not get collection title');
        },
        () => console.log(this.subTitle)
      );
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.events.publish('musicAccordion:reset', true);
    if (this.collection.id && !this.collection.isDownloadOnly) {
      this.getTocRoot(this.collection.id);
      this.maybeLoadIntroductionPage(this.collection.id);
    } else {
      console.log(this.collection.id, 'perhaps maybe');
    }
    this.viewCtrl.setBackButtonText('');
    console.log('single collection ion will enter...');
    this.events.publish('pageLoaded:single-edition', { 'title': this.subTitle });
  }

  getTocRoot(id: string) {
    this.tocItems = this.collection['accordionToc']['toc'];
  }

  getTableOfContents(id: string) {
    this.tableOfContentsService.getTableOfContents(id)
      .subscribe(
        tableOfContents => {
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

  showPopover(myEvent) {
    const popover = this.popoverCtrl.create(ReadPopoverPage);
    popover.present({
      ev: myEvent
    });
  }

  openFirstPage() {
    const params = { tocItem: null, fetch: false, collection: { title: this.subTitle } };
    params['collectionID'] = this.params.get('id')
    try {
      params['publicationID'] = String(this.tocItems['children'][0]['itemId']).split('_')[1];
      const nav = this.app.getActiveNavs();
      console.log('Opening read from SingleEdition.openFirstPage()');
      nav[0].setRoot('read', params);
    } catch (e) {
      this.maybeLoadIntroductionPage(params['collectionID']);
    }
  }

  maybeLoadIntroductionPage(collectionID: string) {
      const nav = this.app.getActiveNavs();
      const params = { collection: this.collection, fetch: true, collectionID: this.collection.id };
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
}
