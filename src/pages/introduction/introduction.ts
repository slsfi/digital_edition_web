import { Component, Renderer, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, Platform } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { TooltipService } from '../../app/services/tooltips/tooltip.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';

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
  segment: 'publication-introduction/:collectionID/'
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
    private userSettingsService: UserSettingsService,
    private events: Events,
    private platform: Platform,
    public readPopoverService: ReadPopoverService,
    private config: ConfigService
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');
    this.tocMenuOpen = true;
    if (this.platform.is('mobile')) {
      this.tocMenuOpen = false;
    }

    try {
      this.hasSeparateIntroToc = this.config.getSettings('separeateIntroductionToc');
    } catch (error) {
      this.hasSeparateIntroToc = false;
    }

  }

  ionViewDidLoad() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(this.id, lang).subscribe(
        res => {
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
        error =>  {this.errorMessage = <any>error}
      );
    });

    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      try {
        event.stopPropagation();
        event.preventDefault();
        const elem: HTMLElement = event.target as HTMLElement;
        let targetId = elem.getAttribute('href');
        if ( targetId === null ) {
          targetId = elem.parentElement.getAttribute('href');
        }
        const target = elem.ownerDocument.getElementById(String(targetId).replace('#', '')) as HTMLElement;
        if ( target !== null ) {
           this.scrollToElementTOC(target, event);
        }
      } catch ( e ) {}
    });

    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      try {
        event.stopPropagation();
        event.preventDefault();
        const elem: HTMLElement = event.target as HTMLElement;
        let targetId = elem.getAttribute('href');
        if ( targetId === null ) {
          targetId = elem.parentElement.getAttribute('href');
        }
        const target = elem.ownerDocument.getElementById(String(targetId).replace('#', '')) as HTMLElement;
        if ( target !== null ) {
           this.scrollToElementTOC(target, event);
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
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const sidePaneIsOpen = document.querySelector('ion-split-pane').classList.contains('split-pane-visible');

      const eventTarget = this.getEventTarget(event);
      const elem = event.target;
      if (eventTarget['classList'].contains('tooltiptrigger')) {
        console.log(elem);
        const x = ((elem.getBoundingClientRect().x + vw) - vw) + (elem.offsetWidth + 10);
        const y = ((elem.getBoundingClientRect().y + vh) - vh) - 108;
        if (sidePaneIsOpen) {
          this.toolTipPosition = {
            top: y + 'px',
            left: (x - 269) + 'px'
          };
        } else {
          this.toolTipPosition = {
            top: y + 'px',
            left: x + 'px'
          };
        }

        console.log(elem.offsetTop )

        if (eventTarget.hasAttribute('data-id')) {
          if (toolTipsSettings.personInfo && eventTarget['classList'].contains('person') && this.readPopoverService.show.personInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showPersonTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.placeInfo
            && eventTarget['classList'].contains('placeName')
            && this.readPopoverService.show.placeInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showPlaceTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.workInfo
            && eventTarget['classList'].contains('title')
            && this.readPopoverService.show.workInfo) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showWorkTooltip(eventTarget.getAttribute('data-id'), event);
          } else if (toolTipsSettings.footNotes
            && eventTarget['classList'].contains('ttFoot')) {
            this.showToolTip = true;
            clearTimeout(window['reload_timer']);
            this.hideToolTip();
            this.showFootnoteTooltip(eventTarget.getAttribute('data-id'), event);
          }
        } else {

        }
      } else if (eventTarget['classList'].contains('anchor')) {
        if (eventTarget.hasAttribute('href')) {
          this.scrollToElement(eventTarget.getAttribute('href'));
        }
      }
    }).bind(this);
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

    this.tooltipService.getWorkTooltip(id).subscribe(
      tooltip => {
        this.setToolTipText(tooltip.description);
        this.tooltips.works[id] = tooltip.description;
      },
      error => {
        this.setToolTipText('Could not get work information');
      }
    );
  }

  showFootnoteTooltip(id: string, origin: any) {
    const target = document.getElementsByClassName('ttFixed');
    let foundElem: any = '';
    for (let i = 0; i < target.length; i++) {
      const elt = target[i] as HTMLElement;
      if ( elt.getAttribute('data-id') === id ) {
        foundElem = this.sanitizer.bypassSecurityTrustHtml(elt.innerHTML);
        break;
      }
    }
    this.setToolTipText(foundElem);
    this.tooltips.footnotes[id] = foundElem;
    return foundElem;
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
        this.setToolTipText('Could not get place information');
      }
    );
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

  showPersonTooltip(id: string, origin: any) {
    if (this.tooltips.persons[id]) {
      this.setToolTipText(this.tooltips.persons[id]);
      return;
    }

    this.tooltipService.getPersonTooltip(id).subscribe(
      tooltip => {
        this.setToolTipText(tooltip.description);
        this.tooltips.persons[id] = tooltip.description;
      },
      error => {
        this.setToolTipText('Could not get person information');
      }
    );
  }

  setToolTipText(text: string) {
    this.toolTipText = text;
  }

  hideToolTip() {
    window['reload_timer'] = setTimeout(() => {
      this.showToolTip = false;
    }, 4000);
  }

  private scrollToElementTOC(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'start'});
    } catch ( e ) {
      console.log(e);
    }
  }

 private toggleTocMenu() {
   if ( this.tocMenuOpen ) {
    this.tocMenuOpen = false;
   } else {
    this.tocMenuOpen = true;
   }
 }
}
