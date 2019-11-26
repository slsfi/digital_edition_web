import { Title } from '@angular/platform-browser';
import { Component, OnInit, Input } from '@angular/core';
import { App, Platform, Events } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@ngx-config/core';
import { DigitalEdition } from '../../app/models/digital-edition.model';
import { DigitalEditionListService } from '../../app/services/toc/digital-edition-list.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { GeneralTocItem } from '../../app/models/table-of-contents.model';
import { text } from '@angular/core/src/render3/instructions';

@Component({
  selector: 'digital-editions-list',
  templateUrl: `./digital-edition-list.html`
})
export class DigitalEditionList implements OnInit {
  errorMessage: string;
  digitalEditions: DigitalEdition[];
  digitalEditionsFirstHalf = [];
  digitalEditionsSecondHalf = [];
  projectMachineName: string;
  editionImages: any;
  editionShortTexts: any;
  appLanguage: any;
  grid: boolean;
  collectionDownloads: Array<String>;
  apiEndPoint: string;
  pdfsAreDownloadOnly = false;
  tocItems: GeneralTocItem[];
  hasCover = true;
  hideBooks = false;

  @Input() layoutType: string;
  @Input() collectionsToShow?: Array<any>;

  constructor(
    private app: App,
    private digitalEditionListService: DigitalEditionListService,
    private config: ConfigService,
    public translate: TranslateService,
    private platform: Platform,
    protected tableOfContentsService: TableOfContentsService,
    private events: Events,
    private userSettingsService: UserSettingsService,
  ) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint')
    this.projectMachineName = this.config.getSettings('app.machineName');
    this.editionImages = this.config.getSettings('editionImages');
    this.editionShortTexts = this.config.getSettings('editionShortTexts');
    this.appLanguage = this.config.getSettings('i18n').locale;
    this.collectionDownloads = this.config.getSettings('collectionDownloads');
    try {
      this.hasCover = this.config.getSettings('HasCover');
    } catch (e) {
      this.hasCover = true;
    }
  }

  ngOnInit() {
    if (this.platform.is('mobile')) {
      this.grid = false;
    } else {
      this.grid = true;
    }

    if (this.config.getSettings('collectionDownloads.isDownloadOnly')) {
      this.pdfsAreDownloadOnly = this.config.getSettings('collectionDownloads.isDownloadOnly');
    }

    let loadCollectionsFromAssets = false;
    try {
      loadCollectionsFromAssets = this.config.getSettings('LoadCollectionsFromAssets')
    } catch (e) {

    }

    try {
      this.hideBooks = this.config.getSettings('show.TOC.Books')
    } catch (e) {
      this.hideBooks = false;
    }

    if (loadCollectionsFromAssets) {
      this.digitalEditionListService.getCollectionsFromAssets()
        .subscribe(digitalEditions => {
          this.digitalEditions = digitalEditions;
          this.events.publish('DigitalEditionList:recieveData', { digitalEditions });
          this.setPDF(digitalEditions);
        });
    } else {
      this.getDigitalEditions();
    }
  }

  getDigitalEditions() {
    this.digitalEditionsFirstHalf = [];
    this.digitalEditionsSecondHalf = [];
    this.digitalEditionListService.getDigitalEditions()
      .subscribe(
        digitalEditions => {
          this.digitalEditions = digitalEditions;
          const de = digitalEditions;
          this.events.publish('DigitalEditionList:recieveData', { digitalEditions });
          this.setPDF(de);
          if (this.collectionsToShow !== undefined && this.collectionsToShow.length > 0) {
            this.filterCollectionsToShow(de);
          }
        },
        error => { this.errorMessage = <any>error }
      );
  }

  shortText(edition_id: string): Array<string> {
    let textData = '';
    try {
      const lang = this.translate.currentLang;
      textData = this.editionShortTexts[lang][edition_id] ||
        this.editionShortTexts[lang].default;
      return textData.split('\n');
    } catch (e) {
      console.log(e);
    }
    return textData.split('\n');
  }

  filterCollectionsToShow(collections) {
    const filtered = [];
    if (this.collectionsToShow && this.collectionsToShow.length) {
      collections.forEach((item) => {
        if (this.collectionsToShow.indexOf(item.id) !== -1) {
          filtered.push(item)
        }
      });
    }

    this.digitalEditions = filtered;
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

  setPDF(de) {
    console.log(de);
    let tresh = false;
    for (let i = 0; i < de.length; i++) {
      if (i === (de.length / 2) && de.length % 2 === 0) {
        tresh = true;
      }

      if ((this.collectionDownloads['pdf'] !== undefined && de[i].id in this.collectionDownloads['pdf']) ||
        (this.collectionDownloads['epub'] !== undefined && de[i].id in this.collectionDownloads['epub'])) {
        de[i].url = this.collectionDownloads[de[i].title];
        de[i].isDownload = (String(de[i].url).length > 0) ? true : false;
      }

      if (tresh && de[i] !== undefined) {
        this.digitalEditionsSecondHalf.push(de[i]);
      } else if (de[i] !== undefined) {
        this.digitalEditionsFirstHalf.push(de[i]);
      }
    }
  }

  downloadPDF(collection) {
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
    }
    this.doAnalytics('Download', 'PDF', this.collectionDownloads['pdf'][collection.id]);
  }

  doAnalytics(action, type, name) {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: action,
        eventLabel: 'Song',
        eventAction: type + ' - ' + name,
        eventValue: 10
      });
    } catch (e) {
    }
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

  openCollection(collection: DigitalEdition, animate = true) {
    if (!collection.isDownload) {
      if (this.hasCover === false) {
        this.getTocRoot(collection);
      } else {
        const nav = this.app.getActiveNavs();
        let params;
        params = { collection: collection, fetch: true, collectionID: collection.id };
        nav[0].setRoot('cover', params);
      }
    } else {
      this.downloadPDF(collection);
    }
  }
}
