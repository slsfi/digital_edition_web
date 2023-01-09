import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { FacsimileZoomModalPage } from '../facsimile-zoom/facsimile-zoom';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core/src/translate.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ReferenceDataModalPage } from '../reference-data-modal/reference-data-modal';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { MetadataService } from '../../app/services/metadata/metadata.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { MdContent } from '../../app/models/md-content.model';
/**
 * Generated class for the FacsimileCollectionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'media-collection',
  segment: 'media-collection/:mediaCollectionId/:id/:type'
})
@Component({
  selector: 'page-media-collection',
  templateUrl: 'media-collection.html',
})
export class MediaCollectionPage {

  mediaCollectionId: string;
  mediaTitle: string;
  mediaDescription: string;
  mediaCollection = [];
  private apiEndPoint: string;
  private projectMachineName: string;
  removeScanDetails = false;
  singleId: string;
  type: string;
  language = 'sv';

  allTags = [];
  allLocations = [];
  allSubjects = [];
  allMediaCollection = [];
  galleryTags = [];
  galleryLocations = [];
  gallerySubjects = [];
  locationModel = '';
  tagModel = '';
  subjectModel = '';
  prevTag = '';
  prevLoc = '';
  prevSub = '';
  mdContent: MdContent;
  showURNButton: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private events: Events,
    private galleryService: GalleryService,
    private userSettingsService: UserSettingsService,
    private modalController: ModalController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private analyticsService: AnalyticsService,
    private metadataService: MetadataService,
    private mdContentService: MdContentService

  ) {
    this.mediaCollectionId = this.navParams.get('mediaCollectionId');
    this.singleId = this.navParams.get('id');
    this.type = this.navParams.get('type');
    this.mediaTitle = this.navParams.get('mediaTitle');
    this.tagModel = this.navParams.get('tag');
    this.subjectModel = this.navParams.get('subject');
    this.locationModel = this.navParams.get('location');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.removeScanDetails = this.config.getSettings('galleryImages.removeScanDetails');
    } catch (e) {
      this.removeScanDetails = false;
    }

    try {
      this.showURNButton = this.config.getSettings('showURNButton.mediaCollection');
    } catch (e) {
      this.showURNButton = true;
    }

    let fileID = '11-' + this.mediaCollectionId;
    this.mdContent = new MdContent({id: fileID, title: '...', content: null, filename: null});

    this.language = this.config.getSettings('i18n.locale');
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      if (this.mediaCollectionId !== null && this.mediaCollectionId !== 'null') {
        if ( !String(fileID).includes(lang) ) {
          fileID = lang + '-' + fileID;
        }
        this.getMdContent(fileID);
        this.getCollectionTags();
        this.getCollectionLocations();
        this.getCollectionSubjects();
        this.getMediaCollections();
        this.doAnalytics('Collection', this.mediaTitle, '');
      } else {
        this.mediaCollectionId = undefined;
        this.getMediaCollections(this.singleId, this.type);
        this.doAnalytics('Filter', this.type, this.singleId);
      }
    });
  }

  doAnalytics(category, label, action) {
    this.analyticsService.doAnalyticsEvent(category, label, action);
  }

  ionViewDidEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();
    this.analyticsService.doPageView('Collection');
  }

  getMediaCollections(id?, type?) {
    if ( id === undefined ) {
      this.galleryService.getGallery(this.mediaCollectionId, this.language)
      .subscribe(gallery => {
        this.mediaCollection = gallery.gallery ? gallery.gallery : gallery;
        this.allMediaCollection = this.mediaCollection;
        this.mediaTitle = gallery[0].title ? gallery[0].title : this.mediaTitle;
        this.mediaDescription = gallery.description ? gallery.description : '';
        if (this.tagModel !== undefined && this.tagModel !== '') {
          this.prevTag = this.tagModel;
          if (this.allTags.length > 0) {
            this.filterCollectionsByTag(this.tagModel);
          } else {
            this.getCollectionTags(this.tagModel);
          }
        }
        if (this.locationModel !== undefined && this.locationModel !== '') {
          this.prevLoc = this.locationModel;
          if (this.allLocations.length > 0) {
            this.filterCollectionsByLocation(this.locationModel);
          } else {
            this.getCollectionLocations(this.locationModel);
          }
        }
        if (this.subjectModel !== undefined && this.subjectModel !== '') {
          this.prevSub = this.subjectModel;
          if (this.allSubjects.length > 0) {
            this.filterCollectionsBySubject(this.subjectModel);
          } else {
            this.getCollectionSubjects(this.subjectModel);
          }
        }
      });
    } else {
      this.galleryService.getGalleryOccurrences(type, id)
      .subscribe(occurrences => {
        occurrences.forEach(element => {
          element['mediaCollectionId'] = element['media_collection_id'];
          element['front'] = element['filename'];
          this.mediaCollection.push(element)
        });

        if ( type === 'subject' ) {
          this.mediaTitle = occurrences[0]['full_name'];
          this.mediaDescription = '';
        } else {
          this.mediaTitle = occurrences[0]['name'];
          this.mediaDescription = '';
        }
      });
    }
  }

  asThumb(url) {
    return url.replace('.jpg', '_thumb.jpg');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'media-collection'});
    this.events.publish('SelectedItemInMenu', {
      menuID: this.mediaCollectionId,
      component: 'media-collection'
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MediaCollectionPage');
  }

  getImageUrl(filename, mediaCollectionId) {
    if (!filename) {
      return null;
    }
    return this.apiEndPoint + '/' + this.projectMachineName + '/gallery/get/' + mediaCollectionId +
           '/' + filename;
  }

  openImage(index, mediaCollectionId) {
    const zoomedImages = this.mediaCollection.map(i => this.getImageUrl(i.front, mediaCollectionId));
    const backsides = zoomedImages.map(i => i.replace('.jpg', 'B.jpg'));
    const descriptions = this.mediaCollection.map(i => i.description);
    const imageTitles = this.mediaCollection.map(i => i.media_title_translation);

    const modal = this.modalController.create(FacsimileZoomModalPage,
      { 'images': zoomedImages, 'activeImage': index, 'backsides': backsides, 'descriptions': descriptions, 'imageTitles': imageTitles },
      { cssClass: 'facsimile-zoom-modal' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  getCollectionTags(filter?) {
    (async () => {
      let tags = [];
      tags = await this.galleryService.getGalleryTags(this.mediaCollectionId);
      this.allTags = tags;
      const addedTags: Array<any> = [];
      tags.forEach(element => {
        if (addedTags.indexOf(element['id']) === -1) {
          this.galleryTags.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id']
          });
          addedTags.push(element['id']);
        }
      });
      this.galleryTags.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      if (filter) {
        this.filterCollectionsByTag(filter);
      }
    }).bind(this)();
  }

  getCollectionLocations(filter?) {
    (async () => {
      let locations = [];
      locations = await this.galleryService.getGalleryLocations(this.mediaCollectionId);
      this.allLocations = locations;
      const addedLocations: Array<any> = [];
      locations.forEach(element => {
        if (addedLocations.indexOf(element['id']) === -1) {
          this.galleryLocations.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id']
          });
          addedLocations.push(element['id']);
        }
      });
      this.galleryLocations.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      if (filter) {
        this.filterCollectionsByLocation(filter);
      }
    }).bind(this)();
  }

  getCollectionSubjects(filter?) {
    (async () => {
      let subjects = [];
      subjects = await this.galleryService.getGallerySubjects(this.mediaCollectionId);
      this.allSubjects = subjects;
      const addedSubjects: Array<any> = [];
      subjects.forEach(element => {
        if (addedSubjects.indexOf(element['id']) === -1) {
          this.gallerySubjects.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id']
          });
          addedSubjects.push(element['id']);
        }
      });
      this.gallerySubjects.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      if (filter) {
        this.filterCollectionsBySubject(filter);
      }
    }).bind(this)();
  }

  filterCollectionsByTag(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevTag) {
      this.mediaCollection = this.allMediaCollection;
      this.prevTag = name;
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
    }
    const filenames: Array<any> = [];
    const filteredGalleries = [];
    this.allTags.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase()) {
        filenames.push(element['filename']);
      }
    });
    this.mediaCollection.forEach(element => {
      if (filenames.indexOf(element['front']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.mediaCollection = filteredGalleries;
    this.doAnalytics('Filter', 'tag', name);
  }

  filterCollectionsByLocation(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if (this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevLoc) {
      this.mediaCollection = this.allMediaCollection;
      this.prevLoc = name;
      if (this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
    }
    const filenames: Array<any> = [];
    const filteredGalleries = [];
    this.allLocations.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase()) {
        filenames.push(element['filename']);
      }
    });
    this.mediaCollection.forEach(element => {
      if (filenames.indexOf(element['front']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.mediaCollection = filteredGalleries;
    this.doAnalytics('Filter', 'location', name);
  }

  filterCollectionsBySubject(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if ( this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      return true;
    }
    if (name !== this.prevSub) {
      this.mediaCollection = this.allMediaCollection;
      this.prevSub = name;
      if ( this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if ( this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
    }
    const filenames: Array<any> = [];
    const filteredGalleries = [];
    this.allSubjects.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase() || name === '') {
        filenames.push(element['filename']);
      }
    });
    this.mediaCollection.forEach(element => {
      if (filenames.indexOf(element['front']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.mediaCollection = filteredGalleries;
    this.doAnalytics('Filter', 'subject', name);
  }

  getMdContent(fileID: string) {
    // console.log(`Calling getMdContent from content.ts ${fileID}`);
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {
              this.mdContent.content = text.content;
            },
            error =>  {}
        );
  }

  showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference', origin: 'media-collection'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

}
