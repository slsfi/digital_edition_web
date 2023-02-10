import { Component, Renderer2, ElementRef } from '@angular/core';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { EventsService } from 'src/app/services/events/events.service';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { GalleryService } from 'src/app/services/gallery/gallery.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { LanguageService } from 'src/app/services/languages/language.service';

/**
 * Generated class for the IllustrationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-illustration',
  templateUrl: 'illustration.html',
  styleUrls: ['illustration.scss']
})
export class IllustrationPage {
  imgPath: any;
  illustrationsPath = 'assets/images/illustrations/2/';
  apiImagePat = '';
  showDescription = true;
  zoomImage = false;
  zoom = 1.0;
  latestDeltaX = 0;
  latestDeltaY = 0;
  prevX = 0;
  prevY = 0;
  language: String = 'sv';
  imgMetadata: any;

  constructor(
    public viewCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private renderer2: Renderer2,
    private elementRef: ElementRef,
    private galleryService: GalleryService,
    protected modalController: ModalController,
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    private events: EventsService,
    public languageService: LanguageService,
    public router: Router,
  ) {
    if (this.navParams.get('showDescription') !== undefined) {
      this.showDescription = this.navParams.get('showDescription');
    }
    if (this.navParams.get('zoomImage') !== undefined) {
      this.zoomImage = this.navParams.get('zoomImage');
    }
    this.language = this.config.getSettings('i18n.locale') as any;
    this.imgMetadata = [];
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.getImageMetadata();
    });
  }

  ngAfterViewInit() {
    if (!this.showDescription) {
      this.renderer2.listen(this.elementRef.nativeElement, 'click', (event) => {
        if (
          !event.target.classList.contains('illustration-img') &&
          !event.target.classList.contains('zoom-buttons') &&
          !event.target.classList.contains('icon')
        ) {
          this.viewCtrl.dismiss();
        }
      });
    }
  }

  getImageMetadata() {
    this.galleryService.getMediaMetadata(this.navParams.get('imageNumber'), this.language)
      .subscribe(data => {
        this.imgMetadata = data;
        this.imgPath = this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/gallery/get/' + this.imgMetadata['media_collection_id' as keyof typeof this.imgMetadata] + '/' + this.imgMetadata['image_filename_front' as keyof typeof this.imgMetadata];
    });
  }

  async zoomImg() {
    this.showDescription = false;
    const modal = await this.modalController.create({
      component: IllustrationPage,
      cssClass: 'illustration-modal',
      componentProps: {
        'imageNumber': this.navParams.get('imageNumber'), 'galleryPage': this.navParams.get('galleryPage'),
        'showDescription': false,
        'zoomImage': true
      }
    });
    modal.present();
    modal.onDidDismiss().then((data: any) => {
      console.log('dismissed', data);
      this.showDescription = true;
      this.zoomImage = false;
    })
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  ionViewWillLoad() {

  }

  goToMediaCollection() {
    const params = {
      mediaCollectionId: this.imgMetadata['media_collection_id' as keyof typeof this.imgMetadata],
      mediaTitle: this.imgMetadata['media_collection_title_translation' as keyof typeof this.imgMetadata], fetch: false
    };
    this.router.navigate(['media-collection'], { queryParams: params });
  }

  zoomIn() {
    this.zoom = this.zoom + 0.1;
  }

  zoomOut() {
    if (this.zoom < 0.2) {
      this.zoom = 0.1;
    } else {
      this.zoom = this.zoom - 0.1;
    }
  }

  resetZoom() {
    this.zoom = 1.0;
    this.prevX = 0;
    this.prevY = 0;
  }

  handleSwipeEvent(event: any) {
    const img = event.target;
    if (img !== null) {
      // Store latest zoom adjusted delta.
      // NOTE: img must have touch-action: none !important;
      // otherwise deltaX and deltaY will give wrong values on mobile.
      this.latestDeltaX = event.deltaX / this.zoom;
      this.latestDeltaY = event.deltaY / this.zoom;

      // Get current position from last position and delta.
      const x = this.prevX + this.latestDeltaX;
      const y = this.prevY + this.latestDeltaY;

      img.style.transform = 'scale(' + this.zoom + ') translate3d(' + x + 'px, ' + y + 'px, 0px)';
    }
  }

  onMouseUp(e: any) {
    // Update the previous position on desktop by adding the latest delta.
    this.prevX += this.latestDeltaX;
    this.prevY += this.latestDeltaY;
  }

  onTouchEnd(e: any) {
    // Update the previous position on mobile by adding the latest delta.
    this.prevX += this.latestDeltaX;
    this.prevY += this.latestDeltaY;
  }

  onMouseWheel(event: any) {
    const img = event.target;
    if (img !== null) {
      if (event.deltaY > 0) {
        this.zoomIn();
        img.style.transform = 'scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' + this.prevY + 'px, 0px)';
      } else {
        this.zoomOut();
        img.style.transform = 'scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' + this.prevY + 'px, 0px)';
      }
    }
  }
}
