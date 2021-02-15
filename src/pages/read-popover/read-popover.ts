import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ViewController, Events, NavParams } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { ReadPopoverService, Fontsize } from '../../app/services/settings/read-popover.service';

/**
 * This is a popover accessed in ReadPage.
 * It lists different settings concerning reading publications in ReadPage.
 */

/*@IonicPage({
  name: 'read-popover-page'
})*/
@Component({
  selector: 'read-popover-page',
  templateUrl: 'read-popover.html'
})
export class ReadPopoverPage {
  readToggles: {
      'comments': boolean,
      'personInfo': boolean,
      'placeInfo': boolean,
      'workInfo': boolean,
      'changes': boolean,
      'abbreviations': boolean,
      'pageNumbering': boolean,
      'pageBreakOriginal': boolean,
      'pageBreakEdition': boolean
  };

  show = {
      'comments': false,
      'personInfo': false,
      'placeInfo': false,
      'workInfo': false,
      'changes': false,
      'abbreviations': false,
      'pageNumbering': false,
      'pageBreakOriginal': false,
      'pageBreakEdition': false
  };

  fontsize = null;

  constructor(
    public viewCtrl: ViewController,
    private config: ConfigService,
    public readPopoverService: ReadPopoverService,
    public translate: TranslateService,
    private events: Events,
    public params: NavParams
  ) {
    const toggles = this.params.get('toggles');
    this.readToggles = this.config.getSettings('settings.readToggles');

    if ( toggles !== undefined ) {
      this.readToggles = toggles;
    }

    this.show = readPopoverService.show;
    this.fontsize = readPopoverService.fontsize;
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

  toggleAll( e ) {
    if ( e.value === true ) {
      this.show.comments = true;
      this.show.personInfo = true;
      this.show.placeInfo = true;
      this.show.workInfo = true;
      this.show.changes = true;
      this.show.abbreviations = true;
      this.show.pageNumbering = true;
      this.show.pageBreakOriginal = true;
      this.show.pageBreakEdition = true;
    } else {
      this.show.comments = false;
      this.show.personInfo = false;
      this.show.placeInfo = false;
      this.show.workInfo = false;
      this.show.changes = false;
      this.show.abbreviations = false;
      this.show.pageNumbering = false;
      this.show.pageBreakOriginal = false;
      this.show.pageBreakEdition = false;
    }
    this.toggleComments();
    this.togglePersonInfo();
    this.togglePlaceInfo();
    this.toggleWorkInfo();
    this.toggleChanges();
    this.toggleAbbreviations();
    this.togglePageNumbering();
    this.togglePageBreakOriginal();
    this.togglePageBreakEdition();
  }

  toggleComments() {
    this.readPopoverService.show.comments = this.show.comments;
    this.doAnalytics('toggleComments - ' + this.show.comments);
  }

  togglePersonInfo() {
    this.readPopoverService.show.personInfo = this.show.personInfo;
    this.doAnalytics('togglePersonInfo - ' + this.show.personInfo);
  }

  togglePlaceInfo() {
    this.readPopoverService.show.placeInfo = this.show.placeInfo;
    this.doAnalytics('togglePlaceInfo - ' + this.show.placeInfo);
  }

  toggleWorkInfo() {
    this.readPopoverService.show.workInfo = this.show.workInfo;
    this.doAnalytics('toggleWorkInfo - ' + this.show.workInfo);
  }

  toggleChanges() {
    this.readPopoverService.show.changes = this.show.changes;
    this.doAnalytics('toggleChanges - ' + this.show.changes);
  }

  toggleAbbreviations() {
    this.readPopoverService.show.abbreviations = this.show.abbreviations;
    this.doAnalytics('toggleAbbreviations - ' + this.show.abbreviations);
  }

  togglePageNumbering() {
    this.readPopoverService.show.pageNumbering = this.show.pageNumbering;
    this.doAnalytics('togglePageNumbering - ' + this.show.pageNumbering);
  }

  togglePageBreakOriginal() {
    this.readPopoverService.show.pageBreakOriginal = this.show.pageBreakOriginal;
    this.doAnalytics('togglePageBreakOriginal - ' + this.show.pageBreakOriginal);
  }

  togglePageBreakEdition() {
    this.readPopoverService.show.pageBreakEdition = this.show.pageBreakEdition;
    this.doAnalytics('togglePageBreakEdition - ' + this.show.pageBreakEdition);
  }

  setFontSize(size: Fontsize) {
    this.fontsize = size;
    this.readPopoverService.fontsize = this.fontsize;
    this.doAnalytics('setFontSize - ' + this.fontsize);
  }

  decreaseFontSize() {
    try {
      this.fontsize = Fontsize.small;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('decreaseFontSize - ' + this.fontsize);
    } catch ( e ) {
      this.fontsize = 0;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('decreaseFontSize - ' + this.fontsize);
    }
  }

  increaseFontMeduimSize() {
    try {
      this.fontsize = Fontsize.medium;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('increaseFontMeduimSize - ' + this.fontsize);
    } catch ( e ) {
      this.fontsize = 1;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('increaseFontMeduimSize - ' + this.fontsize);
    }
  }

  increaseFontSize() {
    try {
      this.fontsize = Fontsize.large;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('increaseFontSize - ' + this.fontsize);
    } catch ( e ) {
      this.fontsize = 2;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('increaseFontSize - ' + this.fontsize);
    }
  }

  doAnalytics(type) {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Read-Settings',
        eventLabel: 'Read-Settings - ' + type,
        eventAction: type,
        eventValue: 10
      });
    } catch ( e ) {
    }
  }
}
