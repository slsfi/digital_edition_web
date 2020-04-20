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
  showToolTip: boolean;
  toolTipPosition: object;
  toolTipText: string;

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
    this.toolTipText = '';
    this.variations = [];
    this.toolTipPosition = {top: 40 + 'px', left: 100 + 'px'};
  }

  ngOnInit() {
    this.varID = this.itemId + '_var';
    this.showToolTip = false;
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

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      if (event.target.classList.contains('variantScrollTarget') && this.readPopoverService.show.comments ) {
        if (event.target !== undefined) {
          event.target.style.fontWeight = 'bold';
          this.showTooltip(event);
          this.scrollToElement(event.target);
        }
        setTimeout(function() {
          if (event.target !== undefined) {
            event.target.style.fontWeight = 'normal';
          }
        }, 1000);
      }
      if (event.target.classList.contains('tooltiptrigger') && this.readPopoverService.show.comments ) {
        if (event.target !== undefined) {
          event.target.style.fontWeight = 'bold';
        }
        setTimeout(function() {
          if (event.target !== undefined) {
            event.target.style.fontWeight = 'normal';
          }
        }, 1000);
      }
    });
    this.renderer.listen(this.elementRef.nativeElement, 'mouseover', (event) => {
      if (event.target.classList.contains('tooltiptrigger') && this.readPopoverService.show.comments ) {
        if (event.target !== undefined) {
          event.target.style.fontWeight = 'bold';
          this.showTooltip(event);
        }
        setTimeout(function() {
          if (event.target !== undefined) {
            event.target.style.fontWeight = 'normal';
          }
        }, 1000);
      }
    });
  }

  private scrollToElement(element: HTMLElement) {
    element.scrollIntoView();
    try {
      const elems: NodeListOf<HTMLSpanElement> = document.querySelectorAll('span');
      for (let i = 0; i < elems.length; i++) {
        if ( elems[i].id === element.id ) {
          elems[i].scrollIntoView();
        }
      }
    } catch ( e ) {

    }
  }

  showTooltip(origin: any) {
    if ( origin.target.nextSibling.className !== undefined && String(origin.target.nextSibling.className).includes('tooltip') ) {
      this.toolTipPosition = {top: (origin.target.offsetTop - ( origin.target.offsetHeight / 2 ) + 4) +
        'px', left: (origin.target.offsetLeft + origin.target.offsetWidth + 4) + 'px'};
      this.showToolTip = true;
      this.toolTipText = origin.target.nextSibling.textContent;
      setTimeout(() => {
      this.showToolTip = false;
      this.toolTipText = '';
      }, 5000);
    }
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
