import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ViewController, Events } from 'ionic-angular';
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
    private events: Events
  ) {
    this.readToggles = this.config.getSettings('settings.readToggles');
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
      this.show.changes = true;
      this.show.abbreviations = true;
      this.show.pageNumbering = true;
      this.show.pageBreakOriginal = true;
      this.show.pageBreakEdition = true;
    } else {
      this.show.comments = false;
      this.show.personInfo = false;
      this.show.placeInfo = false;
      this.show.changes = false;
      this.show.abbreviations = false;
      this.show.pageNumbering = false;
      this.show.pageBreakOriginal = false;
      this.show.pageBreakEdition = false;
    }
    this.toggleComments();
    this.togglePersonInfo();
    this.togglePlaceInfo();
    this.toggleChanges();
    this.toggleAbbreviations();
    this.togglePageNumbering();
    this.togglePageBreakOriginal();
    this.togglePageBreakEdition();
  }

  toggleComments() {
    this.readPopoverService.show.comments = this.show.comments;
  }

  togglePersonInfo() {
    this.readPopoverService.show.personInfo = this.show.personInfo;
  }

  togglePlaceInfo() {
    this.readPopoverService.show.placeInfo = this.show.placeInfo;
  }

  toggleChanges() {
    this.readPopoverService.show.changes = this.show.changes;
  }

  toggleAbbreviations() {
    this.readPopoverService.show.abbreviations = this.show.abbreviations;
  }

  togglePageNumbering() {
    this.readPopoverService.show.pageNumbering = this.show.pageNumbering;
  }

  togglePageBreakOriginal() {
    this.readPopoverService.show.pageBreakOriginal = this.show.pageBreakOriginal;
  }

  togglePageBreakEdition() {
    this.readPopoverService.show.pageBreakEdition = this.show.pageBreakEdition;
  }

  decreaseFontSize() {
    this.fontsize = Fontsize.small;
    this.readPopoverService.fontsize = this.fontsize;
  }

  increaseFontMeduimSize() {
    this.fontsize = Fontsize.medium;
    this.readPopoverService.fontsize = this.fontsize;
  }

  increaseFontSize() {
    this.fontsize = Fontsize.large;
    this.readPopoverService.fontsize = this.fontsize;
  }
}
