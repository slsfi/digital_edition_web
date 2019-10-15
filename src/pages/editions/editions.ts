import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, IonicPage, Events, Platform } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { MdContentService } from '../../app/services/md/md-content.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * List of collections.
 */

@IonicPage({
  segment: 'publications'
})
@Component({
  selector: 'editions-page',
  templateUrl: 'editions.html'
})
export class EditionsPage {
  selectedItem: any;
  appName: string;
  readContent: string;
  errorMessage: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private config: ConfigService,
    private mdContentService: MdContentService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: Events,
    private userSettingsService: UserSettingsService,
    public platform: Platform
  ) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.events.publish('musicAccordion:reset', true);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.getMdContent(lang + '-02');
      this.appName = this.config.getSettings('app.name.' + lang);
      this.events.publish('title-logo:setTitle', this.config.getSettings('app.page-title.' + lang));
      this.events.publish('title-logo:setSubTitle', 'Digitala verk');
    });
    console.log('ion will enter.... in editions... ..');
    this.events.publish('pageLoaded:collections', {'title': 'Editions'});
  }

  getMdContent(fileID: string) {
    // console.log('calling getMdContent from editions.ts');
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {this.readContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }
}
