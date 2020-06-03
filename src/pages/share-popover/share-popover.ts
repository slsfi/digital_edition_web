import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the SharePopoverPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-share-popover',
  templateUrl: 'share-popover.html',
})
export class SharePopoverPage {
  showSocial = {
    facebook: true,
    email: true,
    twitter: true,
    instagram: false
  };
  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SharePopoverPage');
    this.doAnalytics('click');
  }

  shareURI() {
    this.doAnalytics('URI');
  }

  shareFacebook() {
    this.doAnalytics('FB');
  }

  shareTwitter() {
    this.doAnalytics('Twitter');
  }

  shareInstagram() {
    this.doAnalytics('Insta');
  }

  shareEmail() {
    this.doAnalytics('Email');
  }

  doAnalytics(type) {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Share-Popover',
        eventLabel: 'Share-Popover',
        eventAction: type,
        eventValue: 10
      });
    } catch ( e ) {
    }
  }
}
