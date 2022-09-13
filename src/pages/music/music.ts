import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../app/services/languages/language.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { Subscription } from 'rxjs/Subscription';

/**
 * Generated class for the MusicPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'music',
  segment: 'music'
})
@Component({
  selector: 'page-music',
  templateUrl: 'music.html',
})
export class MusicPage {

  appMachineName: string;
  homeContent: string;
  homeFooterContent: string;
  errorMessage: string;
  initLanguage: string;
  languageSubscription: Subscription;

  collectionsToShow = [];

  constructor(
    public navCtrl: NavController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: Events,
    private mdContentService: MdContentService,
    private userSettingsService: UserSettingsService,
    private navParams: NavParams,
    private analyticsService: AnalyticsService
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.userSettingsService.temporarilyHideSplitPane();

    try {
      this.collectionsToShow = this.config.getSettings('MusicPage.collectionsToShow');
    } catch (e) {
      this.collectionsToShow = [];
    }
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('music');
  }

  ionViewDidLoad() {
    this.languageSubscription = this.languageService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadContent(lang);
      } else {
        this.languageService.getLanguage().subscribe(language => {
          this.loadContent(language);
        });
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadContent(lang: string) {
    this.getMdContent(lang + '-09'); // @TODO remove hardcoded thins
    this.getFooterMdContent(lang + '-06'); // @TODO remove hardcoded thins
    this.events.publish('title-logo:setTitle', this.config.getSettings('app.page-title.' + lang));
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {this.homeContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }

  getFooterMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {this.homeFooterContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }

}
