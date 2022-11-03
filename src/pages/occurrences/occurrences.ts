import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, App, Platform, ViewController, Events } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { ConfigService } from '@ngx-config/core';
import { TextService } from '../../app/services/texts/text.service';
import { TooltipService } from '../../app/services/tooltips/tooltip.service';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { Occurrence, OccurrenceType, OccurrenceResult } from '../../app/models/occurrence.model';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { TranslateService } from '@ngx-translate/core';
import leaflet from 'leaflet';
import { BootstrapOptions } from '@angular/core/src/application_ref';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { CommonFunctionsService } from '../../app/services/common-functions/common-functions.service';

/**
 * Generated class for the OccurrencesPage page.
 *
 * A modal/page for displaying occurrence results.
 * Used by pages person-search and place-search.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-occurrences',
  templateUrl: 'occurrences.html',
})
export class OccurrencesPage {
  @ViewChild('map') mapContainer: ElementRef;
  map: any;
  title: string;
  occurrenceResult: OccurrenceResult;
  texts: any[] = [];
  groupedTexts: any[] = [];
  longitude: Number = null;
  latitude: Number = null;
  city: string = null;
  region: string = null;
  occupation: string = null;
  place_of_birth: string = null;
  type: string = null;
  source: string = null;
  description: string = null;
  country: string = null;
  year_born_deceased_string: string = null;
  publisher: string = null;
  published_year: string = null;
  journal: string = null;
  isbn: string = null;
  authors: Array<Object> = [];
  filterToggle: Boolean = true;
  singleOccurrenceType: string = null;
  galleryOccurrenceData: any = [];
  hideTypeAndDescription = false;
  isLoading: Boolean = true;
  infoLoading: Boolean = true;
  showPublishedStatus: Number = 2;
  noData: Boolean = false;
  simpleWorkMetadata: Boolean;

  objectType = '';

  mediaData = {
    imageUrl: null,
    description: null
  }

  articleData: Array<Object> = [];

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              protected config: ConfigService,
              public modalCtrl: ModalController,
              private app: App,
              private platform: Platform,
              protected textService: TextService,
              private tooltipService: TooltipService,
              public translate: TranslateService,
              public occurrenceService: OccurrenceService,
              public viewCtrl: ViewController,
              private events: Events,
              private analyticsService: AnalyticsService,
              public commonFunctions: CommonFunctionsService,
  ) {
    if (this.simpleWorkMetadata === undefined) {
      try {
        this.simpleWorkMetadata = this.config.getSettings('useSimpleWorkMetadata');
      } catch (e) {
        this.simpleWorkMetadata = false;
      }
    }

    this.occurrenceResult = this.navParams.get('occurrenceResult');
    if ( this.occurrenceResult !== undefined ) {
      // console.log('Getting occurrenceResult from navParams:');
      // console.log(this.occurrenceResult);
      this.init();
    } else if ( this.navParams.get('type') && this.navParams.get('id') ) {
      // console.log('occurrenceResult not in navParams, getting object data');
      this.occurrenceResult = new OccurrenceResult();
      this.getObjectData(this.navParams.get('type'), this.navParams.get('id'));
    }
  }

  init() {
    this.groupedTexts = [];
    this.title = (this.occurrenceResult.name === undefined) ? this.occurrenceResult['full_name'] : this.occurrenceResult.name;
    this.longitude = (Number(this.occurrenceResult.longitude) !== 0 ) ? Number(this.occurrenceResult.longitude) : null;
    this.latitude = (Number(this.occurrenceResult.latitude) !== 0 ) ? Number(this.occurrenceResult.latitude) : null;
    this.city = this.occurrenceResult.city;
    this.region = this.occurrenceResult.region;
    this.occupation = this.occurrenceResult.occupation;
    this.place_of_birth = this.occurrenceResult.place_of_birth;
    this.type = this.occurrenceResult.type;
    this.source = this.occurrenceResult.source;
    this.description = this.occurrenceResult.description;
    this.country = this.occurrenceResult.country;

    this.publisher = this.occurrenceResult.publisher;
    this.published_year = this.occurrenceResult.published_year;
    this.journal = this.occurrenceResult.journal;
    this.isbn = this.occurrenceResult.isbn;
    this.authors = this.occurrenceResult.author_data;

    if ( this.authors === undefined || this.authors[0] === undefined || this.authors[0]['id'] === undefined ) {
      this.authors = [];
    }

    this.year_born_deceased_string = this.tooltipService.constructYearBornDeceasedString(this.occurrenceResult.date_born,
      this.occurrenceResult.date_deceased);

    try {
      this.singleOccurrenceType = this.config.getSettings('SingleOccurrenceType');
    } catch (e) {
      this.singleOccurrenceType = null;
    }

    try {
      this.hideTypeAndDescription = this.config.getSettings('Occurrences.HideTypeAndDescription');
    } catch (e) {
      this.hideTypeAndDescription = false;
    }

    try {
      this.showPublishedStatus = this.config.getSettings('Occurrences.ShowPublishedStatus');
    } catch (e) {
      this.showPublishedStatus = 2;
    }

    this.setObjectType();
    this.getOccurrenceTexts(this.occurrenceResult);
    this.getMediaData();
    this.getArticleData();
    this.getGalleryOccurrences();
    this.analyticsService.doAnalyticsEvent('Occurrence', this.objectType, String(this.title));
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  setObjectType() {
    if (this.navParams.get('objectType')) {
      this.objectType = this.navParams.get('objectType');
    }
  }

  getObjectData(type, id) {
    this.infoLoading = true;

    if (this.simpleWorkMetadata !== undefined && this.simpleWorkMetadata === true && type === 'work') {
      this.semanticDataService.getWork(id).subscribe(
        data => {
          this.infoLoading = false;
          this.objectType = type;
          if (data.title === undefined) {
            this.noData = true;
          } else {
            this.occurrenceResult = data;
            this.occurrenceResult.id = data.id;
            this.occurrenceResult.description = null;
            this.occurrenceResult.source = null;
            this.occurrenceResult.name = data.title;
          }
          this.init();
        },
        err => {console.error(err); this.infoLoading = false; }
      );
    } else {
      this.semanticDataService.getSingleObjectElastic(type, id).subscribe(
        data => {
          this.infoLoading = false;
          this.objectType = type;
          const personsTmp = [];
          if ( data.hits.hits.length <= 0 ) {
            this.noData = true;
          } else {
            this.occurrenceResult = data.hits.hits[0]['_source'];
          }
          if ( type === 'work' && this.noData !== true ) {
            this.occurrenceResult.id = this.occurrenceResult['man_id'];
            this.occurrenceResult.description = this.occurrenceResult['reference'];
            this.occurrenceResult.name = this.occurrenceResult['title'];
          }
          this.init();
        },
        err => {console.error(err); this.infoLoading = false; }
      );
    }
  }

  getMediaData() {
    if (!this.objectType.length || this.occurrenceResult.id === undefined) {
      return;
    }

    this.occurrenceService.getMediaData(this.objectType, this.occurrenceResult.id).subscribe(
      mediaData => {
        this.mediaData.imageUrl = mediaData.image_path;
        this.mediaData.description = mediaData.description;
      },
      error =>  console.log(error)
    );
  }

  getGalleryOccurrences() {
    if (!this.objectType.length || this.occurrenceResult.id === undefined) {
      return;
    }

    this.occurrenceService.getGalleryOccurrences(this.objectType, this.occurrenceResult.id).subscribe(
      occurrenceData => {
        this.galleryOccurrenceData = occurrenceData;
      },
      error =>  console.log(error)
    );
  }

  getArticleData() {
    if (!this.objectType.length || this.occurrenceResult.id === undefined) {
      return;
    }

    this.occurrenceService.getArticleData(this.objectType, this.occurrenceResult.id).subscribe(
      data => {
        this.articleData = data;
      },
      error =>  console.log(error)
    );
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Occurrences');
    this.loadmap();
  }

  showFilters() {
    this.filterToggle = !this.filterToggle;
  }

  isFiltersShown() {
    return this.filterToggle;
  }

  loadmap() {
    try {
      const latlng = leaflet.latLng(this.latitude, this.longitude);
      this.map = leaflet.map('map', {
          center: latlng,
          zoom: 8
      });
      leaflet.marker(latlng).addTo(this.map);
      leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attributions: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, \
        GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 18
      }).addTo(this.map);
      this.map.invalidateSize();
    } catch ( e ) {

    }
  }

  getOccurrence(occurrence: Occurrence) {
    if ( this.singleOccurrenceType === null ) {
      if (
          occurrence.publication_id &&
          !occurrence.publication_manuscript_id &&
          !occurrence.publication_comment_id &&
          !occurrence.publication_facsimile_id &&
          !occurrence.publication_version_id
        ) {
          this.setOccurrence(occurrence, 'est');
      } else {
        if (occurrence.publication_manuscript_id) {
          this.setOccurrence(occurrence, 'ms');
        }
        if (occurrence.publication_version_id) {
          this.setOccurrence(occurrence, 'var');
        }
        if (occurrence.publication_comment_id) {
          this.setOccurrence(occurrence, 'com');
        }
        if (occurrence.publication_facsimile_id) {
          this.setFacsimileOccurrence(occurrence, 'facs')
        }
        if (occurrence.type === 'song') {
          this.setOccurrence(occurrence, occurrence.type);
        }
      }
    } else if ( this.singleOccurrenceType === occurrence.type ) {
      this.setOccurrence(occurrence, occurrence.type);
    }
  }

  getOccurrenceTexts(occurrenceResult) {
    this.texts = [];
    this.groupedTexts = [];
    let occurrences: Occurrence[] = [];
    if ( occurrenceResult.occurrences !== undefined ) {
      occurrences = occurrenceResult.occurrences;
      for (const occurence of occurrences) {
        this.getOccurrence(occurence);
      }
    } else {
      if ( occurrenceResult !== undefined && occurrenceResult.id !== undefined && occurrenceResult.id ) {
        this.getOccurrences(occurrenceResult.id);
      }
    }
  }

  openText(text: any) {
    if (text.textType === 'song' && text.description) {
      this.selectSong(text.description);
      return;
    }

    const params = {};
    const nav = this.app.getActiveNavs();
    const col_id = text.collectionID.split('_')[0];
    const pub_id = text.collectionID.split('_')[1];
    let text_type: string;

    if (text.textType === 'ms') {
      text_type = 'manuscripts';
    } else if (text.textType === 'var') {
      text_type = 'variations';
    } else if (text.textType === 'facs') {
      text_type = 'facsimiles'
    } else if (text.textType === 'est') {
      text_type = 'established'
    } else {
      text_type = 'comments';
    }

    params['tocLinkId'] = text.collectionID;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    if ( text.facsimilePage ) {
      params['facsimilePage'] = text.facsimilePage;
    } else {
      params['facsimilePage'] = undefined;
    }

    params['views'] = [
      {
        type: text_type,
        id: text.linkID
      }
    ];

    params['occurrenceResult'] = this.occurrenceResult;

    if (this.navParams.get('showOccurrencesModalOnRead')) {
      params['showOccurrencesModalOnRead'] = true;
    }

    if (this.objectType) {
      params['objectType'] = this.objectType;
    }

    if (this.platform.is('mobile')) {
      this.viewCtrl.dismiss();
      this.app.getRootNav().push('read', params);
    } else {
      this.viewCtrl.dismiss();
      this.app.getRootNav().push('read', params);
    }
  }

  objectKeys(obj) {
    return Object.keys(obj);
}

  openGallery(data) {
    let type = this.objectType;
    if ( type === 'places' ) {
      type = 'location';
    } else if ( type === 'tags' ) {
      type = 'tag';
    } else if ( type === 'subjects' )  {
      type = 'subject';
    }

    const params = {
      id: data.id,
      type: type,
      mediaCollectionId: null,
      mediaTitle: ''
    };

    this.viewCtrl.dismiss();
    this.app.getRootNav().push('media-collection', params);
  }

  /**
   * If occurrence is a song, go to song page instead
   */
  selectSong(song_name) {
    const params = {
      song_number: song_name
    };

    params['occurrenceResult'] = this.occurrenceResult;
    params['objectType'] = this.objectType;

    if (this.navParams.get('showOccurrencesModalOnSong')) {
      params['showOccurrencesModalOnSong'] = true;
    }
    this.viewCtrl.dismiss();
    this.app.getRootNav().push('song', params);
  }

  setOccurrence(occurrence: Occurrence, type: string) {
    const newOccurrence = new SingleOccurrence();
    let fileName = occurrence.original_filename;

    if ( occurrence.original_filename === undefined || occurrence.original_filename === null ) {
      fileName = occurrence.collection_id + '_' + occurrence['publication_id'] + '.xml';
    }

    newOccurrence.description = occurrence.description || null;
    newOccurrence.linkID = fileName.split('.xml')[0];
    newOccurrence.filename = fileName;
    newOccurrence.textType = type;
    newOccurrence.title = occurrence.name;
    newOccurrence.collectionID = (occurrence.collection_id) ?
      occurrence.collection_id + '_' + occurrence.publication_id : newOccurrence.linkID.split('_' + type)[0];
    newOccurrence.collectionName = occurrence.collection_name;
    newOccurrence.displayName = (occurrence.publication_name !== null) ? occurrence.publication_name : occurrence.collection_name;
    this.setOccurrenceTree(newOccurrence, occurrence);

    this.texts.push(newOccurrence);
  }

  setOccurrenceTree(newOccurrence, occurrence) {
    let foundCollection = false;
    for ( let i = 0; i < this.groupedTexts.length; i++ ) {
      if ( this.groupedTexts[i].collection_id === occurrence.collection_id) {
        foundCollection = true;
        let foundPublication = false;
        for ( let j = 0; j < this.groupedTexts[i].publications.length; j++ ) {
          if ( this.groupedTexts[i].publications[j].publication_id === occurrence.publication_id) {
            this.groupedTexts[i].publications[j].occurrences.push(newOccurrence);
            foundPublication = true;
            break;
          }
        }
        if ( !foundPublication && occurrence.publication_published >= this.showPublishedStatus ) {
          const item = {publication_id: occurrence.publication_id, name: occurrence.publication_name, occurrences: [newOccurrence]};
          this.groupedTexts[i].publications.push(item);
        }
        break;
      }
    }

    if ( !foundCollection ) {
      if ( occurrence.collection_name === undefined ) {
        occurrence.collection_name = occurrence.publication_collection_name;
      }
      if ( occurrence.publication_published >= this.showPublishedStatus ) {
        const item = {collection_id: occurrence.collection_id, name: occurrence.collection_name, hidden: true,
          publications: [{publication_id: occurrence.publication_id, name: occurrence.publication_name, occurrences: [newOccurrence]}]};
        this.groupedTexts.push(item);
      }
    }
  }

  setFacsimileOccurrence(occurrence: Occurrence, type: string) {
    const newOccurrence = new SingleOccurrence();
    newOccurrence.collectionID = occurrence.collection_id + '_' + occurrence.publication_id;
    newOccurrence.textType = type;
    newOccurrence.title = occurrence.name
    newOccurrence.collectionName = occurrence.collection_name
    newOccurrence.facsimilePage = occurrence.publication_facsimile_page
    newOccurrence.displayName = (occurrence.publication_name !== null ) ? occurrence.publication_name : occurrence.collection_name;
    this.setOccurrenceTree(newOccurrence, occurrence);
    this.texts.push(newOccurrence);
  }

  getOccurrences(id) {
    this.isLoading = true;
    if ( this.objectType === 'work' ) {
      this.objectType = 'work_manifestation';
    }
    this.semanticDataService.getOccurrences(this.objectType, id).subscribe(
      occ => {
        console.log('occ: ', occ);
        this.groupedTexts = [];
        this.infoLoading = false;
        occ.forEach(item => {
          if ( item.occurrences !== undefined ) {
            for (const occurence of item.occurrences) {
              this.getOccurrence(occurence);
            }
          }
        });
        // Sort alphabetically
        this.commonFunctions.sortArrayOfObjectsAlphabetically(this.groupedTexts, 'name');
        console.log('this.groupedTexts', this.groupedTexts);
        for (let c = 0; c < this.groupedTexts.length; c++) {
          console.log('groupedTexts publications', this.groupedTexts[c]['publications']);
          this.commonFunctions.sortArrayOfObjectsAlphabetically(this.groupedTexts[c]['publications'], 'name');
        }

        this.groupedTexts.forEach(item => {
          if (item.collection_id !== undefined && item.publications !== undefined) {
            this.getPublicationTOCName(item.collection_id, item.publications);
          }
        });

        this.isLoading = false;
        this.infoLoading = false;
      },
      err => {
        this.isLoading = false;
        this.infoLoading = false;
      },
      () => console.log('Fetched tags...')
    );
  }

  getPublicationTOCName(collectionId, publicationData) {
    this.semanticDataService.getPublicationTOC(collectionId).subscribe(
      tocData => {
          this.updatePublicationNames(tocData, publicationData, collectionId);
        },
      error =>  {
      }
    );
  }

  public updatePublicationNames(tocData, publicationData, collectionId) {
    publicationData.forEach(pub => {
      const id = collectionId + '_' + pub.publication_id;
      tocData.forEach(item => {
        if (id === item['itemId']) {
          pub.occurrences[0].displayName = item['text'];
          pub.name = item['text'];
        }
      });
    });
  }

  toggleList(id) {
    for ( let i = 0; i < this.groupedTexts.length; i++ ) {
      if ( id === this.groupedTexts[i]['collection_id'] ) {
        if (this.groupedTexts[i].hidden === true) {
          this.groupedTexts[i].hidden = false;
        } else {
          this.groupedTexts[i].hidden = true;
        }
      }
    }
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

}
