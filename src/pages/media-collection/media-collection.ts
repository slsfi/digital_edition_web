import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { FacsimileZoomModalPage } from '../facsimile-zoom/facsimile-zoom';
import { ConfigService } from '@ngx-config/core';
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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private events: Events,
    private galleryService: GalleryService,
    private userSettingsService: UserSettingsService,
    private modalController: ModalController,
    private config: ConfigService

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
    if ( this.mediaCollectionId !== null ) {
      this.getMediaCollections();
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

}
