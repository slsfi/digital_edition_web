import { Component, Renderer, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController, Content, Events } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

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
  showDescription = true;
  zoomImage = false;
  zoom = 0.5;

  constructor(
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private renderer: Renderer,
    private elementRef: ElementRef,
    protected modalController: ModalController,
    private config: ConfigService,
    private userSettingsService: UserSettingsService,
    private events: Events
  ) {
    if (this.navParams.get('showDescription') !== undefined) {
      this.showDescription = this.navParams.get('showDescription');
    }
    if (this.navParams.get('zoomImage') !== undefined) {
      this.zoomImage = this.navParams.get('zoomImage');
    }
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
    if (this.navParams.get('galleryPage') !== undefined) {
      const page = this.config.getSettings('galleryImages.' + this.navParams.get('galleryPage'));
      this.imgPath = this.illustrationsPath + page.prefix + this.navParams.get('imageNumber') + '.jpg';
    } else {
      this.imgPath = this.illustrationsPath + 'FFiT_' + this.navParams.get('imageNumber') + '.jpg';
    }
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
