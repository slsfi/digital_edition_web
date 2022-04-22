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
  @Input() sortOrder?: number;
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
    this.varID = '';
    this.intervalTimerId = 0;
  }

  ngOnInit() {
    this.varID = this.itemId.split(';')[0] + '_var';
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

    const inputVariation = this.variations.filter(function(item) {
      return (item.id + '' === this.linkID + '' || item.legacy_id + '' === this.linkID + '');
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
    if (this.selectedVariation && this.selectedVariation.content !== undefined) {
      this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedVariation.content.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiVariant tei $1\"')
      );
    }
  }

  selectVariation(event: any) {
    let varTranslations = null;
    this.translate.get('Read.Variations').subscribe(
      translation => {
        varTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: varTranslations.SelectVariationDialogTitle,
      subTitle: varTranslations.SelectVariationDialogSubtitle,
      cssClass: 'select-text-alert'
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

    alert.addButton(buttonTranslations.Cancel);
    alert.addButton({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.changeVariation(this.variations[parseInt(index)]);
        this.sortOrder = parseInt(index);
        this.updateVariationSortOrderInService(event);
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

    let buttonTranslations = null;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: varTranslations.OpenNewVariationDialogTitle,
      subTitle: varTranslations.OpenNewVariationDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.variations.forEach((variation, index) => {
      alert.addInput({
          type: 'radio',
          label: variation.name,
          value: index
      });
    });

    alert.addButton(buttonTranslations.Cancel);
    alert.addButton({
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
        const varElemColumnIds = [];
        const columnElems = Array.from(document.querySelectorAll('div.read-column'));
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
          if (currentVarElemIndex !== undefined) {
            this.textService.variationsOrder[currentVarElemIndex] = this.sortOrder;
          }
        }
      }
    }
  }

  /**
   * This function scrolls the read-view horisontally to the last read column.
   * It's called after adding new views.
   * */
  scrollLastViewIntoView() {
    this.ngZone.runOutsideAngular(() => {
      let interationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = window.setInterval(function() {
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
