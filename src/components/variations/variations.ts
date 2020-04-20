import { Component, Input, Renderer, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';


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
  errorMessage: string;
  normalized = true;
  varID: string;

  constructor(
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected storage: Storage,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private toastCtrl: ToastController
  ) {
    this.text = '';
    this.variations = [];
  }

  ngOnInit() {
    this.varID = this.itemId + '_var';
    this.setText();
  }

  doAnalytics() {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Variations',
        eventLabel: 'Variations',
        eventAction: this.varID,
        eventValue: 10
      });
    } catch ( e ) {
    }
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
          // in order to get id attributes for tooltips
          console.log('recieved variations ,..,', res);
          this.variations = res.variations;
          this.setVariation();
        },
      error =>  {this.errorMessage = <any>error}
    );
  }

  setVariation() {
    const inputFilename = this.linkID + '.xml'
    const inputVariation = this.variations.filter(function(item) {
      return (item.id === this.linkID || item.legacy_id === this.linkID);
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
      this.variations = this.variations;
      this.setVariation();
    });
  }

  changeVariation( variation?: any ) {
    if ( variation ) {
      this.selectedVariation = variation;
    }
    if (this.selectedVariation && this.selectedVariation.content !== undefined) {
      this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedVariation.content.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiVariant $1\"')
      );
    }
  }
}
