import { Component, HostListener } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * Generated class for the FacsimileZoomPage page.
 *
 * Zoom facsimile.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-facsimile-zoom',
  templateUrl: 'facsimile-zoom.html',
})
export class FacsimileZoomModalPage {

  images: any;
  backsides: any;
  descriptions: any;
  activeImage: any;
  zoom = 1.0;

  facsUrl = '';
  facsimilePagesInfinite = false;
  backside = false;
  facsPage: any;
  facsNumber = 0;
  manualPageNumber = 1;
  showAboutHelp = true;

  constructor(public viewCtrl: ViewController,
              public navCtrl: NavController,
              public navParams: NavParams,
              private events: Events,
              private userSettingsService: UserSettingsService) {
    this.manualPageNumber = 1;
  }

  cancel() {
    this.viewCtrl.dismiss(this.viewCtrl);
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  ionViewWillLoad() {
    if (this.navParams.get('facsimilePagesInfinite')) {
      this.facsimilePagesInfinite = true;
      this.facsUrl = this.navParams.get('facsUrl');
      this.facsNumber = this.navParams.get('facsNr');
    } else {
      this.images = this.navParams.get('images');
      try {
        this.backsides = this.navParams.get('backsides');
        console.log('backsides', this.backsides);
      } catch (e) {
        this.backsides = [];
      }
      try {
        this.descriptions = this.navParams.get('descriptions');
        console.log('descriptions', this.descriptions);
      } catch (e) {
        this.descriptions = [];
      }
      this.activeImage = this.navParams.get('activeImage');
      console.log(this.navParams);
    }
   }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FacsimileZoomPage');
  }

  previous() {
    if (this.facsimilePagesInfinite) {
      this.prevFacsimileUrl();
      this.manualPageNumber = Number(this.manualPageNumber) - 1;
      return;
    }

    this.activeImage = (this.activeImage - 1);
    this.manualPageNumber = Number(this.manualPageNumber) - 1;
    if (this.activeImage < 0) {
      this.activeImage = this.images.length - 1;
      this.manualPageNumber = this.images.length;
    }
    if ( this.manualPageNumber === 0 ) {
      this.manualPageNumber = 1;
    }
  }

  next() {
    if (this.facsimilePagesInfinite) {
      this.nextFacsimileUrl();
      this.manualPageNumber = Number(this.manualPageNumber) + 1;
      return;
    }

    this.activeImage = (this.activeImage + 1);
    this.manualPageNumber = Number(this.manualPageNumber) + 1;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
  }

  nextFacsimileUrl() {
    this.facsNumber++;
  }

  prevFacsimileUrl() {
    if (this.facsNumber === 1) {
      return;
    }
    this.facsNumber--;
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

  showAbout() {
    this.showAboutHelp = !this.showAboutHelp;
  }

  setPage( e ) {
    if ( this.manualPageNumber <= 0 ) {
      this.manualPageNumber = 1;
    }
    const pNumber = (this.manualPageNumber - 1);
    if (this.facsimilePagesInfinite) {
      this.facsNumber = pNumber;
      return;
    }
    this.activeImage = pNumber;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
  }

  handleSwipeEvent(event) {
    if ( event.direction === 2 ) {
      this.next();
    } else if ( event.direction === 4 ) {
      this.previous();
    }
  }

  backSide(url) {
    return url.replace('.jpg', 'B.jpg');
  }
}
