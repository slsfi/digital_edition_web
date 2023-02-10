import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, ModalController, NavController } from '@ionic/angular';
import { IllustrationPage } from 'src/app/modals/illustration/illustration';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { MetadataService } from 'src/app/services/metadata/metadata.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

/**
 * Generated class for the ImageGalleryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//     name: 'image-gallery',
//     segment: 'gallery/:galleryPage'
// })
@Component({
  selector: 'page-image-gallery',
  templateUrl: 'image-gallery.html',
  styleUrls: ['image-gallery.scss']
})
export class ImageGalleryPage {
  images: any[] = [];
  baseURL = 'assets/images/illustrations/2/';
  loading = true;
  galleryPage?: string

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public modalController: ModalController,
    public userSettingsService: UserSettingsService,
    private config: ConfigService,
    private events: EventsService,
    private metadataService: MetadataService,
    private route: ActivatedRoute,
  ) {
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['galleryPage']) {
        const page = this.config.getSettings('galleryImages.' + params['galleryPage']);
        this.getImages(page);
        this.galleryPage = params['galleryPage'];
      }
    })
  }

  async getImages(page: any) {
    const load = await this.loadingCtrl.create({
      message: 'Please wait...'
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

  async openImage(image: any) {
    const modal = await this.modalController.create({
      component: IllustrationPage,
      componentProps: {'imageNumber': image['number'], 'galleryPage': this.galleryPage},
      cssClass: 'foo',
    });
    modal.present();
  }

}
