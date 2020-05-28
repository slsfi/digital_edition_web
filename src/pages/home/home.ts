import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NavController, IonicPage, Events, NavParams, Platform } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { Title } from '@angular/platform-browser';
import { TopMenuComponent } from '../components/top-menu/top-menu';
import { HtmlContentService } from '../../app/services/html/html-content.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * HomePage is the first page user sees.
 */

@IonicPage({
  segment: 'home'
})
@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})
export class HomePage {
  appName: string;
  appSubtitle: string;
  appMachineName: string;
  homeContent: string;
  homeFooterContent: string;
  errorMessage: string;
  initLanguage: string;

  constructor(
    public navCtrl: NavController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: Events,
    private mdContentService: MdContentService,
    private userSettingsService: UserSettingsService,
    private navParams: NavParams
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.userSettingsService.temporarilyHideSplitPane();

    this.events.subscribe('language:change', () => {
      this.languageService.getLanguage().subscribe((lang) => {
        this.getMdContent(lang + '-01');
        this.getFooterMdContent(lang + '-06');
      });
    });
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.events.publish('musicAccordion:reset', true);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.getMdContent(lang + '-01');
      this.getFooterMdContent(lang + '-06');
      this.appName = this.config.getSettings('app.name.' + lang);
      const subTitle = this.config.getSettings('app.subTitle1.' + lang);
      if ( subTitle !== '' ) {
        this.appSubtitle = '- ' + this.config.getSettings('app.subTitle1.' + lang) + ' -';
      } else {
        this.appSubtitle = '';
      }
      this.events.publish('title-logo:setTitle', this.config.getSettings('app.page-title.' + lang));
    });
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
