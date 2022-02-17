import { Component } from '@angular/core';
import { App, NavController, ViewController, NavParams, PopoverController, IonicPage, Events, Platform } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * Desktop version shows collection cover page.
 * Mobile version lists collection publications.
 * Also mobile version of collection cover page and introduction is accessed from this page.
 */

 @IonicPage({
  name: 'epub',
  segment: 'epub/:selectedFile'
})
@Component({
  selector: 'page-epub',
  templateUrl: 'epub.html',
})

export class EpubPage {

  public epubFileName: String = '';
  constructor(
    protected navCtrl: NavController,
    protected viewCtrl: ViewController,
    protected params: NavParams,
    protected popoverCtrl: PopoverController,
    protected config: ConfigService,
    protected translate: TranslateService,
    protected events: Events,
    protected platform: Platform,
    private analyticsService: AnalyticsService,
    private userSettingsService: UserSettingsService
  ) {

  }

  ionViewDidEnter() {
    this.epubFileName = this.params.get('selectedFile');
    this.analyticsService.doPageView('Epub');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
  }

  printContentClasses() {
    if (this.userSettingsService.isMobile() || this.userSettingsService.isTablet()) {
      return 'mobile-view-epub';
    } else {
      return '';
    }
  }

}
