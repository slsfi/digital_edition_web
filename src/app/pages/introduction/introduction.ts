import { TranslateService } from '@ngx-translate/core';
import { Component, Renderer2, ElementRef, SecurityContext, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController, NavController, Platform, PopoverController } from '@ionic/angular';
import { LanguageService } from 'src/app/services/languages/language.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TooltipService } from 'src/app/services/tooltips/tooltip.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { EventsService } from 'src/app/services/events/events.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { Subscription } from 'rxjs';
import { DownloadTextsModalPage } from 'src/app/modals/download-texts-modal/download-texts-modal';
import { ReferenceDataModalPage } from 'src/app/modals/reference-data-modal/reference-data-modal';
import { SharePopoverPage } from 'src/app/modals/share-popover/share-popover';
import { ReadPopoverPage } from 'src/pages/read-popover/read-popover';
import { IllustrationPage } from 'src/app/modals/illustration/illustration';
import { OccurrencesPage } from 'src/pages/occurrences/occurrences';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ActivatedRoute } from '@angular/router';

/**
 * Generated class for the IntroductionPage page.
 *
 * Collection introduction.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'introduction',
//   segment: 'publication-introduction/:collectionID'
// })
@Component({
  selector: 'page-introduction',
  templateUrl: 'introduction.html',
  styleUrls: ['introduction.scss']
})
export class IntroductionPage {

  errorMessage: any;
  protected id?: string;
  protected text: any;
  protected textMenu: any;
  protected collection?: any;
  protected pos: any;
  public tocMenuOpen: boolean;
  public hasSeparateIntroToc: Boolean = false;
  public showURNButton: boolean;
  showDisplayOptionsButton: Boolean = true;
  readPopoverTogglesIntro: any = {};
  toolTipsSettings: any = {};
  toolTipPosType: string;
  toolTipPosition: any;
  toolTipMaxWidth: string | null;
  toolTipScaleValue: number | null;
  toolTipText?: string;
  tooltipVisible: Boolean = false;
  tooltips = {
    'persons': {} as any,
    'comments': {} as any,
    'works': {} as any,
    'places': {} as any,
    'abbreviations': {} as any,
    'footnotes': {} as any,
  };
  infoOverlayPosType: string;
  infoOverlayPosition: any;
  infoOverlayWidth: string | null;
  infoOverlayText: string;
  infoOverlayTitle: string;
  textLoading: Boolean = true;
  tocItems?: any;
  intervalTimerId: number;
  userIsTouching: Boolean = false;
  collectionLegacyId?: string;
  simpleWorkMetadata?: Boolean;
  showTextDownloadButton: Boolean = false;
  usePrintNotDownloadIcon: Boolean = false;
  languageSubscription: Subscription | null;
  hasTOCLabelTranslation: Boolean = false;
  private unlistenClickEvents?: () => void;
  private unlistenMouseoverEvents?: () => void;
  private unlistenMouseoutEvents?: () => void;
  private unlistenFirstTouchStartEvent?: () => void;
  lang: any

  constructor(
    public navCtrl: NavController,
    public langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private tooltipService: TooltipService,
    private elementRef: ElementRef,
    protected popoverCtrl: PopoverController,
    public userSettingsService: UserSettingsService,
    private events: EventsService,
    private platform: Platform,
    protected tableOfContentsService: TableOfContentsService,
    private storage: StorageService,
    public semanticDataService: SemanticDataService,
    public readPopoverService: ReadPopoverService,
    public commonFunctions: CommonFunctionsService,
    private config: ConfigService,
    public translate: TranslateService,
    private modalController: ModalController,
    private route: ActivatedRoute,
  ) {
    // this.id = this.params.get('collectionID');
    // this.collection = this.params.get('collection');
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
    this.languageSubscription = null;

    try {
      this.toolTipsSettings = this.config.getSettings('settings.toolTips');
    } catch (e) {
      this.toolTipsSettings = undefined;
      console.log('Can\'t get settings.toolTips from config. Tooltips not available.');
    }

    try {
      this.readPopoverTogglesIntro = this.config.getSettings('settings.introToggles');
    } catch (e) {
      this.readPopoverTogglesIntro = undefined;
      console.log('Can\'t get settings.readPopoverTogglesIntro from config. Using default values.');
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

    try {
      this.showURNButton = this.config.getSettings('showURNButton.pageIntroduction');
    } catch (e) {
      this.showURNButton = true;
    }

    try {
      this.showDisplayOptionsButton = this.config.getSettings('showDisplayOptionsButton.pageIntroduction');
    } catch (e) {
      this.showDisplayOptionsButton = true;
    }

    try {
      this.hasSeparateIntroToc = this.config.getSettings('separeateIntroductionToc');
    } catch (e) {
      this.hasSeparateIntroToc = false;
    }

    this.translate.get('Read.Introduction.Contents').subscribe(
      translation => {
        if (translation && translation !== 'Read.Introduction.Contents') {
          this.hasTOCLabelTranslation = true;
        } else {
          this.hasTOCLabelTranslation = false;
        }
      }, error => { this.hasTOCLabelTranslation = false; }
    );

    try {
      const textDownloadOptions = this.config.getSettings('textDownloadOptions');
      if (textDownloadOptions.enabledIntroductionFormats !== undefined &&
        textDownloadOptions.enabledIntroductionFormats !== null &&
        Object.keys(textDownloadOptions.enabledIntroductionFormats).length !== 0) {
          for (const [key, value] of Object.entries(textDownloadOptions.enabledIntroductionFormats)) {
            if (value) {
              this.showTextDownloadButton = true;
              break;
            }
          }
      }
      if (textDownloadOptions.usePrintNotDownloadIcon !== undefined) {
        this.usePrintNotDownloadIcon = textDownloadOptions.usePrintNotDownloadIcon;
      }
    } catch (e) {
      this.showTextDownloadButton = false;
    }

    // Check if we have a pos parmeter in the URL, if we have one we can use it for scrolling the text on the page to that position.
    // The pos parameter must come after the publication id followed by /#, e.g. /publication-introduction/203/#pos1
    const currentURL: string = String(window.location.href);
    if (currentURL.match(/publication-introduction\/\d+\/#\w+/) !== null) {
      this.pos = currentURL.split('#').pop();
    } else {
      this.pos = null;
    }

  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'introduction'});
  }

  ngOnInit() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.lang = lang;
      if (this.lang && this.id) {
        this.loadIntroduction(lang, this.id);
      }
    });

    this.route.params.subscribe(params => {
      this.id = params['collectionID'];

      if (this.id) {
        this.events.publishSelectedItemInMenu({
          menuID: this.id,
          component: 'introduction'
        });

        this.setCollectionLegacyId(this.id);
        this.setUpTextListeners(this.id);
      }

      if (this.lang && this.id) {
        this.loadIntroduction(this.lang, this.id);
      }
    })
  }

  loadIntroduction(lang: string, id: string) {
    this.text = '';
    this.textLoading = true;
    this.textService.getIntroduction(id, lang).subscribe(
      res => {
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
    const selectedStatic = [] as any;
    selectedStatic['isIntroduction'] = true;
    this.events.publishSetSelectedStaticTrue(selectedStatic);
  }

  ionViewWillLeave() {
    this.unlistenClickEvents?.();
    this.unlistenMouseoverEvents?.();
    this.unlistenMouseoutEvents?.();
    this.unlistenFirstTouchStartEvent?.();
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  /** Try to scroll to an element in the text, checks if "pos" given.
   *  Timeout, to give text some time to load on the page. */
  private scrollToPos() {
    const that = this;
    this.ngZone.runOutsideAngular(() => {
      let iterationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = window.setInterval(function() {
        if (iterationsLeft < 1) {
          clearInterval(that.intervalTimerId);
        } else {
          iterationsLeft -= 1;
          if (that.pos !== null && that.pos !== undefined) {
            let posElem: HTMLElement | null = document.querySelector('page-introduction:not([hidden]) [name="' + that.pos + '"]');
            if (posElem !== null && posElem !== undefined) {
              const parentElem = posElem.parentElement;
              if (parentElem) {
                if ( (parentElem !== null && parentElem.classList.contains('ttFixed'))
                || (parentElem.parentElement !== null && parentElem.parentElement.classList.contains('ttFixed')) ) {
                    // Anchor is in footnote --> look for next occurence since the first footnote element
                    // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
                    // the position we need to find).
                    posElem = document.querySelectorAll('page-introduction:not([hidden]) [name="' + that.pos + '"]')[1] as HTMLElement;
                }
              }
              if (posElem !== null && posElem !== undefined && posElem.classList !== null
              && posElem.classList.contains('anchor')) {
                that.commonFunctions.scrollToHTMLElement(posElem);
                clearInterval(that.intervalTimerId);
              }
            }
          } else {
            clearInterval(that.intervalTimerId);
          }
        }
      }.bind(this), 1000);
    });
  }

  setCollectionLegacyId(id: string) {
    this.textService.getLegacyIdByCollectionId(id).subscribe(
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

  private setUpTextListeners(id: string) {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CHECK ONCE IF THE USER IF TOUCHING THE SCREEN */
      this.unlistenFirstTouchStartEvent = this.renderer2.listen(nElement, 'touchstart', (event) => {
        this.userIsTouching = true;
        // Don't listen for mouseover and mouseout events since they should have no effect on touch devices
        this.unlistenMouseoverEvents?.();
        this.unlistenMouseoutEvents?.();
        this.unlistenFirstTouchStartEvent?.();
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
              this.showPersonModal(eventTarget.getAttribute('data-id') || '');
            } else if (eventTarget.classList.contains('placeName') && this.readPopoverService.show.placeInfo) {
              this.showPlaceModal(eventTarget.getAttribute('data-id') || '');
            } else if (eventTarget.classList.contains('title') && this.readPopoverService.show.workInfo) {
              this.showWorkModal(eventTarget.getAttribute('data-id') || '');
            } else if (eventTarget.classList.contains('ttFoot')) {
              this.showFootnoteInfoOverlay(eventTarget.getAttribute('data-id') || '', eventTarget);
            }
          });
        }

        // Possibly click on link.
        eventTarget = event.target as HTMLElement;
        if (eventTarget !== null && !eventTarget.classList.contains('xreference')) {
          if (eventTarget.parentElement) {
            eventTarget = eventTarget.parentElement;
            if (eventTarget !== null) {
              if (!eventTarget.classList.contains('xreference') && eventTarget.parentElement) {
                eventTarget = eventTarget.parentElement;
              }
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
            const hrefTargetItems: Array<string> = decodeURIComponent(String(link).split('/').pop() || '').trim().split(' ');
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
                if (newWindowRef) {
                  newWindowRef.location.href = hrefString;
                }
              });

            } else if (anchorElem.classList.contains('ref_introduction')) {
              // Link to introduction.
              if (hrefTargetItems.length === 1 && hrefTargetItems[0].startsWith('#')) {
                // If only a position starting with a hash, assume it's in the same publication.
                publicationId = id;
                positionId = hrefTargetItems[0];
              } else {
                publicationId = hrefTargetItems[0];
              }
              if (hrefTargetItems.length > 1 && hrefTargetItems[hrefTargetItems.length - 1].startsWith('#')) {
                positionId = hrefTargetItems[hrefTargetItems.length - 1];
              }

              // Check if we are already on the same page.
              if ( (String(publicationId) === String(this.id) || String(publicationId) === String(this.collectionLegacyId))
              && positionId !== undefined ) {
                // Same introduction.
                positionId = positionId.replace('#', '');

                // Find the element in the correct parent element.
                const matchingElements = document.querySelectorAll('page-introduction:not([hidden]) [name="' + positionId + '"]');
                let targetElement = null;
                for (let i = 0; i < matchingElements.length; i++) {
                  targetElement = matchingElements[i] as HTMLElement;
                  if (targetElement.parentElement?.classList.contains('ttFixed')
                  || targetElement.parentElement?.parentElement?.classList.contains('ttFixed')) {
                    // Found position is in footnote --> look for next occurence since the first footnote element
                    // is not displayed (footnote elements are copied to a list at the end of the introduction and that's
                    // the position we need to find).
                  } else {
                    break;
                  }
                }
                if (targetElement !== null && targetElement.classList.contains('anchor')) {
                  this.commonFunctions.scrollToHTMLElement(targetElement);
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
                  if (newWindowRef) {
                    newWindowRef.location.href = hrefString;
                  }
                });
              }
            }
          } else if (anchorElem.classList.contains('ref_illustration')) {
            const imageNumber = anchorElem.hash.split('#')[1];
            this.ngZone.run(() => {
              this.showIllustrationModal(imageNumber);
            });
          } else {
            // Link in the introduction's TOC or link to (foot)note reference
            let targetId = '' as any;
            if (anchorElem.hasAttribute('href')) {
              targetId = anchorElem.getAttribute('href');
            } else if (anchorElem.parentElement?.hasAttribute('href')) {
              targetId = anchorElem.parentElement.getAttribute('href');
            }
            const dataIdSelector = '[data-id="' + String(targetId).replace('#', '') + '"]';
            let target = anchorElem.ownerDocument.querySelector('page-introduction:not([hidden])') as HTMLElement;
            target = target.querySelector(dataIdSelector) as HTMLElement;
            if (target !== null) {
              if (anchorElem.classList.contains('footnoteReference')) {
                // Link to (foot)note reference, prepend arrow
                this.commonFunctions.scrollToHTMLElement(target, 'top');
              } else {
                // Link in the introduction's TOC, scroll to target but don't prepend arrow
                this.commonFunctions.scrollElementIntoView(target, 'top');
              }
            }
          }
        }
      });

      /* MOUSE OVER EVENTS */
      this.unlistenMouseoverEvents = this.renderer2.listen(nElement, 'mouseover', (event) => {
        if (!this.userIsTouching) {
          // Mouseover effects only if using a cursor, not if the user is touching the screen
          const eventTarget = this.getEventTarget(event) as any;

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
        const text = this.tooltipService.constructPersonTooltipText(tooltip, targetElem);
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
        let text = '<b>' + tooltip.name.trim() + '</b>';
        if (tooltip.description) {
          text = text + ', ' + tooltip.description.trim();
        }
        this.setToolTipPosition(targetElem, text);
        this.setToolTipText(text);
        this.tooltips.places[id] = text;
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

    if (this.simpleWorkMetadata === undefined) {
      try {
        this.simpleWorkMetadata = this.config.getSettings('useSimpleWorkMetadata');
      } catch (e) {
        this.simpleWorkMetadata = false;
      }
    }

    if (this.simpleWorkMetadata === false || this.simpleWorkMetadata === undefined) {
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
    } else {
      this.tooltipService.getWorkTooltip(id).subscribe(
        tooltip => {
          this.setToolTipPosition(targetElem, tooltip.description);
          this.setToolTipText(tooltip.description);
          this.tooltips.works[id] = tooltip.description;
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
    const footNoteHTML = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.setToolTipPosition(targetElem, footNoteHTML || '');
    this.setToolTipText(footNoteHTML || '');
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
    const footNoteHTML = this.sanitizer.sanitize(SecurityContext.HTML,
      this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));

    this.translate.get('note').subscribe(
      translation => {
        this.setInfoOverlayTitle(translation);
      }, error => { }
    );
    this.setInfoOverlayPositionAndWidth(targetElem);
    this.setInfoOverlayText(footNoteHTML || '');
    if (this.userSettingsService.isDesktop()) {
      this.tooltips.footnotes[id] = footNoteHTML;
    }
  }

  setToolTipPosition(targetElem: HTMLElement, ttText: string) {
    const ttProperties = this.tooltipService.getTooltipProperties(targetElem, ttText, 'page-introduction');

    if (ttProperties !== undefined && ttProperties !== null) {
      // Set tooltip width, position and visibility
      this.toolTipMaxWidth = ttProperties.maxWidth;
      this.toolTipScaleValue = ttProperties.scaleValue;
      this.toolTipPosition = {
        top: ttProperties.top,
        left: ttProperties.left
      };
      this.toolTipPosType = 'absolute';
      if (!this.userSettingsService.isDesktop()) {
        this.toolTipPosType = 'fixed';
      }
      this.tooltipVisible = true;
    }
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
    const contentElem = document.querySelector('page-introduction:not([hidden]) > ion-content > .scroll-content') as HTMLElement;
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
      if (vw <= bottomPosBreakpointWidth && !(this.userSettingsService.isMobile())) {
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

  private getEventTarget(event: any) {
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
        (tocItems: any) => {
          this.tocItems = tocItems;
          console.log('get toc root... --- --- in single edition');
          const tocLoadedParams = { tocItems: tocItems } as any;
          tocLoadedParams['collectionID'] = this.tocItems['collectionId'];
          tocLoadedParams['searchTocItem'] = true;
          this.events.publishTableOfContentsLoaded(tocLoadedParams);
          this.storage.set('toc_' + id, tocItems);
        },
        error => { this.errorMessage = <any>error });
    } else {
      this.tocItems = this.collection['accordionToc']['toc'];
      const tocLoadedParams = { tocItems: this.tocItems } as any;
      tocLoadedParams['collectionID'] = 'mediaCollections';
      tocLoadedParams['searchTocItem'] = true;
      this.events.publishTableOfContentsLoaded(tocLoadedParams);
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

  async showPersonModal(id: string) {
    const modal = await this.modalController.create({
      component: OccurrencesPage,
      componentProps: { id, type: 'subject' },
    });
    modal.present();
  }

  async showPlaceModal(id: string) {
    const modal = await this.modalController.create({
      component: OccurrencesPage,
      componentProps: { id, type: 'location' },
    });
    modal.present();
  }

  async showWorkModal(id: string) {
    const modal = await this.modalController.create({
      component: OccurrencesPage,
      componentProps: { id, type: 'work' },
    });
    modal.present();
  }

  async showIllustrationModal(imageNumber: string) {
    const modal = await this.modalController.create({
      component: IllustrationPage,
      componentProps: { 'imageNumber': imageNumber },
      cssClass: 'foo',
    });
    modal.present();
  }

  async showPopover(myEvent: any) {
    const toggles = this.readPopoverTogglesIntro;
    const modal = await this.popoverCtrl.create({
      component: ReadPopoverPage,
      componentProps: { toggles },
      cssClass: 'share-popover_settings'
    });
    modal.present(myEvent);
  }

  async showSharePopover(myEvent: any) {
    const modal = await this.popoverCtrl.create({
      component: SharePopoverPage,
      cssClass: 'share-popover'
    });
    modal.present(myEvent);
  }

  public async showReference() {
    // Get URL of Page and then the URI
    const modal = await this.modalController.create({
      component: ReferenceDataModalPage,
      componentProps: {id: document.URL, type: 'reference', origin: 'page-introduction'}
    });
    modal.present();
  }

  public async showDownloadModal() {
    const modal = await this.modalController.create({
      component: DownloadTextsModalPage,
      componentProps: {textId: this.id, origin: 'page-introduction'}
    });
    modal.present();
  }

  toggleTocMenu() {
    if ( this.tocMenuOpen ) {
      this.tocMenuOpen = false;
    } else {
      this.tocMenuOpen = true;
    }
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-intro-content';
    } else {
      return '';
    }
  }
}
