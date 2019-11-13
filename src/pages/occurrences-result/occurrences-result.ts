import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, App, LoadingController, ModalController, Events } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { OccurrenceResult, Occurrence } from '../../app/models/occurrence.model';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { SearchAppPage } from '../search-app/search-app';
import { ConfigService } from '@ngx-config/core';

/**
 * Generated class for the OccurrencesResultPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'occurrences-result',
  segment: 'result/:objectType/:id'
})
@Component({
  selector: 'page-occurrences-result',
  templateUrl: 'occurrences-result.html',
})
export class OccurrencesResultPage {
  segments = 'info';
  id: any = null;
  objectType: string = null;
  title: string = null;
  occurrencesToShow: SingleOccurrence[] = [];
  allOccurrences: SingleOccurrence[] = [];
  hasInfoDataToDisplay = false;
  hasInfoMediaDataOnlyToDisplay = false;
  loadingInfoData = false;
  loadingOccurrencesData = false;
  occurrenceResult: OccurrenceResult;
  singleOccurrenceType: string = null;

  searchResult: any = null;

  occurrencesCount = 0;
  infiniteScrollNumber = 100;

  infoData = {
    longitude: null,
    latitude: null,
    city: null,
    region: null,
    occupation: null,
    place_of_birth: null,
    type: null,
    type_translation: null,
    source: null,
    description: null,
    country: null,
    date_born: null,
    date_deceased: null
  };

  mediaData = {
    imageUrl: null,
    description: null
  };

  articleData: Array<Object> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: App,
    public semanticDataService: SemanticDataService,
    private platform: Platform,
    public occurrenceService: OccurrenceService,
    public loadingCtrl: LoadingController,
    private userSettingsService: UserSettingsService,
    public modalCtrl: ModalController,
    private config: ConfigService,
    private events: Events,
    private cf: ChangeDetectorRef
  ) {
    this.segments = 'info';
    if (this.navParams.get('searchResult') !== undefined) {
      this.searchResult = this.navParams.get('searchResult');
    }
    try {
      this.singleOccurrenceType = this.config.getSettings('SingleOccurrenceType');
    } catch (e) {
      this.singleOccurrenceType = null;
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.segments = 'info';
    this.getParamsData();
    this.getMediaData();
    this.getArticleData();
    this.getOccurrencesData();
  }

  getParamsData() {
    console.log(this.navParams);
    try {
      this.id = this.navParams.get('id');
      this.objectType = this.navParams.get('objectType');
    } catch ( e ) {
      console.log('not done');
    }
  }

  setSegment(value) {
    this.segments = value;
  }

  onSegmentChanged(obj) {
    this.cf.detectChanges();
    console.log('segment changed')
  }

  getOccurrencesData() {
    if (this.objectType === 'tag') {
      this.getTag();
      this.getTagOccurrences();
    } else if (this.objectType === 'subject') {
      this.getSubjectOccurrences();
    } else if (this.objectType === 'location') {
      this.getLocationOccurrences();
    }
  }

  setOccurrence(occurrence: Occurrence) {
    if (this.singleOccurrenceType === null) {
      if (
        occurrence.publication_id &&
        !occurrence.publication_manuscript_id &&
        !occurrence.publication_comment_id &&
        !occurrence.publication_facsimile_id &&
        !occurrence.publication_version_id
      ) {
        this.addToOccurrencesList(occurrence, 'est');
      } else {
        if (occurrence.publication_manuscript_id) {
          this.addToOccurrencesList(occurrence, 'ms');
        }
        if (occurrence.publication_version_id) {
          this.addToOccurrencesList(occurrence, 'var');
        }
        if (occurrence.publication_comment_id) {
          this.addToOccurrencesList(occurrence, 'com');
        }
        if (occurrence.publication_facsimile_id) {
          this.addToOccurrencesList(occurrence, 'facs');
        }
        if (occurrence.type === 'song') {
          this.addToOccurrencesList(occurrence, occurrence.type);
        }
      }
    } else if (this.singleOccurrenceType === occurrence.type) {
      this.addToOccurrencesList(occurrence, occurrence.type);
    }
  }

  addToOccurrencesList(occurrence: Occurrence, type: string) {
    const newOccurrence = new SingleOccurrence();
    let fileName = occurrence.original_filename;

    if (occurrence.original_filename === null) {
      fileName = occurrence.collection_id + '_' + occurrence['publication_id'] + '.xml';
    }

    if (occurrence.id) {
      newOccurrence.id = occurrence.id;
    }

    newOccurrence.description = occurrence.description || null;
    newOccurrence.publication_facsimile_id = occurrence.publication_facsimile_id || null;
    newOccurrence.publication_facsimile = occurrence.publication_facsimile || null;
    newOccurrence.publication_facsimile_page = occurrence.publication_facsimile_page || null;
    newOccurrence.linkID = fileName.split('.xml')[0];
    newOccurrence.filename = fileName;
    newOccurrence.textType = type;
    newOccurrence.name = occurrence.song_name || null;
    newOccurrence.number = occurrence.song_number || null;
    newOccurrence.original_collection_location = occurrence.song_original_collection_location || null;
    newOccurrence.original_collection_signature = occurrence.song_original_collection_signature || null;
    newOccurrence.original_publication_date = occurrence.song_original_publication_date || null;
    newOccurrence.page_number = occurrence.song_page_number || null;
    newOccurrence.performer_born_name = occurrence.song_performer_born_name || null;
    newOccurrence.performer_firstname = occurrence.song_performer_firstname || null;
    newOccurrence.performer_lastname = occurrence.song_performer_lastname || null;
    newOccurrence.place = occurrence.song_place || null;
    newOccurrence.recorder_born_name = occurrence.song_recorder_born_name || null;
    newOccurrence.recorder_firstname = occurrence.song_recorder_firstname || null;
    newOccurrence.recorder_lastname = occurrence.song_recorder_lastname || null;
    newOccurrence.subtype = occurrence.song_subtype || null;
    newOccurrence.type = occurrence.song_type || null;
    newOccurrence.variant = occurrence.song_variant || null;
    newOccurrence.volume = occurrence.song_volume || null;
    newOccurrence.landscape = occurrence.song_landscape || null;
    newOccurrence.title = occurrence.name;
    newOccurrence.song_id = occurrence.song_id;
    newOccurrence.collectionID = newOccurrence.linkID.split('_' + type)[0];
    newOccurrence.collectionName = occurrence.collection_name;
    newOccurrence.displayName = (occurrence.publication_name !== null) ? occurrence.publication_name : occurrence.collection_name;
    newOccurrence.publication_name = occurrence.publication_name || null;

    if ( newOccurrence.type !== null ) {
      newOccurrence.displayName = String(newOccurrence.type).charAt(0).toUpperCase() + String(newOccurrence.type).slice(1);
    }

    if ( newOccurrence.number !== null ) {
      newOccurrence.publication_facsimile_page = String(newOccurrence.number);
    }


    let exists = false;

    for (const oc of this.occurrencesToShow) {
      if (
        type === 'song' &&
        oc.textType === newOccurrence.textType &&
        oc.description === newOccurrence.description
      ) {
        exists = true;
        break;
      } else if (
        oc.id === newOccurrence.id &&
        oc.textType === newOccurrence.textType &&
        oc.publication_facsimile === newOccurrence.publication_facsimile &&
        oc.publication_facsimile_id === newOccurrence.publication_facsimile_id &&
        oc.publication_facsimile_page === newOccurrence.publication_facsimile_page &&
        oc.description === newOccurrence.description
      ) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      this.allOccurrences.push(newOccurrence);

      if (this.occurrencesCount < this.infiniteScrollNumber) {
        this.occurrencesToShow.push(newOccurrence);
        this.occurrencesCount++;
      }

      this.allOccurrences.sort(function(a, b) {
        if (a.displayName < b.displayName) { return -1; }
        if (a.displayName > b.displayName) { return 1; }
        return 0;
      });
      this.occurrencesToShow.sort(function(a, b) {
        if (a.displayName < b.displayName) { return -1; }
        if (a.displayName > b.displayName) { return 1; }
        return 0;
      });
    }
  }

  getTagOccurrences() {
    if (this.id === null || this.objectType === null) {
      console.log('Navparams missing...');
      return;
    }

    this.loadingOccurrencesData = true;

    this.semanticDataService.getTagOccurrences(this.id).subscribe(
      tags => {

        for (const tag of tags) {
          tag.name = String(tag.name).toLocaleLowerCase();

          if (Number(tag.id) === Number(this.id)) {
            this.occurrenceResult = tag;
            const occurrences: Occurrence[] = this.occurrenceResult.occurrences;

            for (const occurence of occurrences) {
              this.setOccurrence(occurence);
            }

            this.loadingOccurrencesData = false;

            if (!this.hasInfoDataToDisplay && this.occurrencesToShow && this.occurrencesToShow.length) {
              this.segments = 'occurrences';
            }
            break;
          }
        }
      },
      err => {
        console.error(err);
        this.loadingOccurrencesData = false;
      },
      () => console.log('Fetched tags...')
    );
  }

  getSubjectOccurrences() {
    if (this.id === null || this.objectType === null) {
      console.log('Navparams missing...');
      return;
    }

    this.loadingInfoData = true;
    this.loadingOccurrencesData = true;

    const currentSubjectId = this.id;

    this.semanticDataService.getSubjectOccurrences(currentSubjectId).subscribe(
      subjects => {

        for (const subject of subjects) {
          if (Number(subject.id) === Number(currentSubjectId)) {
            this.setSubject(subject);
            this.checkHasAnyInfoDataToDisplay();

            this.occurrenceResult = subject;
            const occurrences: Occurrence[] = this.occurrenceResult.occurrences;

            for (const occurence of occurrences) {
              this.setOccurrence(occurence);
            }
            this.loadingInfoData = false;
            this.loadingOccurrencesData = false

            if (!this.hasInfoDataToDisplay && this.occurrencesToShow && this.occurrencesToShow.length) {
              this.segments = 'occurrences';
            }
            break;
          }
        }
      },
      err => {
        console.error(err);
        this.loadingInfoData = false;
        this.loadingOccurrencesData = false;
      },
      () => console.log('Fetched tags...')
    );
  }

  getLocationOccurrences() {
    if (this.id === null || this.objectType === null) {
      console.log('Navparams missing...');
      return;
    }

    this.loadingInfoData = true;
    this.loadingOccurrencesData = true;

    const currentLocationId = this.id;

    this.semanticDataService.getLocationOccurrences(currentLocationId).subscribe(
      locations => {

        for (const location of locations) {
          if (Number(location.id) === Number(currentLocationId)) {
            this.setLocation(location);
            this.checkHasAnyInfoDataToDisplay();

            this.occurrenceResult = location;
            const occurrences: Occurrence[] = this.occurrenceResult.occurrences;

            for (const occurence of occurrences) {
              this.setOccurrence(occurence);
            }
            this.loadingInfoData = false;
            this.loadingOccurrencesData = false

            if (!this.hasInfoDataToDisplay && this.occurrencesToShow && this.occurrencesToShow.length) {
              this.segments = 'occurrences';
            }
            break;
          }
        }
      },
      err => {
        console.error(err);
        this.loadingInfoData = false;
        this.loadingOccurrencesData = false;
      },
      () => console.log('Fetched tags...')
    );
  }

  getTag() {
    if (!this.id) {
      return;
    }
    this.loadingInfoData = true;
    this.semanticDataService.getTag(this.id).subscribe(
      tag => {
        if (tag.name) {
          let title = tag.name;
          title = title.charAt(0).toUpperCase() + title.slice(1);
          this.title = title;
          try {
            (<any>window).ga('send', 'event', {
              eventCategory: 'Occurrence',
              eventLabel: 'tag',
              eventAction: String(title),
              eventValue: 10
            });
          } catch ( e ) {
          }
        }
        // string.charAt(0).toUpperCase() + string.slice(1);
        this.loadingInfoData = false;
        this.checkHasAnyInfoDataToDisplay();
      },
      err => {
        console.error(err);
        this.loadingInfoData = false;
      },
      () => console.log('Fetched tags...')
    );
  }

  setSubject(subject) {
    if (subject.name) {
      this.title = subject.name;
      try {
        (<any>window).ga('send', 'event', {
          eventCategory: 'Occurrence',
          eventLabel: 'subject',
          eventAction: String(this.title),
          eventValue: 10
        });
      } catch ( e ) {
      }
    }

    this.infoData.type = subject.object_type;
    this.infoData.description = subject.description;

    if (['playman', 'recorder'].indexOf(subject.object_type) !== -1) {
      this.infoData.type_translation = `Song.${subject.object_type}`;
    }
  }

  setLocation(location) {
    if (location.name) {
      this.title = location.name;
      try {
        (<any>window).ga('send', 'event', {
          eventCategory: 'Occurrence',
          eventLabel: 'location',
          eventAction: String(this.title),
          eventValue: 10
        });
      } catch ( e ) {
      }
    }

    this.infoData.city = location.city;
    this.infoData.latitude = location.latitude;
    this.infoData.longitude = location.longitude;
    this.infoData.region = location.region;
  }

  /**
   * Media data: image and description about a subject, location or tag
   */
  getMediaData() {
    if (!this.objectType.length) {
      return;
    }

    this.occurrenceService.getMediaData(this.objectType, String(this.id)).subscribe(
      mediaData => {
        this.mediaData.imageUrl = mediaData.image_path;
        this.mediaData.description = mediaData.description;
      },
      error => console.log(error)
    );
  }

  getArticleData() {
    if (!this.objectType.length) {
      return;
    }

    this.occurrenceService.getArticleData(this.objectType, this.id).subscribe(
      data => {
        this.articleData = data;
      },
      error => console.log(error)
    );
  }

  checkHasAnyInfoDataToDisplay() {
    let hasData = false;

    for (const key in this.infoData) {
      if (this.infoData[key] !== null) {
        hasData = true;
        break;
      }
    }

    if (!hasData) {
      for (const key in this.mediaData) {
        if (this.mediaData[key] !== null) {
          hasData = true;
          break;
        }
      }

      if (hasData) {
        this.hasInfoMediaDataOnlyToDisplay = true;
      }
    }

    this.hasInfoDataToDisplay = hasData;
  }

  /**
   * Select occurrence
   */
  openText(text: any) {
    if (text.textType === 'song' && text.song_id) {
      this.selectSong(text.song_id);
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

    params['search_title'] = 'searchtitle';
    params['facs_id'] = 'not';
    params['facs_nr'] = 'infinite';
    params['song_id'] = 'nosong';

    if (text_type === 'facsimile') {
      if (text.publication_facsimile_id) {
        params['facs_id'] = text.publication_facsimile_id;
      }

      if (text.facs_nr) {
        params['facs_nr'] = text.facs_nr;
      }
    }

    params['tocLinkId'] = text.collectionID;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    if (text.facsimilePage) {
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

    // params['occurrenceResult'] = this.occurrenceResult;

    if (this.navParams.get('showOccurrencesModalOnRead')) {
      params['showOccurrencesModalOnRead'] = true;
    }

    if (this.objectType) {
      params['objectType'] = this.objectType;
    }

    if (this.platform.is('mobile')) {
      this.app.getRootNav().push('read', params);
    } else {
      this.app.getRootNav().push('read', params);
    }
  }

  ionViewDidEnter() {
    (<any>window).ga('set', 'page', 'Occurrence-result');
    (<any>window).ga('send', 'pageview');
  }

  /**
   * If occurrence is a song, go to song page instead
   */
  selectSong(song_id) {
    const nav = this.app.getActiveNavs();

    let songsFilter = this.objectType;

    if (this.objectType === 'subject') {
      songsFilter = this.infoData.type;
    }

    const params = {
      song_number: song_id,
      filter_songs_by: songsFilter
    };

    params['occurrenceResult'] = this.occurrenceResult;
    params['objectType'] = this.objectType;

    if (this.navParams.get('showOccurrencesModalOnSong')) {
      params['showOccurrencesModalOnSong'] = true;
    }

    nav[0].setRoot('song', params);
  }

  openSearchResult() {
    const searchModal = this.modalCtrl.create(SearchAppPage, {
      searchResult: this.searchResult
    });
    searchModal.present();
  }

  doInfinite(infiniteScroll) {
    if ( this.occurrencesToShow !== undefined && this.occurrencesCount < this.allOccurrences.length ) {
      for (let i = 0; i < this.infiniteScrollNumber; i++) {
        if (this.occurrencesCount < this.allOccurrences.length) {
          this.occurrencesToShow.push(this.allOccurrences[this.occurrencesCount]);
          this.occurrencesCount++;
        } else {
          break;
        }
      }
    }
    infiniteScroll.complete();
  }

}
