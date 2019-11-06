import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, App, Platform, ViewController, Events } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { ConfigService } from '@ngx-config/core';
import { TextService } from '../../app/services/texts/text.service';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { Occurrence, OccurrenceType, OccurrenceResult } from '../../app/models/occurrence.model';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { TranslateService } from '@ngx-translate/core';
import leaflet from 'leaflet';

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
  date_born: string = null;
  date_deceased: string = null;
  filterToggle: Boolean = true;
  singleOccurrenceType: string = null;

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
              public translate: TranslateService,
              public occurrenceService: OccurrenceService,
              public viewCtrl: ViewController,
              private events: Events
  ) {
    this.occurrenceResult = navParams.get('occurrenceResult');
    this.title = this.occurrenceResult.name;
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
    this.date_born = (this.occurrenceResult.date_born !== undefined && this.occurrenceResult.date_born !== null) ?
                              String(this.occurrenceResult.date_born).split('-')[0] : null;
    this.date_deceased = (this.occurrenceResult.date_deceased !== undefined && this.occurrenceResult.date_deceased !== null) ?
                              String(this.occurrenceResult.date_deceased).split('-')[0] : null;

    try {
      this.singleOccurrenceType = this.config.getSettings('SingleOccurrenceType');
    } catch (e) {
      this.singleOccurrenceType = null;
    }

    this.getOccurrenceTexts(navParams.get('occurrenceResult'));
    this.events.publish('view:enter', 'occurrences');
    this.setObjectType();
    this.getMediaData();
    this.getArticleData();
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

  getMediaData() {
    if (!this.objectType.length) {
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

  getArticleData() {
    if (!this.objectType.length) {
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
    try {
      this.events.publish('view:occurrance', occurrence.name);
    } catch ( e ) {}
  }

  getOccurrenceTexts(occurrenceResult) {
    this.texts = [];

    const occurrences: Occurrence[] = occurrenceResult.occurrences;
    for (const occurence of occurrences) {
      this.getOccurrence(occurence);
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
      text_type = 'manuscript';
    } else if (text.textType === 'var') {
      text_type = 'variation';
    } else if (text.textType === 'facs') {
      text_type = 'facsimile'
    } else if (text.textType === 'est') {
      text_type = 'established'
    } else {
      text_type = 'commentary';
    }

    params['tocLinkId'] = text.collectionID;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    if ( text.facsimilePage ) {
      params['facsimilePage'] = text.facsimilePage;
    } else {
      params['facsimilePage'] = null;
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

    if ( occurrence.original_filename === null ) {
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
    this.texts.push(newOccurrence);
  }

  setFacsimileOccurrence(occurrence: Occurrence, type: string) {
    const newOccurrence = new SingleOccurrence();
    newOccurrence.collectionID = occurrence.collection_id + '_' + occurrence.publication_id;
    newOccurrence.textType = type;
    newOccurrence.title = occurrence.name
    newOccurrence.collectionName = occurrence.collection_name
    newOccurrence.facsimilePage = occurrence.publication_facsimile_page
    newOccurrence.displayName = (occurrence.publication_name !== null ) ? occurrence.publication_name : occurrence.collection_name;
    this.texts.push(newOccurrence);
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

}
