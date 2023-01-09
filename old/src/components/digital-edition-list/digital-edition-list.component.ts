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
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

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
  hasTitle = true;
  hasForeword = true;
  hasIntro = true;
  hideBooks = false;
  hasMediaCollections = false;
  galleryInReadMenu = false;
  collectionSortOrder: any;
  showEpubsInList = false;
  availableEpubs = [];

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
    private analyticsService: AnalyticsService
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
    try {
      this.hasTitle = this.config.getSettings('HasTitle');
    } catch (e) {
      this.hasTitle = true;
    }
    try {
      this.hasForeword = this.config.getSettings('HasForeword');
    } catch (e) {
      this.hasForeword = true;
    }
    try {
      this.hasIntro = this.config.getSettings('HasIntro');
    } catch (e) {
      this.hasIntro = true;
    }
    try {
      this.collectionSortOrder = this.config.getSettings('app.CollectionSortOrder');
    } catch (e) {
      this.collectionSortOrder = undefined;
    }
    try {
      this.hasMediaCollections = this.config.getSettings('show.TOC.MediaCollections');
    } catch (e) {
      this.hasMediaCollections = false;
    }
    try {
      this.galleryInReadMenu = this.config.getSettings('ImageGallery.ShowInReadMenu');
    } catch (e) {
      this.galleryInReadMenu = false;
    }
    try {
      this.showEpubsInList = this.config.getSettings('show.epubsInDigitalEditionList');
    } catch (e) {
      this.showEpubsInList = false;
    }
    try {
      this.availableEpubs = this.config.getSettings('AvailableEpubs');
    } catch (e) {
      this.availableEpubs = [];
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
          if ( this.hasMediaCollections && this.galleryInReadMenu ) {
            const mediaColl = new DigitalEdition({id: 'mediaCollections', title: 'media'});
            this.digitalEditions.unshift(mediaColl);
          }
          let de = digitalEditions;
          this.events.publish('DigitalEditionList:recieveData', { digitalEditions });
          this.setPDF(de);
          if ( this.collectionSortOrder !== undefined && Object.keys(this.collectionSortOrder).length > 0 )  {
            de = this.sortListDefined(de, this.collectionSortOrder);
          }
          if (this.collectionsToShow !== undefined && this.collectionsToShow.length > 0) {
            this.filterCollectionsToShow(de);
          }
          if (this.showEpubsInList && Object.keys(this.availableEpubs).length > 0) {
            this.prependEpubsToDigitalEditions();
          }
        },
        error => { this.errorMessage = <any>error }
      );
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

  shortText(edition_id: string): Array<string> {
    let textData = '';
    try {
      const lang = this.translate.currentLang;
      if ( this.editionShortTexts[lang][edition_id] !== undefined ) {
        textData = this.editionShortTexts[lang][edition_id] ||
        this.editionShortTexts[lang].default;
        return textData.split('\n');
      } else {
        return String[''];
      }
    } catch (e) {
      // console.error(e);
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
    let tresh = false;
    for (let i = 0; i < de.length; i++) {
      if (i === (de.length / 2) && de.length % 2 === 0) {
        tresh = true;
      }

      if ( this.collectionDownloads['pdf'] !== undefined &&  this.collectionDownloads['pdf'][String(de[i].id)] !== undefined ) {
        if ( de[i] !== undefined ) {
          de[i]['pdf'] = {
            'url': this.collectionDownloads['pdf'][String(de[i].id)].title,
            'isDownload': (String(de[i].url).length > 0) ? true : false
          };
        }
        de[i].isDownload = (String(de[i].url).length > 0) ? true : false;
        de[i].pdfFile = this.collectionDownloads['pdf'][String(de[i].id)].title;
      }

      if ( this.collectionDownloads['epub'] !== undefined && de[i].id in this.collectionDownloads['epub'] ) {
        if ( de[i] !== undefined ) {
          de[i]['epub'] = {
            'url': this.collectionDownloads['epub'][String(de[i].id)].title,
            'isDownload': (String(de[i].url).length > 0) ? true : false
          };
        }
        de[i].isDownload = (String(de[i].url).length > 0) ? true : false;
      }

      if (tresh && de[i] !== undefined) {
        this.digitalEditionsSecondHalf.push(de[i]);
      } else if (de[i] !== undefined) {
        this.digitalEditionsFirstHalf.push(de[i]);
      }
    }
  }

  downloadBook(event: Event, collection, type) {
    event.stopPropagation();
    if (collection.isDownload) {
      if (collection.id in this.collectionDownloads['pdf'] && type === 'pdf') {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/pdf/' +
          this.collectionDownloads['pdf'][collection.id].title + '/' +
          this.collectionDownloads['pdf'][collection.id].title;
        const ref = window.open(dURL);
        this.doAnalytics('Download', 'PDF', this.collectionDownloads['pdf'][collection.id]);
      } else if (collection.id in this.collectionDownloads['epub'] && type === 'epub') {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.id + '/epub/' +
          this.collectionDownloads['epub'][collection.id].title + '/' +
          this.collectionDownloads['epub'][collection.id].title;
        const ref = window.open(dURL);
        this.doAnalytics('Download', 'EPUB', this.collectionDownloads['epub'][collection.id]);
      }
    }
  }

  doAnalytics(category, type, name) {
    this.analyticsService.doAnalyticsEvent(category, 'digital-edition-list', String(type + ' - ' + name));
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
    console.log('Opening read from DigitalEditionList.openFirstPage()');
    nav[0].setRoot('read', params);
  }

  openCollection(collection: DigitalEdition, animate = true) {
    if ( (collection.isDownload === undefined || collection.isDownload === false) ) {
      if (String(collection.id).endsWith('.epub')) {
        this.events.publish('digital-edition-list:open', collection);
      } else if (this.hasCover === false && this.hasIntro === false
      && this.hasTitle === false && this.hasForeword === false) {
        this.getTocRoot(collection);
      } else {
        this.events.publish('digital-edition-list:open', collection);
      }
    } else {
      this.openMediaCollections(collection);
    }
  }

  openMediaCollections(collection) {
    this.events.publish('openMediaCollections', {});
  }

  prependEpubsToDigitalEditions() {
    const epubNames = Object.keys(this.availableEpubs);
    const epubCollections = [];
    epubNames.forEach(name => {
      const epubFilename = this.availableEpubs[name]['filename'];
      const epubColl = new DigitalEdition({id: epubFilename, title: name});
      epubCollections.push(epubColl);
      if (this.availableEpubs[name]['cover'] !== undefined) {
        this.editionImages[epubFilename] = this.availableEpubs[name]['cover'];
      }
    });
    this.digitalEditions = epubCollections.concat(this.digitalEditions);
  }
}
