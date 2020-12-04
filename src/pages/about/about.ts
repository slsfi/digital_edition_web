import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { App, NavController, IonicPage, Events, ViewController } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';

import {  } from '../../pages/content/content';
import { LanguageService } from '../../app/services/languages/language.service';

/**
 * A page with information concerning: Topelius, this application etc.
 * Uses static-pages-toc-drilldown-menu component for listing pages.
 */

@IonicPage({
  name: 'about-mobile',
  segment: 'about'
})
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  aboutPages: any;
  language = 'sv';
  languages = [];
  appName: string;
  enableLanguageChanges: false;
  aboutMenuId = '';

  constructor(
    private app: App,
    public navCtrl: NavController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private viewctrl: ViewController,
    private events: Events
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

  ionViewDidLoad() {
    this.events.publish('pageLoaded:about', {'title': 'About'});
    const staticPagesMenus = this.config.getSettings('StaticPagesMenus');
    const aboutMenu = staticPagesMenus.find(sp => sp.menuID === 'aboutMenu');
    this.aboutMenuId = aboutMenu.idNumber;
  }
  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.events.publish('musicAccordion:reset', true);
  }

  ionViewDidEnter() {
    (<any>window).ga('set', 'page', 'About');
    (<any>window).ga('send', 'pageview');
  }

  changeLanguage() {
    this.translate.use(this.language);
  }

}
