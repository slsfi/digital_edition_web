import { TranslateService } from '@ngx-translate/core';
import { Component, Renderer, ElementRef, SecurityContext } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, Platform, PopoverController, ModalController } from 'ionic-angular';
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
import { ReferenceDataModalPage } from '../../pages/reference-data-modal/reference-data-modal';

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
  protected pos: any;
  public tocMenuOpen: boolean;
  public hasSeparateIntroToc: boolean;
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
    public translate: TranslateService,
    private modalController: ModalController
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');
    this.tocMenuOpen = false;
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

    // Check if we have a pos parmeter in the URL, if we have one we can use it for scrolling the text on the page to that position.
    // The pos parameter must come after the publication id followed by /#, e.g. /publication-introduction/203/#pos1
    const currentURL: string = String(window.location.href);
    if (currentURL.match(/publication-introduction\/\d+\/#\w+/) !== null) {
      this.pos = currentURL.split('#').pop();
    } else {
      this.pos = null;
    }

    this.setUpTextListeners();
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
            if (!this.platform.is('mobile')) {
              this.toggleTocMenu();
            }
            // Try to scroll to an element in the text, checks if "pos" given
            this.scrollToPos();
          },
        error =>  {this.errorMessage = <any>error; this.textLoading = false; }

      );
      const selectedStatic = [];
      selectedStatic['isIntroduction'] = true;
      this.events.publish('setSelectedStatic:true', selectedStatic);
    });
  }

  // Try to scroll to an element in the text, checks if "pos" given
  // Timeout, to give text some time to load on the page
  scrollToPos() {
    let interationsLeft = 10;
    const checkExist = setInterval(function() {
      if (interationsLeft < 1) {
        clearInterval(checkExist);
      } else {
        interationsLeft -= 1;
        if (this.pos !== null && this.pos !== undefined) {
          console.log('Attempting to scroll to ' + this.pos);
          let positionElement: HTMLElement = document.getElementsByName(this.pos)[0];
          const parentElem = positionElement.parentElement;
          if ((parentElem !== undefined && parentElem.classList.length !== 0 &&
          parentElem.classList.contains('ttFixed')) ||
            (parentElem.parentElement !== undefined && parentElem.parentElement.classList.length !== 0 &&
              parentElem.parentElement.classList.contains('ttFixed'))) {
              // Anchor is in footnote --> look for next occurence since the first footnote element
              // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
              // the position we need to find).
              positionElement = document.getElementsByName(this.pos)[1] as HTMLElement;
          }
          if (positionElement !== undefined && positionElement.classList.length !== 0 &&
          positionElement.classList.contains('anchor')) {
            this.scrollToHTMLElement(positionElement);
            clearInterval(checkExist);
          }
        } else {
          clearInterval(checkExist);
        }
      }
    }.bind(this), 1000);
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    /* CLICK EVENTS */
    this.renderer.listen(nElement, 'click', (event) => {
      try {
        event.stopPropagation();

        // Links in the introduction
        let targetIsLink = false;
        let targetElem: HTMLElement = event.target as HTMLElement;
        if (targetElem.classList.length === 0 || !targetElem.classList.contains('xreference')) {
          targetElem = targetElem.parentElement;
        }

        if (targetElem.classList.length !== 0) {
          if (targetElem.classList.contains('xreference')) {
            targetIsLink = true;
            event.preventDefault();
            const anchorElem: HTMLAnchorElement = targetElem as HTMLAnchorElement;

            if (anchorElem.classList.contains('ref_external')) {
              // Link to external web page, open in new window/tab.
              window.open(anchorElem.href, '_blank');

            } else if (anchorElem.classList.contains('ref_readingtext') ||
             anchorElem.classList.contains('ref_comment') ||
             anchorElem.classList.contains('ref_introduction')) {
              // Link to reading text, comment or introduction.
              // Get the href parts for the targeted text.
              const hrefTargetItems: Array<string> = decodeURIComponent(String(anchorElem.href).split('/').pop()).split(' ');
              let publicationId = '';
              let textId = '';
              let chapterId = '';
              let positionId = '';

              if (anchorElem.classList.contains('ref_readingtext') || anchorElem.classList.contains('ref_comment')) {
                // Link to reading text or comment.

                publicationId = hrefTargetItems[0];
                textId = hrefTargetItems[1];
                this.textService.getCollectionAndPublicationByLegacyId(publicationId + '_' + textId).subscribe(data => {
                  if (data[0] !== undefined) {
                    publicationId = data[0]['coll_id'];
                    textId = data[0]['pub_id'];
                  }

                  if (hrefTargetItems.length > 2 && !hrefTargetItems[2].startsWith('#')) {
                    chapterId = hrefTargetItems[2];
                  }

                  let hrefString = '#/publication/' + publicationId + '/text/' + textId + '/';
                  if (chapterId) {
                    hrefString += chapterId;
                    if (hrefTargetItems.length > 3 && hrefTargetItems[3].startsWith('#')) {
                      positionId = hrefTargetItems[3].replace('#', ';');
                      hrefString += positionId;
                    }
                  } else {
                    hrefString += 'nochapter';
                    if (hrefTargetItems.length > 2 && hrefTargetItems[2].startsWith('#')) {
                      positionId = hrefTargetItems[2].replace('#', ';');
                      hrefString += positionId;
                    }
                  }
                  hrefString += '/not/infinite/nosong/searchtitle/established&comments';
                  window.open(hrefString, '_blank');
                });

              } else if (anchorElem.classList.contains('ref_introduction')) {
                // Link to introduction.
                publicationId = hrefTargetItems[0];
                if (hrefTargetItems.length > 1 && hrefTargetItems[hrefTargetItems.length - 1].startsWith('#')) {
                  positionId = hrefTargetItems[hrefTargetItems.length - 1];
                }

                this.textService.getCollectionAndPublicationByLegacyId(publicationId).subscribe(data => {
                  if (data[0] !== undefined) {
                    publicationId = data[0]['coll_id'];
                  }

                  // Check if we are already on the same page.
                  const baseURI: string = '/' + decodeURIComponent(String(anchorElem.baseURI).split('#/').pop());
                  if ((baseURI.endsWith('/publication-introduction/' + publicationId) ||
                   baseURI.startsWith('/publication-introduction/' + publicationId + '/')) && positionId !== undefined) {
                    // Same introduction.
                    positionId = positionId.replace('#', '');

                    // Find the element in the correct parent element.
                    const matchingElements = document.getElementsByName(positionId);
                    let targetElement = null;
                    const refType = 'PAGE-INTRODUCTION';
                    for (let i = 0; i < matchingElements.length; i++) {
                      let parentElem = matchingElements[i].parentElement;
                      while (parentElem !== null && parentElem.tagName !== refType) {
                        parentElem = parentElem.parentElement;
                      }
                      if (parentElem !== null && parentElem.tagName === refType) {
                        targetElement = matchingElements[i] as HTMLElement;
                        if ((targetElement.parentElement.classList.length !== 0 &&
                        targetElement.parentElement.classList.contains('ttFixed')) ||
                        (targetElement.parentElement.parentElement.classList.length !== 0 &&
                          targetElement.parentElement.parentElement.classList.contains('ttFixed'))) {
                          // Found position is in footnote --> look for next occurence since the first footnote element
                          // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
                          // the position we need to find).
                        } else {
                          break;
                        }
                      }
                    }
                    if (targetElement !== null && targetElement.classList.length !== 0 &&
                    targetElement.classList.contains('anchor')) {
                      this.scrollToHTMLElement(targetElement);
                    }
                  } else {
                    // Different introduction, open in new window.

                    let hrefString = '#/publication-introduction/' + publicationId;
                    if (hrefTargetItems.length > 1 && hrefTargetItems[1].startsWith('#')) {
                      positionId = hrefTargetItems[1];
                      hrefString += '/' + positionId;
                    }

                    window.open(hrefString, '_blank');
                  }
                });
              }
            } else {
              // Link in the introduction's TOC
              let targetId = anchorElem.getAttribute('href');
              if ( targetId === null ) {
                targetId = anchorElem.parentElement.getAttribute('href');
              }
              const dataIdSelector = '[data-id="' + String(targetId).replace('#', '') + '"]';
              const target = anchorElem.ownerDocument.querySelector(dataIdSelector) as HTMLElement;
              if ( target !== null ) {
                this.scrollElementIntoView(target, 'top');
              }
            }
          }
        }
      } catch ( e ) {}
    });

    /* MOUSEWHEEL EVENTS */
    this.renderer.listen(nElement, 'mousewheel', (event) => {
      this.hideToolTip();
    }).bind(this);

    let toolTipsSettings;
    try {
      toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      console.error(e);
    }

    /* MOUSE OVER EVENTS */
    this.renderer.listen(nElement, 'mouseover', (event) => {
      const eventTarget = this.getEventTarget(event);

      if (eventTarget['classList'].contains('tooltiptrigger')) {
        if (eventTarget.hasAttribute('data-id')) {
          if (toolTipsSettings.personInfo && eventTarget['classList'].contains('person')
          && this.readPopoverService.show.personInfo) {
            this.showPersonTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
          } else if (toolTipsSettings.placeInfo && eventTarget['classList'].contains('placeName')
          && this.readPopoverService.show.placeInfo) {
            this.showPlaceTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
          } else if (toolTipsSettings.workInfo && eventTarget['classList'].contains('title')
          && this.readPopoverService.show.workInfo) {
            this.showWorkTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
          } else if (toolTipsSettings.footNotes && eventTarget['classList'].contains('ttFoot')) {
            this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
          }
        }
      }
    }).bind(this);

    /* MOUSE OUT EVENTS */
    this.renderer.listen(nElement, 'mouseout', (event) => {
      this.hideToolTip();
    }).bind(this);
  }

  showPersonTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.persons[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.persons[id]);
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        let text = '';
        if ( tooltip.date_born !== null || tooltip.date_deceased !== null ) {
          const date_born = String(tooltip.date_born).split('-')[0].replace(/^0+/, '');
          const date_deceased = String(tooltip.date_deceased).split('-')[0].replace(/^0+/, '');
          let bcTranslation = 'BC';
          this.translate.get('BC').subscribe(
            translation => {
              bcTranslation = translation;
            }, error => { }
          );
          const bcIndicator = (String(tooltip.date_deceased).includes('BC')) ? ' ' + bcTranslation : '';
          text = '<b>' + tooltip.name + '</b> (';
          if (date_born !== null && date_deceased !== null && date_born !== 'null' && date_born !== 'null') {
            text += date_born + '–' + date_deceased + '' + bcIndicator;
          } else if (date_born !== null && date_born !== 'null') {
            text += '* ' + date_born + bcIndicator;
          } else if (date_deceased !== null && date_deceased !== 'null') {
            text += '&#8224; ' + date_deceased + bcIndicator;
          }
          text += ')';
        } else {
          text = '<b>' + tooltip.name + '</b>';
        }

        if ( tooltip.description !== null ) {
          text += ', ' + tooltip.description
        }

        this.setToolTipPosition(targetElem, text);
        this.setToolTipText(text);
        this.tooltips.persons[id] = text;
      },
      error => {
        let noInfoFound = 'Could not get person information';
        this.translate.get('Occurrences.NoInfoFound').subscribe(
          translation => {
            noInfoFound = translation;
          }, errorT => { }
        );
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showPlaceTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.places[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.places[id]);
      this.setToolTipText(this.tooltips.places[id]);
      return;
    }

    this.tooltipService.getPlaceTooltip(id).subscribe(
      tooltip => {
        this.setToolTipPosition(targetElem, tooltip.description);
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
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showWorkTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.works[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.works[id]);
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
          this.setToolTipPosition(targetElem, noInfoFound);
          this.setToolTipText(noInfoFound);
          return;
        }
        tooltip = tooltip.hits.hits[0]['_source'];
        const description = '<span class="work_title">' + tooltip.title  + '</span><br/>' + tooltip.reference;
        this.setToolTipPosition(targetElem, description);
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
        this.setToolTipPosition(targetElem, noInfoFound);
        this.setToolTipText(noInfoFound);
      }
    );
  }

  showFootnoteTooltip(id: string, targetElem: HTMLElement, origin: any) {
    if (this.tooltips.footnotes[id]) {
      this.setToolTipPosition(targetElem, this.tooltips.footnotes[id]);
      this.setToolTipText(this.tooltips.footnotes[id]);
      return;
    }
    const target = document.getElementsByClassName('ttFixed');
    let foundElem: any = '';
    for (let i = 0; i < target.length; i++) {
      const elt = target[i] as HTMLElement;
      if ( elt.getAttribute('data-id') === id ) {
        foundElem = elt.innerHTML;
        break;
      }
    }
    // Prepend the footnoteindicator to the the footnote text.
    const footnoteWithIndicator: string = '<span class="ttFtnIndicator">' + targetElem.textContent +
     '</span>' + '<span class="ttFtnText">' + foundElem  + '</span>';
    const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.setToolTipPosition(targetElem, footNoteHTML);
    this.setToolTipText(footNoteHTML);
    this.tooltips.footnotes[id] = footNoteHTML;
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

    // Set min and max width for resized tooltips.
    const resizedToolTipMinWidth = 300;
    const resizedToolTipMaxWidth = 600;

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
      if (elemRects[0].top - triggerPaddingY - primaryToolbarHeight - secToolbarHeight - edgePadding >
         vh - elemRects[elemRects.length - 1].bottom - triggerPaddingY - edgePadding) {
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
      this.toolTipMaxWidth = '425px';
    }
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

      const availableWidth = vw - sidePaneOffsetWidth - (2 * edgePadding);

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
        let newTTMaxWidth = Math.floor(availableWidth);
        if (newTTMaxWidth > resizedToolTipMaxWidth) {
          newTTMaxWidth = resizedToolTipMaxWidth;
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
          // Basically this means that the width is ok, but the height isn't.
          // As a last resort, scale the tooltip so it fits in view.
          const ratioX = availableWidth / ttNewDimensions.width;
          const ratioY = availableHeight / ttNewDimensions.height;
          const scaleRatio = Math.min(ratioX, ratioY) - 0.01;

          this.toolTipMaxWidth = ttNewDimensions.width + 'px';
          this.toolTipScaleValue = scaleRatio;
          x = elemRect.left;
          if (positionAbove) {
            y = elemRect.top - availableHeight - triggerPaddingY - primaryToolbarHeight;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          oversetX = x + ttNewDimensions.width - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        }
      }
    }

    // Set tooltip position
    this.toolTipPosition = {
      top: y + 'px',
      left: (x - sidePaneOffsetWidth) + 'px'
    };
  }

  private getToolTipDimensions(toolTipElem: HTMLElement, toolTipText: string, maxWidth = 0, returnCompMaxWidth: Boolean = false) {
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
    const ttHeight = hiddenDiv.offsetHeight;
    const ttWidth = hiddenDiv.offsetWidth;
    let compToolTipMaxWidth = '';
    if (returnCompMaxWidth) {
      // Get default tooltip max-width from css of hidden div if possible.
      const hiddenDivCompStyles = window.getComputedStyle(hiddenDiv);
      compToolTipMaxWidth = hiddenDivCompStyles.getPropertyValue('max-width');
    }
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
    this.hideToolTip();
    element.scrollIntoView();
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

  private scrollToHTMLElement(element: HTMLElement, position = 'top', timeOut = 5000) {
    try {
      const tmpImage: HTMLImageElement = new Image();
      tmpImage.src = 'assets/images/ms_arrow_right.svg';
      tmpImage.classList.add('inl_ms_arrow');
      element.parentElement.insertBefore(tmpImage, element);
      this.scrollElementIntoView(tmpImage, position);
      setTimeout(function() {
        element.parentElement.removeChild(tmpImage);
      }, timeOut);
    } catch ( e ) {
      console.error(e);
    }
  }

  /* This function can be used to scroll a container so that the element which it contains
   * is placed either at the top edge of the container or in the center of the container.
   * This function can be called multiple times simultaneously on elements in different
   * containers, unlike the native scrollIntoView function which cannot be called multiple
   * times simultaneously in Chrome due to a bug.
   * Valid values for yPosition are 'top' and 'center'.
   */
  private scrollElementIntoView(element: HTMLElement, yPosition = 'center', offset = 0) {
    if (element === undefined || element === null || (yPosition !== 'center' && yPosition !== 'top')) {
      return;
    }
    // Find the scrollable container of the element which is to be scrolled into view
    let container = element.parentElement;
    while (!container.classList.contains('scroll-content') &&
     container.parentElement.tagName !== 'ION-SCROLL') {
      container = container.parentElement;
      if (container === null || container === undefined) {
        return;
      }
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

  private getEventTarget(event) {
    let eventTarget: any = document.createElement('div');
    eventTarget['classList'] = [];

    if ( event.target.getAttribute('data-id') ) {
      return event.target;
    }

    if (event.target !== undefined && event['target']['classList'].contains('tooltiptrigger')) {
      eventTarget = event.target;
    } else if (event['target']['parentNode'] !== undefined && event['target']['parentNode']['classList'].contains('tooltiptrigger')) {
        eventTarget = event['target']['parentNode'];
    } else if (event.target !== undefined && eventTarget['classList'].contains('anchor')) {
      eventTarget = event.target;
    }
    return eventTarget;
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
    let toggles = undefined;
    try {
      toggles = this.config.getSettings('settings.introToggles');
    } catch (error) {
      console.error(error);
    }
    if (toggles === undefined || toggles === null) {
      toggles = {
        'comments': false,
        'personInfo': false,
        'placeInfo': false,
        'workInfo': false,
        'changes': false,
        'normalisations': false,
        'abbreviations': false,
        'pageNumbering': true,
        'pageBreakOriginal': false,
        'pageBreakEdition': false
      };
    }
    const popover = this.popoverCtrl.create(ReadPopoverPage, {toggles}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
  }

  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  hideToolTip() {
    this.setToolTipText('');
    this.toolTipPosition = {
      top: -1000 + 'px',
      left: -1000 + 'px'
    };
  }

  private scrollToElementTOC(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({behavior: 'smooth', block: 'start'});
    } catch ( e ) {
    }
  }

  showSharePopover(myEvent) {
    const popover = this.popoverCtrl.create(SharePopoverPage, {}, { cssClass: 'share-popover' });
    popover.present({
      ev: myEvent
    });
  }

  private showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
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
