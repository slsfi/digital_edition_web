import { Component } from '@angular/core';

import { ModalController } from '@ionic/angular';
import { EventsService } from 'src/app/services/events/events.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { LanguageService } from 'src/app/services/languages/language.service';

/**
 * Popover with list of available user settings.
 * Settings: view mode, language.
 */

/*@IonicPage({
  name: 'user-settings-popover-page'
})*/
@Component({
  selector: 'user-settings-popover-page',
  templateUrl: 'user-settings-popover.html',
  styleUrls: ['user-settings-popover.scss']
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
  language?: string;
  constructor(
    public viewCtrl: ModalController,
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    public languageService: LanguageService,
    private events: EventsService
  ) {
    this.readToggles = this.config.getSettings('settings.readToggles') as any;
    this.enableLanguageChanges = this.config.getSettings('i18n.enableLanguageChanges') as any;
    // this.show = readPopoverService.show;
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
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
