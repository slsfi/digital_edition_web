import { Component } from '@angular/core';
import { IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';
import { ReferenceDataModalPage } from '../../pages/reference-data-modal/reference-data-modal';

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
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private modalController: ModalController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SharePopoverPage');
    this.doAnalytics('click');
  }

  shareURI() {
    this.doAnalytics('URI');
    this.showReference();
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

  private showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference'});
    modal.present();
    modal.onDidDismiss(data => {
      console.log('dismissed', data);
    });
  }
}
