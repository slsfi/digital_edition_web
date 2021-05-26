import { Component, HostListener } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
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

  images: any[] = [];
  backsides: any;
  descriptions: any;
  activeImage: any;
  zoom = 1.0;
  angle = 0;
  latestDeltaX = 0
  latestDeltaY = 0
  prevX = 0
  prevY = 0

  facsUrl = '';
  facsimilePagesInfinite = false;
  backside = false;
  facsSize: number;
  facsPage: any;
  facsNumber = 0;
  manualPageNumber = 1;
  showAboutHelp = true;

  constructor(public viewCtrl: ViewController,
              public navCtrl: NavController,
              public navParams: NavParams,
              private events: Events,
              private userSettingsService: UserSettingsService,
              private analyticsService: AnalyticsService) {
    this.manualPageNumber = 1;
    this.backsides = [];
  }

  rotate() {
    this.angle += 90;
    if ( this.angle >= 360 ) {
      this.angle = 0;
    }
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
    this.facsSize = this.navParams.get('facsSize');

    if (this.navParams.get('facsimilePagesInfinite')) {
      this.facsimilePagesInfinite = true;
      this.facsUrl = this.navParams.get('facsUrl');
      this.facsNumber = this.navParams.get('facsNr');
      this.doAnalytics(String(this.facsUrl) + String(this.facsNumber));
    } else {
      this.images = this.navParams.get('images');
      try {
        this.descriptions = this.navParams.get('descriptions');
        if (this.descriptions.length > 0) {
          this.descriptions.forEach(element => {
            element = element.trim();
            element = element.replace('&gt;', '>');
            element = element.replace('&lt;', '<');
          });
        }
      } catch (e) {
        this.descriptions = [];
      }
      this.activeImage = this.navParams.get('activeImage');
      this.manualPageNumber = this.activeImage;
      this.doAnalytics(String(this.images[this.activeImage]));
    }

    try {
      this.backsides = this.navParams.get('backsides');
      if ( this.backsides === undefined ) {
        this.backsides = [];
      }
    } catch (e) {
      this.backsides = [];
    }
   }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FacsimileZoomPage');
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Facsimile-zoom');
  }

  doAnalytics(name) {
    this.analyticsService.doAnalyticsEvent('Facsimile-zoom', 'Facsimile-zoom', String(name));
  }

  previous() {
    if (this.facsimilePagesInfinite) {
      console.log('Infinite, manualPageNumber = ', this.manualPageNumber);
      console.log('images.length: ', this.images.length);
      if (Number(this.manualPageNumber) > 1) {
        this.prevFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) - 1;
      } else {
        this.facsNumber = this.images.length;
        this.manualPageNumber = this.images.length;
      }
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
    this.doAnalytics(String(this.images[this.activeImage]));
  }

  next() {
    if (this.facsimilePagesInfinite) {
      if ( (Number(this.manualPageNumber) + 1) <= this.images.length ) {
        this.nextFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) + 1;
      } else {
        this.facsNumber = 1;
        this.manualPageNumber = 1;
      }
      return;
    }

    this.activeImage = (this.activeImage + 1);
    this.manualPageNumber = Number(this.manualPageNumber) + 1;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
    this.doAnalytics(String(this.images[this.activeImage]));
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
    if (this.manualPageNumber < 1) {
      this.manualPageNumber = 1;
    } else if (this.manualPageNumber > this.images.length) {
      this.manualPageNumber = this.images.length;
    }
    const pNumber: number = (this.manualPageNumber - 1);
    if (this.facsimilePagesInfinite) {
      this.facsNumber = this.manualPageNumber;
      return;
    }
    this.activeImage = pNumber;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
    this.doAnalytics(String(this.images[this.activeImage]));
  }

  backSide(url) {
    return url.replace('.jpg', 'B.jpg');
  }

  handlePanEvent(event) {
    const img = event.target;
    // Store latest zoom adjusted delta.
    // NOTE: img must have touch-action: none !important;
    // otherwise deltaX and deltaY will give wrong values on mobile.
    this.latestDeltaX = event.deltaX / this.zoom
    this.latestDeltaY = event.deltaY / this.zoom

    // Get current position from last position and delta.
    let x = this.prevX + this.latestDeltaX
    let y = this.prevY + this.latestDeltaY

    if (this.angle === 90) {
      const tmp = x;
      x = y;
      y = tmp;
      y = y * -1;
    } else if (this.angle === 180) {
      y = y * -1;
      x = x * -1;
    } else if (this.angle === 270) {
      const tmp = x;
      x = y;
      y = tmp;
      x = x * -1;
    }

    if (img !== null) {
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + x + 'px, ' + y + 'px, 0px)';
    }
  }

  onMouseUp(e) {
    // Update the previous position on desktop by adding the latest delta.
    this.prevX += this.latestDeltaX
    this.prevY += this.latestDeltaY
  }

  onMouseWheel(e) {
    const img = e.target;
    if (e.deltaY > 0) {
      this.zoomIn();
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' +
        this.prevY + 'px, 0px)';
    } else {
      this.zoomOut();
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' +
        this.prevY + 'px, 0px)';
    }
  }
}
