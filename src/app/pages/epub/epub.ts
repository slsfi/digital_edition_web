import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

// @IonicPage({
//   name: 'epub',
//   segment: 'epub/:selectedFile'
// })
@Component({
  selector: 'page-epub',
  templateUrl: 'epub.html',
  styleUrls: ['epub.scss'],
})
export class EpubPage {

  public epubFileName: string = '';
  constructor(
    protected navCtrl: NavController,
    protected popoverCtrl: PopoverController,
    protected config: ConfigService,
    protected translate: TranslateService,
    protected events: EventsService,
    protected platform: Platform,
    private analyticsService: AnalyticsService,
    private userSettingsService: UserSettingsService,
    private route: ActivatedRoute,
  ) {
    // this.epubFileName = this.params.get('selectedFile');
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.epubFileName = params['selectedFile'];
    })
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Epub');
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'page-epub'});
    this.events.publishSelectedItemInMenu({
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
