import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../app/services/languages/language.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

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

  appName: string;
  appSubtitle: string;
  appMachineName: string;
  homeContent: string;
  homeFooterContent: string;
  errorMessage: string;
  initLanguage: string;

  collectionsToShow = [];

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
        this.getMdContent(lang + '-09'); // @TODO remove hardcoded thins
        this.getFooterMdContent(lang + '-06'); // @TODO remove hardcoded thins
      });
    });

    this.collectionsToShowConfig();
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
  }

  collectionsToShowConfig() {
    try {
      this.collectionsToShow = this.config.getSettings('MusicPage.collectionsToShow');
    } catch (e) {
      this.collectionsToShow = [];
    }
  }

  ionViewDidEnter() {
    (<any>window).ga('set', 'page', 'music');
    (<any>window).ga('send', 'pageview');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.getMdContent(lang + '-09'); // @TODO remove hardcoded thins
      this.getFooterMdContent(lang + '-06'); // @TODO remove hardcoded thins
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
