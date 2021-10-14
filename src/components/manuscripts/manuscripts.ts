import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { AlertController, ToastController, Events, ViewController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

/**
 * Generated class for the ManuscriptsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'manuscripts',
  templateUrl: 'manuscripts.html'
})
export class ManuscriptsComponent {
  @Input() itemId: string;
  @Input() linkID?: string;
  @Input() matches?: Array<string>;
  @Output() openNewManView: EventEmitter<any> = new EventEmitter();

  text: any;
  selection: 0;
  manuscripts: any;
  selectedManuscript: any;
  selectedManuscriptName: string;
  normalized = false;
  errorMessage: string;
  msID: string;
  chapter: string;
  textLoading: Boolean = true;
  intervalTimerId: number;

  constructor(
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected storage: Storage,
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private events: Events,
    public translate: TranslateService,
    public viewctrl: ViewController,
    private analyticsService: AnalyticsService
  ) {
    this.text = '';
    this.selectedManuscriptName = '';
    this.manuscripts = [];
    this.intervalTimerId = 0;
  }

  ngOnInit() {
    const parts = String(this.itemId).split('_')
    this.chapter = null;
    if ( parts[2] !== undefined ) {
      this.chapter = parts[2];
    }
    this.msID = this.itemId + '_ms';
    this.setText();
  }

  setText() {
    this.storage.get(this.msID).then((manuscripts) => {
      if (manuscripts) {
        this.getCacheText(this.msID);
      } else {
        this.getManuscript();
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
    this.scrollLastViewIntoView();
  }

  getManuscript() {
    this.textService.getManuscripts(this.itemId, this.chapter).subscribe(
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

    const inputManuscript = this.manuscripts.filter(function (item) {
      return (item.original_filename === inputFilename || item.id === this.linkID || item.legacy_id === this.linkID);
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
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedManuscript.manuscript_normalized.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiManuscript tei $1\"')
        );
      } else {
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedManuscript.manuscript_changes.replace(/images\//g, 'assets/images/')
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

  selectManuscript() {
    let msTranslations = null;
    this.translate.get('Read.Manuscripts').subscribe(
      translation => {
        msTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: msTranslations.SelectMsDialogTitle,
      subTitle: msTranslations.SelectMsDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.manuscripts.forEach((manuscript, index) => {
      let checkedValue = false;

      if (this.selectedManuscript.id === manuscript.id) {
        checkedValue = true;
      }

      alert.addInput({
          type: 'radio',
          label: manuscript.name,
          value: index,
          checked: checkedValue
      });
    });

    alert.addButton(buttonTranslations.Cancel);
    alert.addButton({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.changeManuscript(this.manuscripts[parseInt(index)]);
      }
    });

    alert.present();
  }

  /* This function scrolls the read-view horisontally to the last read column.
   * It's called after adding new views. */
  scrollLastViewIntoView() {
    this.ngZone.runOutsideAngular(() => {
      let interationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = setInterval(function() {
        if (interationsLeft < 1) {
          clearInterval(this.intervalTimerId);
        } else {
          interationsLeft -= 1;
          const viewElements = document.getElementsByClassName('read-column');
          if (viewElements[0] !== undefined) {
            const lastViewElement = viewElements[viewElements.length - 1] as HTMLElement;
            const scrollingContainer = document.querySelector('page-read > ion-content > div.scroll-content');
            if (scrollingContainer !== null) {
              const x = lastViewElement.getBoundingClientRect().right + scrollingContainer.scrollLeft -
              scrollingContainer.getBoundingClientRect().left;
              scrollingContainer.scrollTo({top: 0, left: x, behavior: 'smooth'});
              clearInterval(this.intervalTimerId);
            }
          }
        }
      }.bind(this), 500);
    });
  }

}
