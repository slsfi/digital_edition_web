import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ViewController, Events } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { LanguageService } from '../../app/services/languages/language.service';

/**
 * Popover with list of available user settings.
 * Settings: view mode, language.
 */

/*@IonicPage({
  name: 'user-settings-popover-page'
})*/
@Component({
  selector: 'user-settings-popover-page',
  templateUrl: 'user-settings-popover.html'
})
export class UserSettingsPopoverPage {
  readToggles: {
      'comments': boolean,
      'personInfo': boolean,
      'placeInfo': boolean,
      'changes': boolean,
      'abbreviations': boolean,
      'pageNumbering': boolean
  };

  show = {
      'comments': false,
      'personInfo': false,
      'placeInfo': false,
      'changes': false,
      'abbreviations': false,
      'pageNumbering': false
  };

  enableLanguageChanges = true;
  fontsize = null;
  language: string;
  constructor(
    public viewCtrl: ViewController,
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    public languageService: LanguageService,
    private events: Events
  ) {
    this.readToggles = this.config.getSettings('settings.readToggles');
    this.enableLanguageChanges = this.config.getSettings('i18n.enableLanguageChanges');
    // this.show = readPopoverService.show;
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  close() {
    this.viewCtrl.dismiss();
  }

  toggleComments() {
    // this.readPopoverService.show.comments = this.show.comments;
  }

  togglePersonInfo() {
    // this.readPopoverService.show.personInfo = this.show.personInfo;
  }

  toggleAbbreviations() {
    // this.readPopoverService.show.abbreviations = this.show.abbreviations;
  }

  togglePageNumbering() {
    // git this.readPopoverService.show.pageNumbering = this.show.pageNumbering;
  }


}
