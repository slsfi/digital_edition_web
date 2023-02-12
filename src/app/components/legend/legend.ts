import { Component, ElementRef, Input, NgZone, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
/**
 * Class for the LegendComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'legend',
  templateUrl: 'legend.html',
  styleUrls: ['legend.scss']
})
export class LegendComponent {

  @Input() itemId?: string;
  @Input() scrollToElementId?: string;
  text?: string;
  textLoading: Boolean = true;
  languageSubscription?: Subscription;
  staticMdLegendFolderNumber = '13';
  collectionId = '';
  publicationId = '';
  language?: string;
  intervalTimerId: number;
  private unlistenClickEvents?: () => void;

  constructor(
    private elementRef: ElementRef,
    protected langService: LanguageService,
    private mdContentService: MdContentService,
    private ngZone: NgZone,
    protected readPopoverService: ReadPopoverService,
    private renderer2: Renderer2,
    protected translateService: TranslateService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.intervalTimerId = 0;
  }

  ngOnInit() {
    this.collectionId = this.itemId?.split('_')[0] || '';
    this.publicationId = this.itemId?.split('_')[1].split(';')[0] || '';

    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.language = lang;
        this.getMdContent(this.language + '-' + this.staticMdLegendFolderNumber + '-' + this.collectionId + '-' + this.publicationId);
      }
    });

    this.setUpTextListeners();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    this.unlistenClickEvents?.();
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID).subscribe(
      text => {
        this.text = text.content;
        this.textLoading = false;
        this.scrollToInitialTextPosition();
      },
      error => {
        if (fileID.split('-').length > 3) {
          this.getMdContent(this.language + '-' + this.staticMdLegendFolderNumber + '-' + this.collectionId);
        } else if (fileID.split('-')[2] !== '00') {
          this.getMdContent(this.language + '-' + this.staticMdLegendFolderNumber + '-' + '00');
        } else {
          this.translateService.get('Read.Legend.NoLegend').subscribe(translation => {
            if (translation) {
              this.text = translation;
            } else {
              this.text = 'File not found.';
            }
            this.textLoading = false;
          });
        }
      }
    );
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        try {
          const clickedElem = event.target as HTMLElement;

          if (clickedElem.hasAttribute('href') === true
          && clickedElem.getAttribute('href')?.startsWith('http') === false
          && clickedElem.getAttribute('href')?.startsWith('/') === false) {
            event.preventDefault();
            const targetHref = clickedElem.getAttribute('href');

            if (targetHref && targetHref.startsWith('#')) {
              // Assume link to data-id in same legend text --> find element and scroll it into view
              let containerElem = clickedElem.parentElement;
              while (containerElem !== null && containerElem.tagName !== 'LEGEND') {
                containerElem = containerElem.parentElement;
              }
              if (containerElem) {
                const targetElem = containerElem.querySelector('[data-id="' + targetHref.slice(1) + '"]') as HTMLElement;
                this.commonFunctions.scrollElementIntoView(targetElem, 'top');
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
    });
  }

  /**
   * Function for scrolling an element with matching data-id attribute in the
   * last legend-element into view.
   */
  scrollToInitialTextPosition() {
    if (this.scrollToElementId) {
      const that = this;
      this.ngZone.runOutsideAngular(() => {
        let iterationsLeft = 10;
        clearInterval(this.intervalTimerId);
        this.intervalTimerId = window.setInterval(function() {
          if (iterationsLeft < 1) {
            clearInterval(that.intervalTimerId);
          } else {
            iterationsLeft -= 1;
            const legendElements = document.querySelectorAll('page-read:not([hidden]) legend');
            const element = legendElements[legendElements.length - 1].querySelector('[data-id="' + that.scrollToElementId + '"]') as any;
            if (element) {
              that.commonFunctions.scrollElementIntoView(element, 'top');
              clearInterval(that.intervalTimerId);
            }
          }
        }.bind(this), 500);
      });
    }
  }

  /**
   * This function can be used to scroll a container so that the element which it
   * contains is placed either at the top edge of the container or in the center
   * of the container. This function can be called multiple times simultaneously
   * on elements in different containers, unlike the native scrollIntoView function
   * which cannot be called multiple times simultaneously in Chrome due to a bug.
   * Valid values for yPosition are 'top' and 'center'.
   */
   private scrollElementIntoView(element: HTMLElement, yPosition = 'center', offset = 0) {
    if (element === undefined || element === null || (yPosition !== 'center' && yPosition !== 'top')) {
      return;
    }
    // Find the scrollable container of the element which is to be scrolled into view
    let container = element.parentElement;
    while (container !== null && container.parentElement !== null &&
     !container.classList.contains('scroll-content')) {
      container = container.parentElement;
    }
    if (container === null || container.parentElement === null) {
      return;
    }

    const y = Math.floor(element.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top);
    let baseOffset = 10;
    if (yPosition === 'center') {
      baseOffset = Math.floor(container.offsetHeight / 2);
      if (baseOffset > 45) {
        baseOffset = baseOffset - 45;
      }
    }
    container.scrollTo({top: y - baseOffset - offset, behavior: 'smooth'});
  }

}
