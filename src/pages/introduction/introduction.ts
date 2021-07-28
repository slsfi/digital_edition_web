import { TranslateService } from '@ngx-translate/core';
import { Component, Renderer2, ElementRef, SecurityContext, NgZone } from '@angular/core';
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
import { OccurrencesPage } from '../occurrences/occurrences';

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
  readPopoverTogglesIntro: Record<string, any> = {};
  toolTipsSettings: Record<string, any> = {};
  toolTipPosType: string;
  toolTipPosition: object;
  toolTipMaxWidth: string;
  toolTipScaleValue: number;
  toolTipText: string;
  tooltipVisible: Boolean = false;
  tooltips = {
    'persons': {},
    'comments': {},
    'works': {},
    'places': {},
    'abbreviations': {},
    'footnotes': {}
  };
  infoOverlayPosType: string;
  infoOverlayPosition: object;
  infoOverlayWidth: string;
  infoOverlayText: string;
  infoOverlayTitle: string;
  textLoading: Boolean = true;
  tocItems: GeneralTocItem[];
  intervalTimerId: number;
  userIsTouching: Boolean = false;
  collectionLegacyId: string;
  private unlistenClickEvents: () => void;
  private unlistenMouseoverEvents: () => void;
  private unlistenMouseoutEvents: () => void;
  private unlistenFirstTouchStartEvent: () => void;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    private renderer2: Renderer2,
    private ngZone: NgZone,
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
    this.toolTipPosType = 'fixed';
    this.toolTipMaxWidth = null;
    this.toolTipScaleValue = null;
    this.toolTipPosition = {
      top: 0 + 'px',
      left: -1500 + 'px'
    };
    this.infoOverlayText = '';
    this.infoOverlayTitle = '';
    this.infoOverlayWidth = null;
    this.infoOverlayPosType = 'fixed';
    this.infoOverlayPosition = {
      bottom: 0 + 'px',
      left: -1500 + 'px'
    };
    this.intervalTimerId = 0;

    try {
      this.toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      this.toolTipsSettings = undefined;
      console.log('Undefined toolTipsSettings');
      console.error(e);
    }

    try {
      this.readPopoverTogglesIntro = this.config.getSettings('settings.introToggles');
    } catch (e) {
      this.readPopoverTogglesIntro = undefined;
      console.log('Undefined readPopoverTogglesIntro');
      console.error(e);
    }
    if (this.readPopoverTogglesIntro === undefined ||
     this.readPopoverTogglesIntro === null ||
     Object.keys(this.readPopoverTogglesIntro).length === 0) {
      this.readPopoverTogglesIntro = {
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
    } else {
      this.readPopoverTogglesIntro.comments = false;
      this.readPopoverTogglesIntro.changes = false;
      this.readPopoverTogglesIntro.normalisations = false;
      this.readPopoverTogglesIntro.abbreviations = false;
      this.readPopoverTogglesIntro.pageBreakOriginal = false;
    }

    // Check if we have a pos parmeter in the URL, if we have one we can use it for scrolling the text on the page to that position.
    // The pos parameter must come after the publication id followed by /#, e.g. /publication-introduction/203/#pos1
    const currentURL: string = String(window.location.href);
    if (currentURL.match(/publication-introduction\/\d+\/#\w+/) !== null) {
      this.pos = currentURL.split('#').pop();
    } else {
      this.pos = null;
    }

    // Reload the content if language changes
    this.events.subscribe('language:change', () => {
      this.langService.getLanguage().subscribe((lang) => {
        this.ionViewDidLoad();
      });
    });
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.setUpTextListeners();
    this.setCollectionLegacyId();
  }

  ionViewDidLoad() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(this.id, lang).subscribe(
        res => {

            try {
              this.hasSeparateIntroToc = this.config.getSettings('separeateIntroductionToc');
            } catch (error) {
              this.hasSeparateIntroToc = false;
            }
            if ( this.id !== undefined ) {
              this.getTocRoot(this.id);
            }

            this.textLoading = false;
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );
            const pattern = /<div data-id="content">(.*?)<\/div>/;
            const matches = String(this.text).match(pattern);
            if ( matches !== null ) {
              const the_string = matches[0];
              this.textMenu = the_string;
              if (!this.platform.is('mobile')) {
                if (!this.tocMenuOpen) {
                  this.tocMenuOpen = true;
                }
              }
            } else {
              this.hasSeparateIntroToc = false;
            }
            if (!this.platform.is('mobile')) {
              if (!this.tocMenuOpen) {
                this.tocMenuOpen = true;
              }
            }
            // Try to scroll to an element in the text, checks if "pos" given
            this.scrollToPos();
          },
        error =>  {
          this.errorMessage = <any>error;
          this.textLoading = false;
          this.text = 'Could not load introduction.';
          this.hasSeparateIntroToc = false;
        }
      );
      const selectedStatic = [];
      selectedStatic['isIntroduction'] = true;
      this.events.publish('setSelectedStatic:true', selectedStatic);
    });
  }

  ionViewWillLeave() {
    this.unlistenClickEvents();
    this.unlistenMouseoverEvents();
    this.unlistenMouseoutEvents();
    this.unlistenFirstTouchStartEvent();
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  /** Try to scroll to an element in the text, checks if "pos" given.
   *  Timeout, to give text some time to load on the page. */
  private scrollToPos() {
    this.ngZone.runOutsideAngular(() => {
      let interationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = setInterval(function() {
        if (interationsLeft < 1) {
          clearInterval(this.intervalTimerId);
        } else {
          interationsLeft -= 1;
          if (this.pos !== null && this.pos !== undefined) {
            let positionElement: HTMLElement = document.getElementsByName(this.pos)[0];
            if (positionElement !== null && positionElement !== undefined) {
              const parentElem = positionElement.parentElement;
              if ( (parentElem !== null && parentElem.classList.contains('ttFixed'))
              || (parentElem.parentElement !== null && parentElem.parentElement.classList.contains('ttFixed')) ) {
                  // Anchor is in footnote --> look for next occurence since the first footnote element
                  // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
                  // the position we need to find).
                  positionElement = document.getElementsByName(this.pos)[1] as HTMLElement;
              }
              if (positionElement !== null && positionElement !== undefined && positionElement.classList !== null
              && positionElement.classList.contains('anchor')) {
                this.scrollToHTMLElement(positionElement);
                clearInterval(this.intervalTimerId);
              }
            }
          } else {
            clearInterval(this.intervalTimerId);
          }
        }
      }.bind(this), 1000);
    });
  }

  setCollectionLegacyId() {
    this.textService.getLegacyIdByCollectionId(this.params.get('collectionID')).subscribe(
      collection => {
        this.collectionLegacyId = '';
        if (collection[0].legacy_id) {
          this.collectionLegacyId = collection[0].legacy_id;
        }
      },
      error => {
        this.collectionLegacyId = '';
        console.log('could not get collection data trying to resolve collection legacy id');
      }
    );
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CHECK ONCE IF THE USER IF TOUCHING THE SCREEN */
      this.unlistenFirstTouchStartEvent = this.renderer2.listen(nElement, 'touchstart', (event) => {
        this.userIsTouching = true;
        // Don't listen for mouseover and mouseout events since they should have no effect on touch devices
        this.unlistenMouseoverEvents();
        this.unlistenMouseoutEvents();
        this.unlistenFirstTouchStartEvent();
      });

      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        if (!this.userIsTouching) {
          this.ngZone.run(() => {
            this.hideToolTip();
          });
        }
        let eventTarget = this.getEventTarget(event);

        // Modal trigger for person-, place- or workinfo and info overlay trigger for footnote.
        if (eventTarget.classList.contains('tooltiptrigger') && eventTarget.hasAttribute('data-id')) {
          this.ngZone.run(() => {
            if (eventTarget.classList.contains('person') && this.readPopoverService.show.personInfo) {
              this.showPersonModal(eventTarget.getAttribute('data-id'));
            } else if (eventTarget.classList.contains('placeName') && this.readPopoverService.show.placeInfo) {
              this.showPlaceModal(eventTarget.getAttribute('data-id'));
            } else if (eventTarget.classList.contains('title') && this.readPopoverService.show.workInfo) {
              this.showWorkModal(eventTarget.getAttribute('data-id'));
            } else if (eventTarget.classList.contains('ttFoot')) {
              this.showFootnoteInfoOverlay(eventTarget.getAttribute('data-id'), eventTarget);
            }
          });
        }

        // Possibly click on link.
        eventTarget = event.target as HTMLElement;
        if (eventTarget !== null && !eventTarget.classList.contains('xreference')) {
          eventTarget = eventTarget.parentElement;
          if (eventTarget !== null) {
            if (!eventTarget.classList.contains('xreference')) {
              eventTarget = eventTarget.parentElement;
            }
          }
        }

        // Links in the introduction.
        if (eventTarget !== null && eventTarget.classList.contains('xreference')) {
          event.preventDefault();
          const anchorElem: HTMLAnchorElement = eventTarget as HTMLAnchorElement;

          if (anchorElem.classList.contains('ref_external')) {
            // Link to external web page, open in new window/tab.
            if (anchorElem.hasAttribute('href')) {
              window.open(anchorElem.href, '_blank');
            }

          } else if (anchorElem.classList.contains('ref_readingtext')
          || anchorElem.classList.contains('ref_comment')
          || anchorElem.classList.contains('ref_introduction')) {
            // Link to reading text, comment or introduction.
            // Get the href parts for the targeted text.
            const link = anchorElem.href;
            const hrefTargetItems: Array<string> = decodeURIComponent(String(link).split('/').pop()).trim().split(' ');
            let publicationId = '';
            let textId = '';
            let chapterId = '';
            let positionId = '';

            if (anchorElem.classList.contains('ref_readingtext') || anchorElem.classList.contains('ref_comment')) {
              // Link to reading text or comment.

              const newWindowRef = window.open();
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
                newWindowRef.location.href = hrefString;
              });

            } else if (anchorElem.classList.contains('ref_introduction')) {
              // Link to introduction.
              publicationId = hrefTargetItems[0];
              if (hrefTargetItems.length > 1 && hrefTargetItems[hrefTargetItems.length - 1].startsWith('#')) {
                positionId = hrefTargetItems[hrefTargetItems.length - 1];
              }

              // Check if we are already on the same page.
              if ( (String(publicationId) === String(this.id) || String(publicationId) === String(this.collectionLegacyId))
              && positionId !== undefined ) {
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
                    if (targetElement.parentElement.classList.contains('ttFixed')
                    || targetElement.parentElement.parentElement.classList.contains('ttFixed')) {
                      // Found position is in footnote --> look for next occurence since the first footnote element
                      // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
                      // the position we need to find).
                    } else {
                      break;
                    }
                  }
                }
                if (targetElement !== null && targetElement.classList.contains('anchor')) {
                  this.scrollToHTMLElement(targetElement);
                }
              } else {
                // Different introduction, open in new window.
                const newWindowRef = window.open();
                this.textService.getCollectionAndPublicationByLegacyId(publicationId).subscribe(data => {
                  if (data[0] !== undefined) {
                    publicationId = data[0]['coll_id'];
                  }
                  let hrefString = '#/publication-introduction/' + publicationId;
                  if (hrefTargetItems.length > 1 && hrefTargetItems[1].startsWith('#')) {
                    positionId = hrefTargetItems[1];
                    hrefString += '/' + positionId;
                  }
                  newWindowRef.location.href = hrefString;
                });
              }
            }
          } else {
            // Link in the introduction's TOC or link to (foot)note reference
            let targetId = '';
            if (anchorElem.hasAttribute('href')) {
              targetId = anchorElem.getAttribute('href');
            } else if (anchorElem.parentElement.hasAttribute('href')) {
              targetId = anchorElem.parentElement.getAttribute('href');
            }
            const dataIdSelector = '[data-id="' + String(targetId).replace('#', '') + '"]';
            const target = anchorElem.ownerDocument.querySelector('page-introduction').querySelector(dataIdSelector) as HTMLElement;
            if (target !== null) {
              if (anchorElem.classList.contains('footnoteReference')) {
                // Link to (foot)note reference, prepend arrow
                this.scrollToHTMLElement(target, 'top');
              } else {
                // Link in the introduction's TOC, scroll to target but don't prepend arrow
                this.scrollElementIntoView(target, 'top');
              }
            }
          }
        }
      });

      /* MOUSE OVER EVENTS */
      this.unlistenMouseoverEvents = this.renderer2.listen(nElement, 'mouseover', (event) => {
        if (!this.userIsTouching) {
          // Mouseover effects only if using a cursor, not if the user is touching the screen
          const eventTarget = this.getEventTarget(event);

          if (eventTarget.classList.contains('tooltiptrigger')) {
            if (eventTarget.hasAttribute('data-id')) {
              this.ngZone.run(() => {
                if (this.toolTipsSettings.personInfo && eventTarget.classList.contains('person')
                && this.readPopoverService.show.personInfo) {
                  this.showPersonTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                } else if (this.toolTipsSettings.placeInfo && eventTarget.classList.contains('placeName')
                && this.readPopoverService.show.placeInfo) {
                  this.showPlaceTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                } else if (this.toolTipsSettings.workInfo && eventTarget.classList.contains('title')
                && this.readPopoverService.show.workInfo) {
                  this.showWorkTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                } else if (this.toolTipsSettings.footNotes && eventTarget.classList.contains('ttFoot')) {
                  this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), eventTarget, event);
                }
              });
            }
          }
        }
      });

      /* MOUSE OUT EVENTS */
      this.unlistenMouseoutEvents = this.renderer2.listen(nElement, 'mouseout', (event) => {
        if (!this.userIsTouching && this.tooltipVisible) {
          this.ngZone.run(() => {
            this.hideToolTip();
          });
        }
      });

    });
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
    if (this.tooltips.footnotes[id] && this.userSettingsService.isDesktop()) {
      this.setToolTipPosition(targetElem, this.tooltips.footnotes[id]);
      this.setToolTipText(this.tooltips.footnotes[id]);
      return;
    }

    let footnoteText: any = '';
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.firstElementChild !== null
    && targetElem.nextElementSibling.classList.contains('ttFoot')
    && targetElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && targetElem.nextElementSibling.firstElementChild.getAttribute('data-id') === id) {
      footnoteText = targetElem.nextElementSibling.firstElementChild.innerHTML;
    } else {
      return;
    }

    footnoteText = footnoteText.replace(' xmlns:tei="http://www.tei-c.org/ns/1.0"', '');

    // Prepend the footnoteindicator to the the footnote text.
    const footnoteWithIndicator: string = '<div class="footnoteWrapper"><a class="xreference footnoteReference" href="#' + id + '">'
    + targetElem.textContent + '</a>' + '<p class="footnoteText">'
    + footnoteText + '</p></div>';
    const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.setToolTipPosition(targetElem, footNoteHTML);
    this.setToolTipText(footNoteHTML);
    if (this.userSettingsService.isDesktop()) {
      this.tooltips.footnotes[id] = footNoteHTML;
    }
  }

  showFootnoteInfoOverlay(id: string, targetElem: HTMLElement) {
    if (this.tooltips.footnotes[id] && this.userSettingsService.isDesktop()) {
      this.translate.get('note').subscribe(
        translation => {
          this.setInfoOverlayTitle(translation);
        }, error => { }
      );
      this.setInfoOverlayPositionAndWidth(targetElem);
      this.setInfoOverlayText(this.tooltips.footnotes[id]);
      return;
    }

    let footnoteText: any = '';
    if (targetElem.nextElementSibling !== null
    && targetElem.nextElementSibling.firstElementChild !== null
    && targetElem.nextElementSibling.classList.contains('ttFoot')
    && targetElem.nextElementSibling.firstElementChild.classList.contains('ttFixed')
    && targetElem.nextElementSibling.firstElementChild.getAttribute('data-id') === id) {
      footnoteText = targetElem.nextElementSibling.firstElementChild.innerHTML;
    } else {
      return;
    }

    footnoteText = footnoteText.replace(' xmlns:tei="http://www.tei-c.org/ns/1.0"', '');

    // Prepend the footnoteindicator to the the footnote text.
    const footnoteWithIndicator: string = '<div class="footnoteWrapper"><a class="xreference footnoteReference" href="#' + id + '">'
    + targetElem.textContent + '</a>' + '<p class="footnoteText">'
    + footnoteText + '</p></div>';
    const footNoteHTML: string = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    this.setInfoOverlayPositionAndWidth(targetElem);
    this.setInfoOverlayText(footNoteHTML);
    if (this.userSettingsService.isDesktop()) {
      this.tooltips.footnotes[id] = footNoteHTML;
    }
  }

  setToolTipPosition(targetElem: HTMLElement, ttText: string) {
    // Set vertical offset and toolbar height.
    const yOffset = 5;
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

    // Get viewport width and height.
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Set horisontal offset due to possible side pane on the left.
    let sidePaneOffsetWidth = 0;
    let primaryToolbarHeight = 70;
    const contentElem = document.querySelector('page-introduction > ion-content > .scroll-content') as HTMLElement;
    if (contentElem !== null) {
      sidePaneOffsetWidth = contentElem.getBoundingClientRect().left;
      primaryToolbarHeight = contentElem.getBoundingClientRect().top;
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
    if (tooltipElement === null) {
      return;
    }

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
    if (this.userSettingsService.isDesktop()) {
      this.toolTipPosType = 'absolute';
    } else {
      this.toolTipPosType = 'fixed';
    }
    this.tooltipVisible = true;
  }

  private getToolTipDimensions(toolTipElem: HTMLElement, toolTipText: string, maxWidth = 0, returnCompMaxWidth: Boolean = false) {
    // Create hidden div and make it into a copy of the tooltip div. Calculations are done on the hidden div.
    const hiddenDiv: HTMLElement = document.createElement('div');

    // Loop over each class in the tooltip element and add them to the hidden div.
    if (toolTipElem.className !== '') {
      const ttClasses: string[] = Array.from(toolTipElem.classList);
      ttClasses.forEach(
        function(currentValue, currentIndex, listObj) {
          hiddenDiv.classList.add(currentValue);
        },
      );
    } else {
      return undefined;
    }

    // Don't display the hidden div initially. Set max-width if defined, otherwise the max-width will be determined by css.
    hiddenDiv.style.display = 'none';
    hiddenDiv.style.position = 'absolute';
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

  /** Set position and width of infoOverlay element. This function is not exactly
   *  the same as in read.ts due to different page structure in introductions.
   */
  private setInfoOverlayPositionAndWidth(triggerElement: HTMLElement, defaultMargins = 10, maxWidth = 600) {
    let margins = defaultMargins;

    // If the viewport width is less than this value the overlay will be placed at the bottom of the viewport.
    const bottomPosBreakpointWidth = 800;

    // Get viewport height and width.
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // Get page content element and adjust viewport height with horizontal scrollbar height if such is present
    const contentElem = document.querySelector('page-introduction > ion-content > .scroll-content') as HTMLElement;
    let horizontalScrollbarOffsetHeight = 0;
    if (contentElem.clientHeight < contentElem.offsetHeight) {
      horizontalScrollbarOffsetHeight = contentElem.offsetHeight - contentElem.clientHeight;
    }

    // Get bounding rectangle of the div.scroll-content element which is the container for the column that the trigger element resides in.
    let containerElem = triggerElement.parentElement;
    while (containerElem !== null && containerElem.parentElement !== null &&
     !(containerElem.classList.contains('scroll-content') &&
     containerElem.parentElement.tagName === 'ION-SCROLL')) {
       containerElem = containerElem.parentElement;
    }

    if (containerElem !== null && containerElem.parentElement !== null) {
      const containerElemRect = containerElem.getBoundingClientRect();
      let calcWidth = containerElem.clientWidth; // Width without scrollbar

      if (calcWidth > maxWidth + 2 * margins) {
        margins = Math.floor((calcWidth - maxWidth) / 2);
        calcWidth = maxWidth;
      } else {
        calcWidth = calcWidth - 2 * margins;
      }

      let bottomPos = vh - horizontalScrollbarOffsetHeight - containerElemRect.bottom;
      if (vw <= bottomPosBreakpointWidth) {
        bottomPos = 0;
      }

      // Set info overlay position
      this.infoOverlayPosition = {
        bottom: bottomPos + 'px',
        left: (containerElemRect.left + margins - contentElem.getBoundingClientRect().left) + 'px'
      };
      this.infoOverlayPosType = 'absolute';

      // Set info overlay width
      this.infoOverlayWidth = calcWidth + 'px';
    }
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
      this.ngZone.runOutsideAngular(() => {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.alt = 'arrow right image';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        this.scrollElementIntoView(tmpImage, position);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
      });
    } catch ( e ) {
      console.error(e);
    }
  }

  /** This function can be used to scroll a container so that the element which it
   *  contains is placed either at the top edge of the container or in the center
   *  of the container. This function can be called multiple times simultaneously
   *  on elements in different containers, unlike the native scrollIntoView function
   *  which cannot be called multiple times simultaneously in Chrome due to a bug.
   *  Valid values for yPosition are 'top' and 'center'. */
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

  private getEventTarget(event) {
    const eventTarget: HTMLElement = event.target as HTMLElement;

    try {
      if (eventTarget !== undefined && eventTarget !== null) {
        if (eventTarget.getAttribute('data-id')) {
          return eventTarget;
        }

        if (eventTarget.classList.contains('tooltiptrigger')) {
          return eventTarget;
        } else if (eventTarget.parentElement !== undefined && eventTarget.parentElement !== null) {
          if (eventTarget.parentElement.classList.contains('tooltiptrigger')) {
            return eventTarget.parentElement;
          } else {
            if (eventTarget.parentElement.parentElement !== undefined && eventTarget.parentElement.parentElement !== null) {
              if (eventTarget.parentElement.parentElement.classList.contains('tooltiptrigger')) {
                return eventTarget.parentElement.parentElement;
              }
            }
          }
        }
        if (eventTarget.classList.contains('anchor')) {
          return eventTarget;
        } else {
          return document.createElement('div');
        }
      } else {
        return document.createElement('div');
      }
    } catch (e) {
      console.error(e);
      return document.createElement('div');
    }
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

  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  setInfoOverlayText(text: string) {
    this.infoOverlayText = text;
  }

  setInfoOverlayTitle(title: string) {
    this.infoOverlayTitle = title;
  }

  hideToolTip() {
    this.setToolTipText('');
    this.toolTipPosType = 'fixed'; // Position needs to be fixed so we can safely hide it outside viewport
    this.toolTipPosition = {
      top: 0 + 'px',
      left: -1500 + 'px'
    };
    this.tooltipVisible = false;
  }

  hideInfoOverlay() {
    this.setInfoOverlayText('');
    this.setInfoOverlayTitle('');
    this.infoOverlayPosType = 'fixed'; // Position needs to be fixed so we can hide it outside viewport
    this.infoOverlayPosition = {
      bottom: 0 + 'px',
      left: -1500 + 'px'
    };
  }

  private scrollToElementTOC(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({behavior: 'smooth', block: 'start'});
    } catch ( e ) {
    }
  }

  showPersonModal(id: string) {
    const modal = this.modalController.create(OccurrencesPage, { id: id, type: 'subject' });
    modal.present();
  }

  showPlaceModal(id: string) {
    const modal = this.modalController.create(OccurrencesPage, { id: id, type: 'location' });
    modal.present();
  }

  showWorkModal(id: string) {
    const modal = this.modalController.create(OccurrencesPage, { id: id, type: 'work' });
    modal.present();
  }

  showPopover(myEvent) {
    const toggles = this.readPopoverTogglesIntro;
    const popover = this.popoverCtrl.create(ReadPopoverPage, {toggles}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
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

  toggleTocMenu() {
    if ( this.tocMenuOpen ) {
      this.tocMenuOpen = false;
    } else {
      this.tocMenuOpen = true;
    }
  }
}
