import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ElementRef, ViewChild, Output, EventEmitter, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { AlertController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';


/**
 * Generated class for the ManuscriptsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */

@Component({
  selector: 'variations',
  templateUrl: 'variations.html'
})
export class VariationsComponent {
  @Input() itemId: string;
  @Input() linkID?: string;
  @Input() matches?: Array<string>;
  @ViewChild('toolTip') toolTip: ElementRef;
  @Output() openNewVarView: EventEmitter<any> = new EventEmitter();

  text: any;
  selection: 0;
  variations: any;
  selectedVariation: any;
  selectedVariationName: string;
  errorMessage: string;
  normalized = true;
  varID: string;
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
    public translate: TranslateService,
    private analyticsService: AnalyticsService
  ) {
    this.text = '';
    this.selectedVariationName = '';
    this.variations = [];
    this.intervalTimerId = 0;
  }

  ngOnInit() {
    this.varID = this.itemId + '_var';
    this.setText();
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Variations', 'Variations', String(this.varID));
  }

  openNewVar( event: Event, id: any ) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'variations';
    this.openNewVarView.emit(id);
  }

  setText() {
    this.storage.get(this.varID).then((variations) => {
      if (variations) {
        this.getCacheText(this.varID);
      } else {
        this.getVariation();
      }
      this.doAnalytics();
    });
  }

  getVariation() {
    this.textService.getVariations(this.itemId).subscribe(
      res => {
        this.textLoading = false;
        // in order to get id attributes for tooltips
        console.log('recieved variations ,..,', res);
        this.variations = res.variations;
        this.setVariation();
      },
      error =>  { this.errorMessage = <any>error; this.textLoading = false; }
    );
  }

  setVariation() {
    const inputFilename = this.linkID + '.xml'
    const inputVariation = this.variations.filter(function(item) {
      return (item.id + '' === this.linkID + '' || item.legacy_id + '' === this.linkID + '');
    }.bind(this))[0];
    if (this.linkID && this.linkID !== undefined && inputVariation !== undefined ) {
      this.selectedVariation = inputVariation;
    } else {
      this.selectedVariation = this.variations[0];
    }
    this.changeVariation();
  }

  getCacheText(id: string) {
    this.storage.get(id).then((variations) => {
      this.textLoading = false;
      this.variations = this.variations;
      this.setVariation();
    });
  }

  changeVariation( variation?: any ) {
    if ( variation ) {
      this.selectedVariation = variation;
    }
    this.selectedVariationName = this.selectedVariation.name;
    if (this.selectedVariation && this.selectedVariation.content !== undefined) {
      this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedVariation.content.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiVariant $1\"')
      );
    }
  }

  selectVariation() {
    let varTranslations = null;
    this.translate.get('Read.Variations').subscribe(
      translation => {
        varTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: varTranslations.chooseVariationTitle,
      subTitle: varTranslations.changeVariationSubtitle,
      cssClass: 'select-variant-alert'
    });

    this.variations.forEach((variation, index) => {
      let checkedValue = false;

      if (this.selectedVariation.id === variation.id) {
        checkedValue = true;
      }

      alert.addInput({
          type: 'radio',
          label: variation.name,
          value: index,
          checked: checkedValue
      });
    });

    alert.addButton('Avbryt');
    alert.addButton({
      text: 'Ok',
      handler: (index: any) => {
        this.changeVariation(this.variations[parseInt(index)]);
      }
    });

    alert.present();
  }

  selectVariationForNewView() {
    let varTranslations = null;
    this.translate.get('Read.Variations').subscribe(
      translation => {
        varTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: varTranslations.chooseVariationTitle,
      subTitle: varTranslations.openNewVariationSubtitle,
      cssClass: 'select-variant-alert'
    });

    this.variations.forEach((variation, index) => {
      alert.addInput({
          type: 'radio',
          label: variation.name,
          value: index
      });
    });

    alert.addButton('Avbryt');
    alert.addButton({
      text: 'Ok',
      handler: (index: any) => {
        this.openVariationInNewView(this.variations[parseInt(index)]);
      }
    });

    alert.present();
  }

  openVariationInNewView(variation?: any) {
    variation.viewType = 'variations';
    this.openNewVarView.emit(variation);
    this.scrollLastViewIntoView();
  }

  openAllVariations() {
    this.variations.forEach((variation) => {
      if (this.selectedVariation.id !== variation.id) {
        variation.viewType = 'variations';
        this.openNewVarView.emit(variation);
      }
    });
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
