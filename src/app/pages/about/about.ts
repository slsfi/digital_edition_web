import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';

/**
 * A page with information concerning: Topelius, this application etc.
 * Uses static-pages-toc-drilldown-menu component for listing pages.
 */

// @IonicPage({
//   name: 'about-mobile',
//   segment: 'about'
// })
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
  styleUrls: ['about.scss']
})
export class AboutPage {
  aboutPages: any;
  language = 'sv';
  languages = [];
  appName?: string;
  enableLanguageChanges: false;
  aboutMenuId = '';

  constructor(
    public navCtrl: NavController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: EventsService,
    private analyticsService: AnalyticsService
  ) {
    this.aboutPages = this.config.getSettings('staticPages.about');
    this.enableLanguageChanges = this.config.getSettings('i18n.enableLanguageChanges');
    this.languages = this.config.getSettings('i18n.languages');

    this.language = this.config.getSettings('i18n.locale');
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.appName = this.config.getSettings('app.name.' + lang);
    });
  }

  ngOnInit() {
    this.events.publishPageLoadedAbout({'title': 'About'});
    const staticPagesMenus = this.config.getSettings('StaticPagesMenus');
    const aboutMenu = staticPagesMenus.find((sp: any) => sp.menuID === 'aboutMenu');
    this.aboutMenuId = aboutMenu.idNumber;
  }
  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem(this.constructor.name);
    this.events.publishMusicAccordionReset(this.constructor.name);
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('About');
  }

  changeLanguage() {
    this.translate.use(this.language);
  }

}
