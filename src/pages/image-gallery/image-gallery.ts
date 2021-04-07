import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ModalController, Events } from 'ionic-angular';
import { IllustrationPage } from '../illustration/illustration';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { MetadataService } from '../../app/services/metadata/metadata.service';

/**
 * Generated class for the ImageGalleryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
    name: 'image-gallery',
    segment: 'gallery/:galleryPage'
})
@Component({
  selector: 'page-image-gallery',
  templateUrl: 'image-gallery.html',
})
export class ImageGalleryPage {
  images: any[] = [];
  baseURL = 'assets/images/illustrations/2/';
  loading = true;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public modalController: ModalController,
    private userSettingsService: UserSettingsService,
    private config: ConfigService,
    private events: Events,
    private metadataService: MetadataService
  ) {
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('ionViewWillEnter', this.constructor.name);
    if (this.navParams.get('galleryPage') !== undefined) {
      const page = this.config.getSettings('galleryImages.' + this.navParams.get('galleryPage'));
      this.getImages(page);
    }
  }

  getImages(page) {
    const load = this.loadingCtrl.create({
      content: 'Please wait...'
    });

    load.present();
    for (let i = 1; i <= page.numberOfImages; i++) {
      const image = {
        'url': this.baseURL + page.prefix + i + '.jpg',
        'number': i
      }
      this.images.push(image);
    }
    load.dismiss();
  }

  ngForCallback() {
    this.loading = false;
  }

  openImage(image) {
    const modal = this.modalController.create(IllustrationPage,
      {'imageNumber': image['number'], 'galleryPage': this.navParams.get('galleryPage')},
      { cssClass: 'foo' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      console.log('dismissed', data);
    });
  }

}
