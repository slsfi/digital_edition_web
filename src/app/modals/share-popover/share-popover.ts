import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { EventsService } from 'src/app/services/events/events.service';
import { ReferenceDataModalPage } from '../reference-data-modal/reference-data-modal';

/**
 * Generated class for the SharePopoverPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-share-popover',
  templateUrl: './share-popover.html',
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
    public events: EventsService,
    public viewCtrl: ModalController,
    private modalController: ModalController,
    private analyticsService: AnalyticsService) {
  }

  ionViewDidLoad() {
    this.doAnalytics('click');
    this.events.getShareDismiss().subscribe((page) => {
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

  doAnalytics(type: any) {
    this.analyticsService.doAnalyticsEvent('Share-Popover', 'Share-Popover', String(type));
  }

  private async showReference() {
    // Get URL of Page and then the URI
    const modal = await this.modalController.create({component: ReferenceDataModalPage, id: document.URL, componentProps: {type: 'reference', origin: 'share-popover'}});
    modal.present();
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
