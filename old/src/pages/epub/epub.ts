import { Component } from '@angular/core';
import { App, NavController, ViewController, NavParams, PopoverController, IonicPage, Events, Platform } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

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
    this.epubFileName = this.params.get('selectedFile');
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Epub');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'page-epub'});
    this.events.publish('SelectedItemInMenu', {
      menuID: this.epubFileName,
      component: 'page-epub'
    });
  }

  printContentClasses() {
    if (this.userSettingsService.isMobile() || this.userSettingsService.isTablet()) {
      return 'mobile-view-epub';
    } else {
      return '';
    }
  }

}
