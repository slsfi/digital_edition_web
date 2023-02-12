import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ElementRef, ViewChild, Output, EventEmitter, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { TextService } from 'src/app/services/texts/text.service';
import { AlertButton, AlertController, AlertInput, ToastController } from '@ionic/angular';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { StorageService } from 'src/app/services/storage/storage.service';


/**
 * Generated class for the ManuscriptsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */

@Component({
  selector: 'variations',
  templateUrl: 'variations.html',
  styleUrls: ['variations.scss']
})
export class VariationsComponent {
  @Input() itemId?: string;
  @Input() linkID?: string;
  @Input() matches?: Array<string>;
  @Input() sortOrder?: number;
  @ViewChild('toolTip') toolTip?: ElementRef;
  @Output() openNewVarView: EventEmitter<any> = new EventEmitter();
  @Output() openNewLegendView: EventEmitter<any> = new EventEmitter();

  text: any;
  selection?: 0;
  variations: any;
  selectedVariation: any;
  selectedVariationName: string;
  errorMessage?: string;
  normalized = true;
  varID: string;
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
    public translate: TranslateService,
    private analyticsService: AnalyticsService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.text = '';
    this.selectedVariationName = '';
    this.variations = [];
    this.varID = '';

    try {
      this.showOpenLegendButton = this.config.getSettings('showOpenLegendButton.variations');
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
    this.varID = this.itemId?.split(';')[0] + '_var';
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
    if (this.textService.varIdsInStorage.includes(this.varID)) {
      this.storage.get(this.varID).then((variations) => {
        if (variations) {
          this.textLoading = false;
          this.variations = variations;
          this.setVariation();
          console.log('Retrieved variations from cache');
        } else {
          console.log('Failed to retrieve variations from cache');
          this.textService.varIdsInStorage.splice(this.textService.varIdsInStorage.indexOf(this.varID), 1);
          this.getVariation();
        }
      });
    } else {
      this.getVariation();
    }
    this.doAnalytics();
  }

  getVariation() {
    if (!this.itemId) {
      return;
    }
    this.textService.getVariations(this.itemId).subscribe(
      res => {
        this.textLoading = false;
        // in order to get id attributes for tooltips
        this.variations = res.variations;
        if (this.variations.length > 0) {
          console.log('recieved variations ,..,');
          if (!this.textService.varIdsInStorage.includes(this.varID)) {
            this.textService.varIdsInStorage.push(this.varID);
            this.storage.set(this.varID, this.variations);
          }
          this.setVariation();
        } else {
          console.log('no variations');
          this.translate.get('Read.Variations.NoVariations').subscribe(
            translation => {
              this.text = translation;
            }, error => {
              console.error(error);
              this.text = 'Inga varianter';
            }
          );
        }
      },
      err =>  {
        this.errorMessage = <any>err;
        console.error(err);
        this.textLoading = false;
      }
    );
  }

  setVariation() {
    const inputFilename = this.linkID + '.xml';

    const that = this;
    const inputVariation = this.variations.filter(function(item: any) {
      return (item.id + '' === that.linkID + '' || item.legacy_id + '' === that.linkID + '');
    }.bind(this))[0];

    if (this.linkID && this.linkID !== undefined && inputVariation !== undefined ) {
      this.selectedVariation = inputVariation;
      this.sortOrder = inputVariation.sort_order - 1;
    } else {
      if (this.sortOrder && this.variations[this.sortOrder] !== undefined) {
        this.selectedVariation = this.variations[this.sortOrder];
      } else {
        this.selectedVariation = this.variations[0];
        this.sortOrder = 0;
      }
    }
    this.changeVariation();
  }

  changeVariation( variation?: any ) {
    if (variation) {
      this.selectedVariation = variation;
    }
    this.selectedVariationName = this.selectedVariation.name;
    if (this.selectedVariation && this.selectedVariation.content !== undefined && this.matches) {
      this.text = this.commonFunctions.insertSearchMatchTags(this.selectedVariation.content, this.matches);
      this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.text.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiVariant tei $1\"')
      );
    }
  }

  async selectVariation(event: any) {
    let varTranslations = null as any;
    const inputs = [] as AlertInput[];
    const buttons = [] as AlertButton[];
    this.translate.get('Read.Variations').subscribe(
      translation => {
        varTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null as any;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = await this.alertCtrl.create({
      header: varTranslations.SelectVariationDialogTitle,
      subHeader: varTranslations.SelectVariationDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.variations.forEach((variation: any, index: any) => {
      let checkedValue = false;

      if (this.selectedVariation.id === variation.id) {
        checkedValue = true;
      }

      inputs.push({
        type: 'radio',
        label: variation.name,
        value: index,
        checked: checkedValue
      });
    });

    buttons.push(buttonTranslations.Cancel);
    buttons.push({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.changeVariation(this.variations[parseInt(index)]);
        this.sortOrder = parseInt(index);
        this.updateVariationSortOrderInService(event);
      }
    });

    alert.buttons = buttons;
    alert.inputs = inputs;
    

    alert.present();
  }

  async selectVariationForNewView() {
    let varTranslations = null as any;
    const inputs = [] as AlertInput[];
    const buttons = [] as AlertButton[];
    this.translate.get('Read.Variations').subscribe(
      translation => {
        varTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null as any;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = await this.alertCtrl.create({
      header: varTranslations.OpenNewVariationDialogTitle,
      subHeader: varTranslations.OpenNewVariationDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.variations.forEach((variation: any, index: any) => {
      inputs.push({
          type: 'radio',
          label: variation.name,
          value: index
      });
    });

    buttons.push(buttonTranslations.Cancel);
    buttons.push({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.openVariationInNewView(this.variations[parseInt(index)]);
      }
    });

    alert.present();
  }

  openVariationInNewView(variation?: any) {
    variation.viewType = 'variations';
    this.textService.variationsOrder.push(variation.sort_order - 1);
    this.openNewVarView.emit(variation);
    this.commonFunctions.scrollLastViewIntoView();
  }

  openAllVariations() {
    this.variations.forEach((variation: any) => {
      if (this.selectedVariation.id !== variation.id) {
        variation.viewType = 'variations';
        this.openNewVarView.emit(variation);
      }
    });
  }

  openNewLegend(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const id = {
      viewType: 'legend',
      id: 'var-legend'
    }
    this.openNewLegendView.emit(id);
    this.commonFunctions.scrollLastViewIntoView();
  }

  /**
   * Store the sort order of the selected variation in this variations column to textService.
   * @param event Event triggered when pressing the change variation button in this variations column.
   * */
  updateVariationSortOrderInService(event: any) {
    if (event.target) {
      let currentVarElemContainer = event.target as HTMLElement;
      while (currentVarElemContainer !== null
        && !currentVarElemContainer.classList.contains('read-column')
        && currentVarElemContainer.parentElement !== null) {
          currentVarElemContainer = currentVarElemContainer.parentElement;
      }
      if (currentVarElemContainer !== null) {
        const varElemColumnIds = [] as any;
        const columnElems = Array.from(document.querySelectorAll('page-read:not([hidden]) div.read-column'));
        if (columnElems) {
          columnElems.forEach(function(columnElem) {
            const varElem = columnElem.querySelector('variations');
            if (varElem && columnElem.id) {
              varElemColumnIds.push(columnElem.id);
            }
          });
          let currentVarElemIndex = undefined;
          for (let k = 0; k < varElemColumnIds.length; k++) {
            if (varElemColumnIds[k] === currentVarElemContainer.id) {
              currentVarElemIndex = k;
              break;
            }
          }
          if (currentVarElemIndex !== undefined && this.sortOrder) {
            this.textService.variationsOrder[currentVarElemIndex] = this.sortOrder;
          }
        }
      }
    }
  }

}
