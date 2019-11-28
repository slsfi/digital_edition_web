import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { FacsimileZoomModalPage } from '../facsimile-zoom/facsimile-zoom';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core/src/translate.service';
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
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private events: Events,
    private galleryService: GalleryService,
    private userSettingsService: UserSettingsService,
    private modalController: ModalController,
    private config: ConfigService,
    public translate: TranslateService

  ) {
    this.mediaCollectionId = this.navParams.get('mediaCollectionId');
    this.singleId = this.navParams.get('id');
    this.type = this.navParams.get('type');
    this.mediaTitle = this.navParams.get('mediaTitle');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.removeScanDetails = this.config.getSettings('galleryImages.removeScanDetails');
    } catch (e) {
      this.removeScanDetails = false;
    }
    if (this.mediaCollectionId !== null && this.mediaCollectionId !== 'null' ) {
      this.getMediaCollections();
      this.getCollectionTags();
      this.getCollectionLocations();
      this.getCollectionSubjects();
    } else {
      this.mediaCollectionId = undefined;
      this.getMediaCollections(this.singleId, this.type);
    }
  }

  getMediaCollections(id?, type?) {
    if ( id === undefined ) {
      this.galleryService.getGallery(this.mediaCollectionId)
      .subscribe(gallery => {
        this.mediaCollection = gallery.gallery ? gallery.gallery : gallery;
        this.allMediaCollection = this.mediaCollection;
        this.mediaTitle = gallery[0].title ? gallery[0].title : this.mediaTitle;
        this.mediaDescription = gallery.description ? gallery.description : '';
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

    const modal = this.modalController.create(FacsimileZoomModalPage,
      { 'images': zoomedImages, 'activeImage': index, 'backsides' : backsides, 'descriptions' : descriptions },
      { cssClass: 'facsimile-zoom-modal' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      console.log('dismissed', data);
    });
  }

  getCollectionTags() {
    (async () => {
      let tags = [];
      tags = await this.galleryService.getGalleryTags(this.mediaCollectionId);
      this.allTags = tags;
      const addedTags: Array<any> = [];
      tags.forEach(element => {
        if (addedTags.indexOf(element['id']) === -1) {
          this.galleryTags.push({ 'name': String(element['name']).toLowerCase(), id: element['id'], 'media_collection_id': element['media_collection_id'] });
          addedTags.push(element['id']);
        }
      });
      this.galleryTags.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }).bind(this)();
  }

  getCollectionLocations() {
    (async () => {
      let locations = [];
      locations = await this.galleryService.getGalleryLocations(this.mediaCollectionId);
      this.allLocations = locations;
      const addedLocations: Array<any> = [];
      locations.forEach(element => {
        if (addedLocations.indexOf(element['id']) === -1) {
          this.galleryLocations.push({ 'name': String(element['name']).toLowerCase(), id: element['id'], 'media_collection_id': element['media_collection_id'] });
          addedLocations.push(element['id']);
        }
      });
      this.galleryLocations.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }).bind(this)();
  }

  getCollectionSubjects() {
    (async () => {
      let subjects = [];
      subjects = await this.galleryService.getGallerySubjects(this.mediaCollectionId);
      this.allSubjects = subjects;
      const addedSubjects: Array<any> = [];
      subjects.forEach(element => {
        if (addedSubjects.indexOf(element['id']) === -1) {
          this.gallerySubjects.push({ 'name': String(element['name']).toLowerCase(), id: element['id'], 'media_collection_id': element['media_collection_id'] });
          addedSubjects.push(element['id']);
        }
      });
      this.gallerySubjects.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }).bind(this)();
  }

  filterCollectionsByTag(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if (this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevTag) {
      this.mediaCollection = this.allMediaCollection;
      this.prevTag = name;
      if (this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== '') {
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
  }

  filterCollectionsByLocation(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if (this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevLoc) {
      this.mediaCollection = this.allMediaCollection;
      this.prevLoc = name;
      if (this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== '') {
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
  }

  filterCollectionsBySubject(name) {
    if (name === '') {
      this.mediaCollection = this.allMediaCollection;
      if (this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      return true;
    }
    if (name !== this.prevSub) {
      this.mediaCollection = this.allMediaCollection;
      this.prevSub = name;
      if (this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
    }
    const filenames: Array<any> = [];
    const filteredGalleries = [];
    this.allSubjects.forEach(element => {
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
  }

}
