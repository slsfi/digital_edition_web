import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Events } from 'ionic-angular';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';

@IonicPage({
  name: 'media-collections',
  segment: 'media-collections'
})
@Component({
  selector: 'media-collections',
  templateUrl: 'media-collections.html',
})
export class MediaCollectionsPage {

  galleries = [];
  private apiEndPoint: string;
  private projectMachineName: string;
  private removeScanDetails = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: App,
    private events: Events,
    private galleryService: GalleryService,
    private userSettingsService: UserSettingsService,
    private config: ConfigService

  ) {
    this.getMediaCollections();
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.removeScanDetails = this.config.getSettings('galleryImages.removeScanDetails');
    } catch (e) {
      this.removeScanDetails = false;
    }
  }
  getMediaCollections() {
    this.galleryService.getGalleries()
    .subscribe(galleries => {this.galleries = galleries; });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  asThumb(url) {
    return url.replace('.jpg', '_thumb.jpg');
  }

  openMediaCollection(gallery) {
    const nav = this.app.getActiveNavs();
    const params = {mediaCollectionId: gallery.id , mediaTitle: gallery.title, fetch: false};
    nav[0].push('media-collection', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
  }

}
