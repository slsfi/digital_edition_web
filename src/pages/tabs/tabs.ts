import { Component, ViewChild } from '@angular/core';
import { TranslateModule, LangChangeEvent, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { IonicPage, NavParams, Platform, Events, App, Tabs, NavController, Tab } from 'ionic-angular';

import { } from '../home/home.module';
import { } from '../content/content.module';
import { } from '../editions/editions.module';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * Tabs for mobile version.
 */

@IonicPage({
  segment: 'mobile'
})
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  @ViewChild('mobileTabs') mobileTabs: Tabs;
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root = 'HomePage';
  tab2Root = 'pages-list';
  tab3Root = 'about-mobile';

  language = 'sv';
  texts: any = {Home: '1', Read: '2', Info : '3'};

  constructor(
    navParams: NavParams,
    public translate: TranslateService,
    public platform: Platform,
    private events: Events,
    private app: App,
    public userSettingsService: UserSettingsService,
    public navCtrl: NavController
  ) {
    this.updateTexts()
    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.updateTexts();
    });
    this.events.publish('tabsLoaded');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  about() {
    const nav = this.app.getActiveNavs();
    if (this.userSettingsService.isMobile()) {
      nav[0].setRoot('about-mobile');
    } else {
      this.events.publish('topMenu:about');
    }
  }

  updateTexts() {
    this.translate.get('Tabs').subscribe(
      value => {
        this.texts = value;
      }
    )
  }
}
