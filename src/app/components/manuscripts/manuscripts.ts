import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { TextService } from 'src/app/services/texts/text.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { AlertButton, AlertController, AlertInput, ToastController } from '@ionic/angular';
import { EventsService } from 'src/app/services/events/events.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';

/**
 * Generated class for the ManuscriptsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'manuscripts',
  templateUrl: 'manuscripts.html',
  styleUrls: ['manuscripts.scss']
})
export class ManuscriptsComponent {
  @Input() itemId?: string;
  @Input() linkID?: string;
  @Input() matches?: Array<string>;
  @Output() openNewManView: EventEmitter<any> = new EventEmitter();
  @Output() openNewLegendView: EventEmitter<any> = new EventEmitter();

  text: any;
  selection?: 0;
  manuscripts: any;
  selectedManuscript: any;
  selectedManuscriptName: string;
  normalized = false;
  errorMessage?: string;
  msID?: string;
  chapter?: string | null;
  legendTitle?: string;
  textLoading: Boolean = true;
  showOpenLegendButton: Boolean = false;

  constructor(
    private config: ConfigService,
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected storage: StorageService,
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private events: EventsService,
    public translate: TranslateService,
    private analyticsService: AnalyticsService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.text = '';
    this.selectedManuscriptName = '';
    this.manuscripts = [];

    try {
      this.showOpenLegendButton = this.config.getSettings('showOpenLegendButton.manuscripts');
    } catch (e) {
      this.showOpenLegendButton = false;
    }

    this.translate.get('Read.Legend.Title').subscribe(
      translation => {
        this.legendTitle = translation;
      },
      translationError => {
        this.legendTitle = '';
      }
    );
  }

  ngOnInit() {
    const parts = String(this.itemId).split('_');
    this.chapter = null;
    if ( parts[2] !== undefined ) {
      this.chapter = parts[2];
    }
    this.msID = this.itemId + '_ms';
    this.setText(this.msID);
  }

  setText(id: string) {
    this.storage.get(id).then((manuscripts) => {
      if (manuscripts) {
        this.getCacheText(id);
      } else {
        this.getManuscript(id);
      }
      this.doAnalytics();
    });
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Manuscripts', 'Manuscripts', String(this.msID));
  }

  openNewMan(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'manuscripts';
    this.openNewManView.emit(id);
  }

  openFacsimileMan(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'manuscriptFacsimile';
    this.openNewManView.emit(id);
    this.commonFunctions.scrollLastViewIntoView();
  }

  openNewLegend(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const id = {
      viewType: 'legend',
      id: 'ms-legend'
    }
    this.openNewLegendView.emit(id);
    this.commonFunctions.scrollLastViewIntoView();
  }

  getManuscript(id: string) {
    this.textService.getManuscripts(id, this.chapter ? this.chapter : undefined).subscribe(
      res => {
        this.textLoading = false;
        // in order to get id attributes for tooltips
        this.manuscripts = res.manuscripts;
        if (this.manuscripts.length > 0) {
          console.log('recieved manuscripts ,..,');
          this.setManuscript();
        } else {
          console.log('no manuscripts');
          this.translate.get('Read.Manuscripts.NoManuscripts').subscribe(
            translation => {
              this.text = translation;
            }, error => {
              console.error(error);
              this.text = 'Inga manuskript';
            }
          );
        }
      },
      err => {
        this.errorMessage = <any>err;
        console.error(err);
        this.textLoading = false;
      }
    );
  }

  setManuscript() {
    const inputFilename = this.linkID + '.xml';
    const that = this;
    const inputManuscript = this.manuscripts.filter(function (item: any) {
      return (item.original_filename === inputFilename || item.id === that.linkID || item.legacy_id === that.linkID);
    }.bind(this))[0];

    if (this.linkID && this.linkID !== undefined && inputManuscript !== undefined) {
      this.selectedManuscript = inputManuscript;
    } else {
      console.log('no link id setting 0 to first');
      this.selectedManuscript = this.manuscripts[0];
    }
    this.changeManuscript();
  }

  changeManuscript(manuscript?: any) {
    if (manuscript) {
      this.selectedManuscript = manuscript;
    }
    this.selectedManuscriptName = this.selectedManuscript.name;
    if (this.selectedManuscript && this.selectedManuscript.manuscript_normalized !== undefined) {
      if (this.normalized) {
        this.text = this.commonFunctions.insertSearchMatchTags(this.selectedManuscript.manuscript_normalized, (this.matches || []));
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.text.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiManuscript tei $1\"')
        );
      } else {
        this.text = this.commonFunctions.insertSearchMatchTags(this.selectedManuscript.manuscript_changes, (this.matches || []));
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.text.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiManuscript tei $1\"')
        );
      }
    }
  }

  getCacheText(id: string) {
    this.storage.get(id).then((manuscripts) => {
      this.textLoading = false;
      this.manuscripts = manuscripts;
      this.setManuscript();
    });
  }

  async selectManuscript() {
    let msTranslations = null as any;
    const inputs = [] as AlertInput[];
    const buttons = [] as AlertButton[];
    this.translate.get('Read.Manuscripts').subscribe(
      translation => {
        msTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null as any;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = await this.alertCtrl.create({
      header: msTranslations.SelectMsDialogTitle,
      subHeader: msTranslations.SelectMsDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.manuscripts.forEach((manuscript: any, index: any) => {
      let checkedValue = false;

      if (this.selectedManuscript.id === manuscript.id) {
        checkedValue = true;
      }

      alert.inputs.push({
        type: 'radio',
        label: manuscript.name,
        value: index,
        checked: checkedValue
      });
    });

    alert.buttons.push(buttonTranslations.Cancel);
    alert.buttons.push({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.changeManuscript(this.manuscripts[parseInt(index)]);
      }
    });
    
    alert.inputs = inputs;
    alert.buttons = buttons;

    alert.present();
  }

}
