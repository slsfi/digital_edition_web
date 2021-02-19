import { TranslateService } from '@ngx-translate/core';
import { Component, Renderer, ElementRef } from '@angular/core';
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
            // this.moveTooltipInPosition();
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

    this.moveTooltipInPosition(targetElem, footnoteWithIndicator);

    this.setToolTipText(this.sanitizer.bypassSecurityTrustHtml(footnoteWithIndicator));
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

  moveTooltipInPosition(targetElem: HTMLElement, ttText: string) {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const sidePaneIsOpen = document.querySelector('ion-split-pane').classList.contains('split-pane-visible');

    const tooltipElement: HTMLElement = document.querySelector('div.toolTip');
    let hiddenDiv: HTMLElement = document.createElement('div');

    // Loop over each class in the tooltip div and add them to the hidden div
    const ttClasses = tooltipElement.classList;
    ttClasses.forEach(className => {
      hiddenDiv.classList.add(className);
    });

    hiddenDiv.style.display = 'none';
    // Append hidden div to the parent of the tooltip div
    tooltipElement.parentNode.appendChild(hiddenDiv);
    // Add content to the hidden div
    hiddenDiv.innerHTML = ttText;
    // Briefly make the hidden div block but invisible. This is in order to read the height
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.style.display = 'block';
    let ttHeight = hiddenDiv.offsetHeight;
    let ttWidth = hiddenDiv.offsetWidth;
    // Make the hidden div display:none again
    hiddenDiv.style.visibility = 'visible';
    hiddenDiv.style.display = 'none';
    // Remove hidden div
    hiddenDiv.remove();
    
    /* Get rectangle which contains tooltiptrigger element */
    const elemRect = targetElem.getBoundingClientRect();

    // Set vertical offset due to toolbar
    const yOffset = 75;
    const secToolbarHeight = 50;

    let freePosition: boolean = false;

    let x = ((elemRect.left + vw) - vw) + (targetElem.offsetWidth + 8);
    let y = ((elemRect.top + vh) - vh) - yOffset;
    let sidePaneOffsetWidth = 0;

    if (sidePaneIsOpen) {
      sidePaneOffsetWidth = 269;
    }

    /*  Check if tooltip would be drawn outside the viewport on the right.
        Move it to the left side of the trigger if there is enough space to show it there. */
    const oversetX = x + ttWidth - vw;
    let oversetY = elemRect.top + ttHeight - window.innerHeight;
    if (oversetX > 0) {
      if (oversetY > 0) {
        // Overset both vertically and horisontally. Check if tooltip can be moved to the left
        // and upwards
        if (elemRect.left - sidePaneOffsetWidth > ttWidth + 8 && y - secToolbarHeight > oversetY) {
          // Move tooltip to the left side of the trigger and upwards
          x = elemRect.left - ttWidth - 8;
          y = y - oversetY;
        } else {
          // The tooltip needs to be placed more freely and it's width increased.
          freePosition = true;
        }
      } else {
        // Overset only horisontally. Check if there is room on the left side of the trigger.
        if (elemRect.left - sidePaneOffsetWidth > ttWidth + 8) {
          // There is room on the left --> move tooltip there
          x = elemRect.left - ttWidth - 8;
        } else {
          // There is not room on the left. The tooltip should be squeezed in on the right. 
          // Need to check if there is vertical room for a narrower tooltip there.

          // Calc how much space there is on either side
          const spaceRight = vw - x;
          const spaceLeft = elemRect.left - sidePaneOffsetWidth - 8;
          const maxSpace = Math.max(spaceRight, spaceLeft);
          if (spaceLeft > spaceRight) {
            // Calc new horisontal position since the tooltip will be placed on the left
            x = elemRect.left - maxSpace;
          }


          let hiddenDiv: HTMLElement = document.createElement('div');
          ttClasses.forEach(className => {
            hiddenDiv.classList.add(className);
          });
          hiddenDiv.style.display = 'none';
          // hiddenDiv.style.width = maxSpace + 'px';
          hiddenDiv.setAttribute('style', 'max-width: ' + maxSpace + 'px !important');
          // Append hidden div to the parent of the tooltip div
          tooltipElement.parentNode.appendChild(hiddenDiv);
          // Add content to the hidden div
          hiddenDiv.innerHTML = ttText;
          // Make div visible again to calculate its width and height
          hiddenDiv.style.visibility = 'hidden';
          hiddenDiv.style.display = 'block';
          ttHeight = hiddenDiv.offsetHeight;
          ttWidth = hiddenDiv.offsetWidth;
          // Make the hidden div display:none again
          hiddenDiv.style.visibility = 'visible';
          hiddenDiv.style.display = 'none';
          // Remove hidden div
          hiddenDiv.remove();

          // Check if the narrower tooltip fits
          // if (ttWidth <= maxSpace) {
            // There is room, check vertical space
            oversetY = elemRect.top + ttHeight - window.innerHeight;
            if (oversetY > 0) {
              if (y - secToolbarHeight > oversetY) {
                // Move the y position upwards by oversetY
                y = y - oversetY;
              } else {
                // The tooltip needs to be placed more freely and it's width increased.
                freePosition = true;
              }
            }
          // }
        }
      }
    } else if (oversetY > 0) {
      // Overset only vertically. Check if there is room to move the tooltip upwards.
      if (y - secToolbarHeight > oversetY) {
        // Move the y position upwards by oversetY
        y = y - oversetY;
      } else {
        // There is not room to move the tooltip just upwards. Check if there is more room on either 
        // side of the trigger so the width of the tooltip could be increased.
        



        
        // The tooltip needs to be placed more freely and it's width increased.
        freePosition = true;
      }
    }

    if (freePosition) {
      // The tooltip could not be placed next to the trigger, so it has to be placed
      // more freely.

    }


    // OLD WORKING CODE
    // if (x + ttWidth > vw && elemRect.left - sidePaneOffsetWidth > ttWidth + 8) {
    // x = elemRect.left - ttWidth - 8;
    // }

    /*  Check if tooltip would be drawn outside the viewport on the bottom.
        Move it upwards if there is enough space to show it there. */
    // let oversetY = elemRect.top + ttHeight - window.innerHeight;
    // if (oversetY > 0) {
      // Check if there is enough room at the top to move the tooltip upwards
    // if (y > oversetY) {
        // Move the y position upwards by oversetY
    // y = y - oversetY;
    //    if (y < yOffset) {
          // The top will be beneath the secondary toolbar --> do something
    //    }
    //  } else {
    //    y = yOffset;
    //    x = sidePaneOffsetWidth + 16;
        //tooltipElement.style.setProperty('max-width', '90', 'important');
    //  }
    // }
    // OLD WORKING CODE END




    // Set tooltip position
    this.toolTipPosition = {
      top: y + 'px',
      left: (x - sidePaneOffsetWidth) + 'px'
    };
    
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
      this.moveTooltipInPosition(targetElem, this.tooltips.persons[id]);
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        this.moveTooltipInPosition(targetElem, tooltip.description);
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
