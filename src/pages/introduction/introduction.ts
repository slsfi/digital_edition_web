import { TranslateService } from '@ngx-translate/core';
import { Component, Renderer, ElementRef, SecurityContext } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, Platform, PopoverController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { TooltipService } from '../../app/services/tooltips/tooltip.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { ReadPopoverPage } from '../read-popover/read-popover';
import { SharePopoverPage } from '../share-popover/share-popover';
import { GeneralTocItem } from '../../app/models/table-of-contents.model';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { Storage } from '@ionic/storage';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';

/**
 * Generated class for the IntroductionPage page.
 *
 * Collection introduction.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'introduction',
  segment: 'publication-introduction/:collectionID'
})
@Component({
  selector: 'page-introduction',
  templateUrl: 'introduction.html',
})
export class IntroductionPage {

  errorMessage: any;
  protected id: string;
  protected text: any;
  protected textMenu: any;
  protected collection: any;
  public tocMenuOpen: boolean;
  public hasSeparateIntroToc: boolean;
  showToolTip: boolean;
  toolTipPosition: object;
  toolTipMaxWidth: string;
  toolTipScaleValue: number;
  toolTipText: string;
  tooltips = {
    'persons': {},
    'comments': {},
    'works': {},
    'places': {},
    'abbreviations': {},
    'footnotes': {}
  };
  textLoading: Boolean = true;
  tocItems: GeneralTocItem[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    private renderer: Renderer,
    private tooltipService: TooltipService,
    private elementRef: ElementRef,
    protected popoverCtrl: PopoverController,
    private userSettingsService: UserSettingsService,
    private events: Events,
    private platform: Platform,
    protected tableOfContentsService: TableOfContentsService,
    private storage: Storage,
    public semanticDataService: SemanticDataService,
    public readPopoverService: ReadPopoverService,
    private config: ConfigService,
    public translate: TranslateService
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');
    this.tocMenuOpen = true;
    if (this.platform.is('mobile')) {
      this.tocMenuOpen = false;
    }
    this.showToolTip = true;
    this.toolTipMaxWidth = null;
    this.toolTipScaleValue = null;
    this.toolTipPosition = {
      top: -1000 + 'px',
      left: -1000 + 'px'
    };

    try {
      this.hasSeparateIntroToc = this.config.getSettings('separeateIntroductionToc');
    } catch (error) {
      this.hasSeparateIntroToc = false;
    }
    if ( this.id !== undefined ) {
      this.getTocRoot(this.id);
    }
  }

  ionViewDidLoad() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(this.id, lang).subscribe(
        res => {
            this.textLoading = false;
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );
            const pattern = /<div data-id="content">(.*?)<\/div>/;
            const matches = String(this.text).match(pattern);
            const the_string = matches[0];
            this.textMenu = the_string;
          },
        error =>  {this.errorMessage = <any>error; this.textLoading = false; }

      );
      const selectedStatic = [];
      selectedStatic['isIntroduction'] = true;
      this.events.publish('setSelectedStatic:true', selectedStatic);
    });

    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      try {
        event.stopPropagation();
        event.preventDefault();
        const elem: HTMLElement = event.target as HTMLElement;
        if ( event.target.classList.contains('ref_readingtext') || event.target.classList.contains('ref_comment')) {
          const params = String(decodeURI(event.target.href)).split('/').pop();
          this.openExternal(params);
        } else if ( event.target.classList.contains('ref_introduction') ) {
          let targetId = elem.getAttribute('href');
          if ( targetId === null ) {
            targetId = elem.parentElement.getAttribute('href');
          }
          if ( String(targetId).indexOf('#') !== -1 ) {
            targetId = String(targetId).split('#')[1];
            const dataIdSelector = '[name="' + String(targetId).replace('#', '') + '"]';
            const target = elem.ownerDocument.querySelector(dataIdSelector) as HTMLElement;
            if ( target !== null ) {
              this.scrollToElementTOC(target, event);
            } else {
              this.textService.getCollectionAndPublicationByLegacyId(targetId[0]).subscribe(data => {
                if ( data[0] !== undefined ) {
                  const ref = window.open('#/publication-introduction/' + data[0]['coll_id'], '_blank');
                }
              });
            }
          } else {
            window.open('#/publication-introduction/' + String(targetId), '_blank');
          }
        } else if ( event.target.classList.contains('ref_external') ) {
          let targetId = elem.getAttribute('href');
          if ( targetId === null ) {
            targetId = elem.parentElement.getAttribute('href');
          }
          if ( targetId !== null ) {
            window.open(targetId, '_blank');
          }
        } else {
          let targetId = elem.getAttribute('href');
          if ( targetId === null ) {
            targetId = elem.parentElement.getAttribute('href');
          }
          const dataIdSelector = '[data-id="' + String(targetId).replace('#', '') + '"]';
          const target = elem.ownerDocument.querySelector(dataIdSelector) as HTMLElement;
          if ( target !== null ) {
            this.scrollToElementTOC(target, event);
          }
        }
      } catch ( e ) {}
    });

    let toolTipsSettings;
    try {
      toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      console.error(e);
    }
    this.renderer.listen(this.elementRef.nativeElement, 'mouseover', (event) => {
      /*
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const sidePaneIsOpen = document.querySelector('ion-split-pane').classList.contains('split-pane-visible');
      */

      const eventTarget = this.getEventTarget(event);
      const elem = event.target;
      if (eventTarget['classList'].contains('tooltiptrigger')) {
        /* Get rectangle which contains tooltiptrigger element */
        /*
        let elemRect = elem.getBoundingClientRect();
        let x = ((elemRect.left + vw) - vw) + (elem.offsetWidth + 10);
        let y = ((elemRect.top + vh) - vh) - 90;
        let sidePaneOffsetWidth = 0;

        if (sidePaneIsOpen) {
          sidePaneOffsetWidth = 269;
        }
        */

        /*  Check if tooltip would be drawn outside viewport on the right.
            Move it to the left side of the trigger if there is enough space.
            Tooltips have a max-width of 400px.*/
        /*
        if (x + 400 > vw && elemRect.left - sidePaneOffsetWidth > 400 + 10) {
          x = elemRect.left - 400 - 10;
        }
        */

        /* Set tooltip position outside of viewport (move into view with a function)
        let x = -1000;
        let y = -1000;
        this.toolTipPosition = {
          top: y + 'px',
          left: x + 'px'
        };
         */

        // this.showToolTip = false;
        /*
        this.toolTipPosition = {
          top: -1000 + 'px',
          left: -1000 + 'px'
        };
        */
       this.setToolTipText('');

        if (eventTarget.hasAttribute('data-id')) {
          if (toolTipsSettings.personInfo && eventTarget['classList'].contains('person')
          && this.readPopoverService.show.personInfo) {
            // this.showToolTip = true;
            // clearTimeout(window['reload_timer']);
            // this.hideToolTip();
            this.showPersonTooltip(eventTarget.getAttribute('data-id'), elem, event);
          } else if (toolTipsSettings.placeInfo && eventTarget['classList'].contains('placeName')
          && this.readPopoverService.show.placeInfo) {
            // this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showPlaceTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.workInfo && eventTarget['classList'].contains('title')
          && this.readPopoverService.show.workInfo) {
            // this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showWorkTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.footNotes && eventTarget['classList'].contains('ttFoot')) {
            // this.showToolTip = true;
            // clearTimeout(window['reload_timer']);
            // this.hideToolTip();
            this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), elem, eventTarget, event);
            // this.setToolTipPosition();
            // this.showToolTip = true;
          }
        } else {

        }
      } else if (eventTarget['classList'].contains('anchor')) {
        if (eventTarget.hasAttribute('href')) {
          this.scrollToElement(eventTarget.getAttribute('href'));
        }
      }
    }).bind(this);

    this.renderer.listen(this.elementRef.nativeElement, 'mouseout', (event) => {
      // this.showToolTip = false;
      this.toolTipPosition = {
        top: -1000 + 'px',
        left: -1000 + 'px'
      };
    }).bind(this);
  }

  openExternal(external) {
    const extParts = String(external).split(' ');
    this.textService.getCollectionAndPublicationByLegacyId(extParts[0] + '_' + extParts[1]).subscribe(data => {
      if ( data[0] !== undefined ) {
        let link = '/#/publication/' + data[0]['coll_id'] + '/text/' + data[0]['pub_id'];
        if ( extParts[2] !== undefined ) {
          link += '/' + String(extParts[2]).replace('#', ';');
        }
        if ( extParts[3] !== undefined && String(extParts[3]).includes('#') !== false ) {
          link += String(extParts[3]).replace('#', ';');
        }
        const ref = window.open(link + '/nochapter/not/infinite/nosong/searchtitle/established&comments', '_blank');
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  showWorkTooltip(id: string, origin: any) {
    if (this.tooltips.works[id]) {
      this.setToolTipText(this.tooltips.works[id]);
      return;
    }
    this.semanticDataService.getSingleObjectElastic('work', id).subscribe(
      tooltip => {
        if ( tooltip.hits.hits[0] === undefined || tooltip.hits.hits[0]['_source'] === undefined ) {
          let noInfoFound = 'Could not get work information';
          this.translate.get('Occurrences.NoInfoFound').subscribe(
            translation => {
              noInfoFound = translation;
            }, err => { }
          );
          this.setToolTipText(noInfoFound);
          return;
        }
        tooltip = tooltip.hits.hits[0]['_source'];
        const description = '<span class="work_title">' + tooltip.title  + '</span><br/>' + tooltip.reference;
        this.setToolTipText(description);
        this.tooltips.works[id] = description;
      },
      error => {
        let noInfoFound = 'Could not get work information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, err => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showFootnoteTooltip(id: string, targetElem: HTMLElement, ftnIndicatorElem: HTMLElement, origin: any) {
    const target = document.getElementsByClassName('ttFixed');
    let foundElem: any = '';
    for (let i = 0; i < target.length; i++) {
      const elt = target[i] as HTMLElement;
      if ( elt.getAttribute('data-id') === id ) {
        foundElem = elt.innerHTML;
        break;
      }
    }
    const foundElemSafe: any = this.sanitizer.bypassSecurityTrustHtml(foundElem);

    /* Prepend the footnoteindicator to the the footnote text */
    const footnoteWithIndicator: string = '<span class="ttFtnIndicator">' + ftnIndicatorElem.textContent + '</span>' + foundElem;
    const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.setToolTipPosition(targetElem, footnoteWithIndicator);

    this.setToolTipText(footNoteHTML);
    this.tooltips.footnotes[id] = foundElemSafe;
    return foundElemSafe;
  }

  showPlaceTooltip(id: string, origin: any) {
    if (this.tooltips.places[id]) {
      this.setToolTipText(this.tooltips.places[id]);
      return;
    }

    this.tooltipService.getPlaceTooltip(id).subscribe(
      tooltip => {
        this.setToolTipText((tooltip.description) ? tooltip.description : tooltip.name);
        this.tooltips.places[id] = tooltip.description;
      },
      error => {
        let noInfoFound = 'Could not get place information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, errorT => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  setToolTipPosition(targetElem: HTMLElement, ttText: string) {
    // Get viewport width and height.
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Set vertical offset and toolbar heights.
    const yOffset = 5;
    const primaryToolbarHeight = 70;
    const secToolbarHeight = 50;

    // Set how close to the edges of the "window" the tooltip can be placed. Currently this only applies if the
    // tooltip is set above or below the trigger.
    const edgePadding = 5;

    // Set "padding" around tooltip trigger – this is how close to the trigger element the tooltip will be placed.
    const triggerPaddingX = 8;
    const triggerPaddingY = 8;

    // Set min-width for resized tooltips.
    const resizedToolTipMinWidth = 250;

    // Set horisontal offset due to possible side pane on the left.
    const sidePaneIsOpen = document.querySelector('ion-split-pane').classList.contains('split-pane-visible');
    let sidePaneOffsetWidth = 0;
    if (sidePaneIsOpen) {
      sidePaneOffsetWidth = 269;
    }

    // Set variable for determining if the tooltip should be placed above or below the trigger rather than beside it.
    let positionAboveOrBelowTrigger: Boolean = false;
    let positionAbove: Boolean = false;

    // Get rectangle which contains tooltiptrigger element. For trigger elements spanning multiple lines
    // tooltips are always placed above or below the trigger.
    const elemRects = targetElem.getClientRects();
    let elemRect = null;
    if (elemRects.length === 1) {
      elemRect = elemRects[0];
    } else {
      positionAboveOrBelowTrigger = true;
      if (elemRects[0].top - yOffset - primaryToolbarHeight - secToolbarHeight > vh - elemRects[elemRects.length - 1].bottom) {
        elemRect = elemRects[0];
        positionAbove = true;
      } else {
        elemRect = elemRects[elemRects.length - 1];
      }
    }

    // Find the tooltip element.
    const tooltipElement: HTMLElement = document.querySelector('div.toolTip');

    // Get tooltip element's default dimensions and computed max-width (latter set by css).
    const initialTTDimensions = this.getToolTipDimensions(tooltipElement, ttText, 0, true);
    let ttHeight = initialTTDimensions.height;
    let ttWidth = initialTTDimensions.width;
    if (initialTTDimensions.compMaxWidth) {
      this.toolTipMaxWidth = initialTTDimensions.compMaxWidth;
    } else {
      this.toolTipMaxWidth = '350px';
    }
    const defaultToolTipMaxWidth = this.toolTipMaxWidth;
    // Reset scale value for tooltip.
    if (this.toolTipScaleValue) {
      this.toolTipScaleValue = 1;
    }

    // Calculate default position.
    let x = elemRect.right + triggerPaddingX;
    let y = elemRect.top - primaryToolbarHeight - yOffset;

    // Check if tooltip would be drawn outside the viewport.
    let oversetX = x + ttWidth - vw;
    let oversetY = elemRect.top + ttHeight - vh;
    if (!positionAboveOrBelowTrigger) {
      if (oversetX > 0) {
        if (oversetY > 0) {
          // Overset both vertically and horisontally. Check if tooltip can be moved to the left
          // side of the trigger and upwards without modifying its dimensions.
          if (elemRect.left - sidePaneOffsetWidth > ttWidth + triggerPaddingX && y - secToolbarHeight > oversetY) {
            // Move tooltip to the left side of the trigger and upwards
            x = elemRect.left - ttWidth - triggerPaddingX;
            y = y - oversetY;
          } else {
            // Calc how much space there is on either side and attempt to place the tooltip on the side with more space.
            const spaceRight = vw - x;
            const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, maxSpace);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              this.toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        } else {
          // Overset only horisontally. Check if there is room on the left side of the trigger.
          if (elemRect.left - sidePaneOffsetWidth - triggerPaddingX > ttWidth) {
            // There is room on the left --> move tooltip there.
            x = elemRect.left - ttWidth - triggerPaddingX;
          } else {
            // There is not enough room on the left. Try to squeeze in the tooltip on whichever side has more room.
            // Calc how much space there is on either side.
            const spaceRight = vw - x;
            const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, maxSpace);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              this.toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        }
      } else if (oversetY > 0) {
        // Overset only vertically. Check if there is room to move the tooltip upwards.
        if (oversetY < y - secToolbarHeight) {
          // Move the y position upwards by oversetY.
          y = y - oversetY;
        } else {
          // There is not room to move the tooltip just upwards. Check if there is more room on the
          // left side of the trigger so the width of the tooltip could be increased there.
          const spaceRight = vw - x;
          const spaceLeft = elemRect.left - sidePaneOffsetWidth - triggerPaddingX;

          if (spaceLeft > spaceRight) {
            const ttDimensions = this.getToolTipDimensions(tooltipElement, ttText, spaceLeft);
            ttHeight = ttDimensions.height;
            ttWidth = ttDimensions.width;

            if (ttWidth <= spaceLeft && ttWidth > resizedToolTipMinWidth &&
               ttHeight < vh - yOffset - primaryToolbarHeight - secToolbarHeight) {
              // There is enough space on the left side of the trigger. Calc new positions.
              this.toolTipMaxWidth = ttWidth + 'px';
              x = elemRect.left - triggerPaddingX - ttWidth;
              oversetY = elemRect.top + ttHeight - vh;
              y = y - oversetY;
            } else {
              positionAboveOrBelowTrigger = true;
            }
          } else {
            positionAboveOrBelowTrigger = true;
          }
        }
      }
    }

    if (positionAboveOrBelowTrigger) {
      // The tooltip could not be placed next to the trigger, so it has to be placed above or below it.
      // Check if there is more space above or below the tooltip trigger.
      let availableHeight = 0;
      if (elemRects.length > 1 && positionAbove) {
        availableHeight = elemRect.top - primaryToolbarHeight - secToolbarHeight - triggerPaddingY - edgePadding;
      } else if (elemRects.length > 1) {
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      } else if (elemRect.top - primaryToolbarHeight - secToolbarHeight > vh - elemRect.bottom) {
        positionAbove = true;
        availableHeight = elemRect.top - primaryToolbarHeight - secToolbarHeight - triggerPaddingY - edgePadding;
      } else {
        positionAbove = false;
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      }

      availableHeight = Math.floor(availableHeight);
      const availableWidth = Math.floor(vw - sidePaneOffsetWidth - (2 * edgePadding));

      if (initialTTDimensions.height <= availableHeight && initialTTDimensions.width <= availableWidth) {
        // The tooltip fits without resizing. Calculate position, check for possible overset and adjust.
        x = elemRect.left;
        if (positionAbove) {
          y = elemRect.top - initialTTDimensions.height - primaryToolbarHeight - triggerPaddingY;
        } else {
          y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
        }

        // Check if tooltip would be drawn outside the viewport horisontally.
        oversetX = x + initialTTDimensions.width - vw;
        if (oversetX > 0) {
          x = x - oversetX - edgePadding;
        }
      } else {
        // Try to resize the tooltip so it would fit in view.
        let newTTMaxWidth = availableWidth;
        if (newTTMaxWidth > 550) {
          newTTMaxWidth = 550;
        }
        // Calculate tooltip dimensions with new max-width
        const ttNewDimensions = this.getToolTipDimensions(tooltipElement, ttText, newTTMaxWidth);

        if (ttNewDimensions.height <= availableHeight && ttNewDimensions.width <= availableWidth) {
          // Set new max-width and calculate position. Adjust if overset.
          this.toolTipMaxWidth = ttNewDimensions.width + 'px';
          x = elemRect.left;
          if (positionAbove) {
            y = elemRect.top - ttNewDimensions.height - primaryToolbarHeight - triggerPaddingY;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          // Check if tooltip would be drawn outside the viewport horisontally.
          oversetX = x + ttNewDimensions.width - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        } else {
          // Resizing the width and height of the tooltip element won't make it fit in view.
          // As a last resort, try to scale the tooltip so it fits in view.
          const ratioX = availableWidth / ttNewDimensions.width;
          const ratioY = availableHeight / ttNewDimensions.height;
          const scaleRatio = Math.min(ratioX, ratioY) - 0.05;

          const ttScaledDimensions = this.getToolTipDimensions(tooltipElement, ttText,
            ttNewDimensions.width, false, scaleRatio);
          if (ttScaledDimensions.height * scaleRatio <= availableHeight && ttScaledDimensions.width * scaleRatio <= availableWidth) {
            // Scaling successful. Calculate position and adjust if overset.
            this.toolTipScaleValue = scaleRatio;
            this.toolTipMaxWidth = ttScaledDimensions.width + 'px';
            x = elemRect.left;
            if (positionAbove) {
              y = elemRect.top - ttScaledDimensions.height - primaryToolbarHeight - triggerPaddingY;
            } else {
              y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
            }
            // Check if tooltip would be drawn outside the viewport horisontally.
            oversetX = x + ttScaledDimensions.width - vw;
            if (oversetX > 0) {
              x = x - oversetX - edgePadding;
            }
          } else {
            // Use the default position, which means that the tooltip will not fit in view.
            x = elemRect.right + triggerPaddingX;
            y = elemRect.top - primaryToolbarHeight - yOffset;
            this.toolTipMaxWidth = defaultToolTipMaxWidth;
          }
        }
      }
    }

    // Set tooltip position
    x = x - sidePaneOffsetWidth;
    let topPosition = '';
    let leftPosition = '';
    if (x === 0) {
      leftPosition = '0';
    } else {
      leftPosition = x + 'px';
    }
    if (y === 0) {
      topPosition = '0';
    } else {
      topPosition = y + 'px';
    }
    this.toolTipPosition = {
      top: topPosition,
      left: leftPosition
    };
  }

  private getToolTipDimensions(toolTipElem: HTMLElement, toolTipText: string, maxWidth = 0,
     returnCompMaxWidth: Boolean = false, scaleRatio = 1) {
    // Create hidden div and make it into a copy of the tooltip div. Calculations are done on the hidden div.
    const hiddenDiv: HTMLElement = document.createElement('div');

    // Loop over each class in the tooltip element and add them to the hidden div.
    const ttClasses: string[] = Array.from(toolTipElem.classList);
    ttClasses.forEach(
      function(currentValue, currentIndex, listObj) {
        hiddenDiv.classList.add(currentValue);
      },
    );

    // Don't display the hidden div initially. Set max-width if defined, otherwise the max-width will be determined by css.
    hiddenDiv.style.display = 'none';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.left = '0';
    if (maxWidth > 0) {
      hiddenDiv.style.maxWidth = maxWidth + 'px';
    }
    // Append hidden div to the parent of the tooltip element.
    toolTipElem.parentNode.appendChild(hiddenDiv);
    // Add content to the hidden div.
    hiddenDiv.innerHTML = toolTipText;
    // Make div visible again to calculate its width and height.
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.style.display = 'block';
    if (scaleRatio !== 1) {
      hiddenDiv.style.transform = 'scale(' + scaleRatio + ')';
      /*const elemRect = hiddenDiv.getBoundingClientRect();
      ttHeight = elemRect.height;
      ttWidth = elemRect.width;*/
    }
    let ttHeight = hiddenDiv.offsetHeight;
    let ttWidth = hiddenDiv.offsetWidth;
    let compToolTipMaxWidth = '';
    if (returnCompMaxWidth) {
      // Get default tooltip max-width from css of hidden div if possible.
      const hiddenDivCompStyles = window.getComputedStyle(hiddenDiv);
      compToolTipMaxWidth = hiddenDivCompStyles.getPropertyValue('max-width');
    }
    // Make the hidden div invisible again.
    hiddenDiv.style.visibility = 'visible';
    hiddenDiv.style.display = 'none';
    // Remove hidden div.
    hiddenDiv.remove();

    const dimensions = {
      width: ttWidth,
      height: ttHeight,
      compMaxWidth: compToolTipMaxWidth
    }

    return dimensions;
  }

  private scrollToElement(element: HTMLElement) {
    element.scrollIntoView();
    this.showToolTip = false;
    try {
      const elems: NodeListOf<HTMLSpanElement> = document.querySelectorAll('span');
      for (let i = 0; i < elems.length; i++) {
        if (elems[i].id === element.id) {
          elems[i].scrollIntoView();
        }
      }
    } catch (e) {

    }
  }

  private getEventTarget(event) {
    let eventTarget: any = document.createElement('div');
    eventTarget['classList'] = [];

    if ( event.target.getAttribute('data-id') ) {
      return event.target;
    }

    if (event['target']['parentNode'] !== undefined && event['target']['parentNode']['classList'].contains('tooltiptrigger')) {
      eventTarget = event['target']['parentNode'];
    } else if (event.target !== undefined && event['target']['classList'].contains('tooltiptrigger')) {
      eventTarget = event.target;
    } else if (event.target !== undefined && eventTarget['classList'].contains('anchor')) {
      eventTarget = event.target;
    }
    return eventTarget;
  }

  showPersonTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.persons[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.persons[id]);
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        this.setToolTipPosition(targetElem, tooltip.description);
        this.setToolTipText(tooltip.description);
        this.tooltips.persons[id] = tooltip.description;
      },
      error => {
        let noInfoFound = 'Could not get person information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, errorT => { }
        );
        this.setToolTipText(noInfoFound);
      }
    );
  }

  getTocRoot(id: string) {
    if ( id !== 'mediaCollections' ) {
      this.tableOfContentsService.getTableOfContents(id)
      .subscribe(
        tocItems => {
          this.tocItems = tocItems;
          console.log('get toc root... --- --- in single edition');
          const tocLoadedParams = { tocItems: tocItems };
          tocLoadedParams['collectionID'] = this.tocItems['collectionId'];
          tocLoadedParams['searchTocItem'] = true;
          this.events.publish('tableOfContents:loaded', tocLoadedParams);
          this.storage.set('toc_' + id, tocItems);
        },
        error => { this.errorMessage = <any>error });
    } else {
      this.tocItems = this.collection['accordionToc']['toc'];
      const tocLoadedParams = { tocItems: this.tocItems };
      tocLoadedParams['collectionID'] = 'mediaCollections';
      tocLoadedParams['searchTocItem'] = true;
      this.events.publish('tableOfContents:loaded', tocLoadedParams);
      this.storage.set('toc_' + id, this.tocItems);
    }
  }

  showPopover(myEvent) {
    const toggles = {
      'comments': false,
      'personInfo': true,
      'placeInfo': true,
      'workInfo': true,
      'changes': false,
      'abbreviations': true,
      'pageNumbering': true,
      'pageBreakOriginal': false,
      'pageBreakEdition': true
    };
    const popover = this.popoverCtrl.create(ReadPopoverPage, {toggles}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
  }

  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  hideToolTip() {
    // Is this necessary any more?
    this.toolTipText = '';

    // let tooltipElement: HTMLElement = document.querySelector('div.toolTip');
    // tooltipElement.innerHTML = '';

    /*
    if (tooltipElement.style.getPropertyValue('max-width')) {
      tooltipElement.style.removeProperty('max-width');
    }
    */

    this.toolTipPosition = {
      top: -1000 + 'px',
      left: -1000 + 'px'
    };

    /*
    window['reload_timer'] = setTimeout(() => {
      //this.showToolTip = false;

      this.toolTipPosition = {
        top: -1000 + 'px',
        left: -1000 + 'px'
      };
    }, 4000);
    */
  }

  private scrollToElementTOC(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'start'});
    } catch ( e ) {
    }
  }

  showSharePopover(myEvent) {
    const popover = this.popoverCtrl.create(SharePopoverPage, {}, { cssClass: 'share-popover' });
    popover.present({
      ev: myEvent
    });
  }

 private toggleTocMenu() {
   if ( this.tocMenuOpen ) {
    this.tocMenuOpen = false;
   } else {
    this.tocMenuOpen = true;
   }
 }
}
