import { Component } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ViewController, Events, NavParams } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { ReadPopoverService, Fontsize } from '../../app/services/settings/read-popover.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

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
      'normalisations': boolean,
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
      'normalisations': false,
      'abbreviations': false,
      'pageNumbering': false,
      'pageBreakOriginal': false,
      'pageBreakEdition': false
  };

  fontsize = null;
  togglesCounter: number;

  constructor(
    public viewCtrl: ViewController,
    private config: ConfigService,
    public readPopoverService: ReadPopoverService,
    public translate: TranslateService,
    private events: Events,
    public params: NavParams,
    private analyticsService: AnalyticsService
  ) {
    const toggles = this.params.get('toggles');
    this.readToggles = this.config.getSettings('settings.readToggles');

    if ( toggles !== undefined && toggles !== null && Object.keys(toggles).length !== 0 ) {
      this.readToggles = toggles;
    }

    console.log('readToggles: ', this.readToggles);

    this.togglesCounter = 0;
    for (const prop in this.readToggles) {
      if (this.readToggles.hasOwnProperty(prop)) {
        if (this.readToggles[prop] === true) {
          this.togglesCounter++;
        }
      }
    }

    this.show = readPopoverService.show;
    for (const prop in this.show) {
      if (this.show.hasOwnProperty(prop)) {
        if (this.readToggles[prop] === false) {
          this.show[prop] = false;
        }
      }
    }
    console.log('activated toggles: ', this.show);
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
      if (this.readToggles.comments) {
        this.show.comments = true;
      }
      if (this.readToggles.personInfo) {
        this.show.personInfo = true;
      }
      if (this.readToggles.placeInfo) {
        this.show.placeInfo = true;
      }
      if (this.readToggles.workInfo) {
        this.show.workInfo = true;
      }
      if (this.readToggles.changes) {
        this.show.changes = true;
      }
      if (this.readToggles.normalisations) {
        this.show.normalisations = true;
      }
      if (this.readToggles.abbreviations) {
        this.show.abbreviations = true;
      }
      if (this.readToggles.pageNumbering) {
        this.show.pageNumbering = true;
      }
      if (this.readToggles.pageBreakOriginal) {
        this.show.pageBreakOriginal = true;
      }
      if (this.readToggles.pageBreakEdition) {
        this.show.pageBreakEdition = true;
      }
    } else {
      this.show.comments = false;
      this.show.personInfo = false;
      this.show.placeInfo = false;
      this.show.workInfo = false;
      this.show.changes = false;
      this.show.normalisations = false;
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
    this.toggleNormalisations();
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

  toggleNormalisations() {
    this.readPopoverService.show.normalisations = this.show.normalisations;
    this.doAnalytics('toggleNormalisations - ' + this.show.normalisations);
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

  setFontSize(size: number) {
    if (size in Fontsize) {
      this.fontsize = size;
      this.readPopoverService.fontsize = this.fontsize;
      this.doAnalytics('setFontSize - ' + Fontsize[size]);
    }
  }

  doAnalytics(type) {
    this.analyticsService.doAnalyticsEvent('Read-Settings', 'Read-Settings - ' + type, String(type));
  }
}
