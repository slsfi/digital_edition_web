import { LanguageService } from './../../app/services/languages/language.service';
import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';

@Component({
  selector: 'title-logo',
  templateUrl: 'title-logo.html'
})
export class TitleLogoComponent {

  public title: string;
  public subtitle: string;
  public siteLogoURL: string;
  constructor(
    private events: Events,
    private userSettingsService: UserSettingsService,
    private config: ConfigService,
    public languageService: LanguageService
  ) {
    try {
      this.siteLogoURL = this.config.getSettings('app.siteLogoURL');
    } catch ( e ) {
      this.siteLogoURL = 'https://www.sls.fi';
    }

    this.registerEventListeners();
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.title = this.config.getSettings('app.page-title.' + lang);
      this.subtitle = this.config.getSettings('app.page-title.' + lang);
    });
  }

  home() {

  }

  registerEventListeners() {
    this.events.subscribe('title-logo:setTitle', (title) => {
      this.title = title;
    });
    this.events.subscribe('title-logo:collectionTitle', (subTitle) => {
      this.subtitle = subTitle;
    });
  }
  ngOnDestroy() {
    this.events.unsubscribe('title-logo:setTitle');
    this.events.unsubscribe('title-logo:collectionTitle');
  }
}
