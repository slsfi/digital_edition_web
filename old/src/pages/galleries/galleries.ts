import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Events } from 'ionic-angular';

/**
 * Generated class for the GalleriesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'galleries',
  segment: 'galleries'
})
@Component({
  selector: 'page-galleries',
  templateUrl: 'galleries.html',
})
export class GalleriesPage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: App,
    private events: Events
  ) {
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  openGalleryPage(galleryPage: string) {
    const nav = this.app.getActiveNavs();
    const params = {galleryPage: galleryPage, fetch: false};
    nav[0].push('image-gallery', params, {animate: false, direction: 'forward', animation: 'ios-transition'});
  }

}
