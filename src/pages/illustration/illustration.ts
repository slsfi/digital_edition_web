import { Component, Renderer, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController, Content, Events, App } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { LanguageService } from '../../app/services/languages/language.service';

/**
 * Generated class for the IllustrationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-illustration',
  templateUrl: 'illustration.html',
})
export class IllustrationPage {
  @ViewChild(Content) content: Content;

  imgPath: any;
  illustrationsPath = 'assets/images/illustrations/2/';
  apiImagePat = '';
  showDescription = true;
  zoomImage = false;
  zoom = 1.0;
  language: String = 'sv';
  imgMetadata: Object;

  constructor(
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private galleryService: GalleryService,
    protected modalController: ModalController,
    private config: ConfigService,
    private userSettingsService: UserSettingsService,
    private events: Events,
    public languageService: LanguageService,
    private app: App
  ) {
    if (this.navParams.get('showDescription') !== undefined) {
      this.showDescription = this.navParams.get('showDescription');
    }
    if (this.navParams.get('zoomImage') !== undefined) {
      this.zoomImage = this.navParams.get('zoomImage');
    }
    this.language = this.config.getSettings('i18n.locale');
    this.imgMetadata = [];
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.getImageMetadata();
    });
  }

  ngAfterViewInit() {
    if (!this.showDescription) {
      this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
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
        this.config.getSettings('app.machineName') + '/gallery/get/' + this.imgMetadata['media_collection_id'] + '/' + this.imgMetadata['image_filename_front'];
    });
  }

  zoomImg() {
    this.showDescription = false;
    const modal = this.modalController.create(IllustrationPage,
      {
        'imageNumber': this.navParams.get('imageNumber'), 'galleryPage': this.navParams.get('galleryPage'),
        'showDescription': false,
        'zoomImage': true
      },
      { cssClass: 'illustration-modal' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      console.log('dismissed', data);
      this.showDescription = true;
      this.zoomImage = false;
      this.content.resize();
    });
  }

  cancel() {
    this.viewCtrl.dismiss();
    this.content.resize();
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  ionViewWillLoad() {

  }

  goToMediaCollection() {
    const nav = this.app.getActiveNavs();
    const params = {
      mediaCollectionId: this.imgMetadata['media_collection_id'],
      mediaTitle: this.imgMetadata['media_collection_title_translation'], fetch: false
    };
    nav[0].push('media-collection', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
  }

  zoomIn() {
    this.zoom = this.zoom + 0.1;
  }
  zoomOut() {
    this.zoom = this.zoom - 0.1;
    if (this.zoom < 0.5) {
      this.zoom = 0.5;
    }
  }

}
