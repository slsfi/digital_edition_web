import { Component } from '@angular/core';
import { Events, IonicPage, ModalController, NavController, NavParams, ViewController } from 'ionic-angular';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
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
    public events: Events,
    public viewCtrl: ViewController,
    private modalController: ModalController,
    private analyticsService: AnalyticsService) {
  }

  ionViewDidLoad() {
    this.doAnalytics('click');
    this.events.subscribe('share:dismiss', (page) => {
      this.dismiss();
    });
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
    this.analyticsService.doAnalyticsEvent('Share-Popover', 'Share-Popover', String(type));
  }

  private showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
