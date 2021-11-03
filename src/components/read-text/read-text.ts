
import { Component, Input, ElementRef, Renderer2, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { Storage } from '@ionic/storage';
import { ToastController, Events, ModalController, App } from 'ionic-angular';
import { IllustrationPage } from '../../pages/illustration/illustration';
import { ConfigService } from '@ngx-config/core';
import { TextCacheService } from '../../app/services/texts/text-cache.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
/**
 * Generated class for the ReadTextComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'read-text',
  templateUrl: 'read-text.html'
})
export class ReadTextComponent {

  @Input() link: string;
  @Input() matches?: Array<string>;
  @Input() external?: string;
  @Input() nochapterPos?: string;
  public text: any;
  protected errorMessage: string;
  defaultView: string;
  apiEndPoint: string;
  appMachineName: string;
  textLoading: Boolean = true;
  intervalTimerId: number;
  pos: string;
  private unlistenClickEvents: () => void;

  constructor(
    private app: App,
    public events: Events,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    protected storage: Storage,
    private toastCtrl: ToastController,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private config: ConfigService,
    protected modalController: ModalController,
    private analyticsService: AnalyticsService
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.defaultView = this.config.getSettings('defaults.ReadModeView');
    this.intervalTimerId = 0;
  }

  ngOnInit() {
    if ( this.external !== undefined && this.external !== null ) {
      const extParts = String(this.external).split(' ');
      this.textService.getCollectionAndPublicationByLegacyId(extParts[0] + '_' + extParts[1]).subscribe(data => {
        if ( data[0] !== undefined ) {
          this.link = data[0]['coll_id'] + '_' + data[0]['pub_id'];
        }
        this.setText();
      });
    } else {
      this.setText();
    }
    this.setUpTextListeners();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      // Scroll to link position if defined.
      let interationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = window.setInterval(function() {
        if (interationsLeft < 1) {
          clearInterval(this.intervalTimerId);
        } else {
          interationsLeft -= 1;
          let posId = null;
          if (this.nochapterPos !== undefined && this.nochapterPos !== null) {
            posId = this.nochapterPos;
          } else if ( this.link !== undefined ) {
            const linkData = this.link.split(';');
            if (linkData[1]) {
              posId = linkData[1];
            } else {
              clearInterval(this.intervalTimerId);
            }
          } else {
            clearInterval(this.intervalTimerId);
          }

          if (posId) {
            let target = document.getElementsByName('' + posId + '')[0] as HTMLAnchorElement;
            if ( target && ((target.parentElement && target.parentElement.classList.contains('ttFixed'))
            || (target.parentElement.parentElement && target.parentElement.parentElement.classList.contains('ttFixed'))) ) {
              // Position in footnote --> look for second target
              target = document.getElementsByName('' + posId + '')[1] as HTMLAnchorElement;
            }
            if (target) {
              this.scrollToHTMLElement(target, false);
              clearInterval(this.intervalTimerId);
            }
          } else {
            clearInterval(this.intervalTimerId);
          }
        }
      }.bind(this), 1000);
    });
  }

  ngOnDestroy() {
    this.unlistenClickEvents();
  }

  openNewView( event, id: any, type: string ) {
    let openId = id;
    let chapter = null;
    if (String(id).includes('ch')) {
      openId = String(String(id).split('ch')[0]).trim();
      chapter = 'ch' + String(String(id).split('ch')[1]).trim();
    }
    this.events.publish('show:view', type, openId, chapter);
  }

  private setIllustrationImages() {
    this.textService.getEstablishedText(this.link).subscribe(text => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/html');
      const images: any = xmlDoc.querySelectorAll('img.est_figure_graphic');
      for (let i = 0; i < images.length ; i++) {
        images[i].classList.add('show-illustration');
      }
    });
  }

  openIllustration(imageNumber) {
    const modal = this.modalController.create(IllustrationPage,
      { 'imageNumber': imageNumber },
      { cssClass: 'foo' }
    );
    modal.present();
    modal.onDidDismiss(data => {

    });
  }

  onClickFFiT(event) {
  }

  getCacheText(id: string) {
    this.storage.get(id).then((content) => {
      this.textLoading = false;
      const c_id = String(this.link).split('_')[0];
      let galleryId = 44;
      try {
        galleryId = this.config.getSettings('settings.galleryCollectionMapping')[c_id];
      } catch ( err ) {

      }
      if ( String(content).includes('images/verk/http') ) {
        content = content.replace(/images\/verk\//g, '');
      } else {
        content = content.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`);
      }
      content = content.replace(/\.png/g, '.svg');
      content = content.replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"');
      content = content.replace(/images\//g, 'assets/images/');
      this.text = this.sanitizer.bypassSecurityTrustHtml(
        content
      );
      this.matches.forEach(function (val) {
        const re = new RegExp('(' + val + ')', 'g');
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          content.replace(re, '<match>$1</match>')
        );
      }.bind(this));
    });
  }

  setText() {
    this.storage.get(this.link + '_est').then((content) => {
      if (content) {
        this.getCacheText(this.link + '_est');
      } else {
        this.getEstText();
      }
      this.doAnalytics();
    });
  }

  getEstText() {
    this.textService.getEstablishedText(this.link).subscribe(
      text => {
        this.textLoading = false;
        const c_id = String(this.link).split('_')[0];
        let galleryId = 44;
        try {
          galleryId = this.config.getSettings('settings.galleryCollectionMapping')[c_id];
        } catch ( err ) {

        }
        if ( String(text).includes('/images/verk/http') ) {
          text = text.replace(/images\/verk\//g, '');
        } else {
          text = text.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/${galleryId}/`);
        }
        text = text.replace(/\.png/g, '.svg');
        text = text.replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"');
        text = text.replace(/images\//g, 'assets/images/');
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          text
        );
        if (this.matches instanceof Array && this.matches.length > 0) {
          let tmpText: any = '';
          this.matches.forEach(function (val) {
            const re = new RegExp('(' + val + ')', 'ig');
            tmpText = this.sanitizer.bypassSecurityTrustHtml(
              text.replace(re, '<match>$1</match>')
            );
          }.bind(this));
          this.text = tmpText;
        }
      },
      error => { this.errorMessage = <any>error; this.textLoading = false; }
    );
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        try {
          const eventTarget = event.target as HTMLElement;
          // some of the texts e.g. ordsprak.sls.fi links to external sites
          if ( eventTarget.hasAttribute('href') === true && eventTarget.getAttribute('href').includes('http') === false ) {
            event.preventDefault();
          }
          if (this.config.getSettings('settings.showReadTextIllustrations')) {
            const showIllustration = this.config.getSettings('settings.showReadTextIllustrations');

            if (eventTarget.classList.contains('doodle')) {
              const image = {src: '/assets/images/verk/' + String(eventTarget.dataset.id).replace('tag_', '') + '.jpg', class: 'doodle'};
              if ( document.querySelector('illustrations') === null ) {
                this.ngZone.run(() => {
                  this.openNewView(event, null, 'illustrations');
                });
              }
              this.ngZone.run(() => {
                this.events.publish('give:illustration', image);
              });
            }
            if ( showIllustration.includes(this.link.split('_')[1])) {
              if (eventTarget.classList.contains('est_figure_graphic')) {
                // Check if we have the "illustrations" tab open, if not, open
                const image = {src: event.target.src, class: 'illustration'};
                if ( document.querySelector('illustrations') === null ) {
                  this.ngZone.run(() => {
                    this.openNewView(event, null, 'illustrations');
                    // Wait for the DOM to get updated with the illustrations tab before publishing image
                    setTimeout(function () {
                      this.events.publish('give:illustration', image);
                    }.bind(this), 1000);
                  });
                } else {
                  this.ngZone.run(() => {
                    this.events.publish('give:illustration', image);
                  });
                }
              }
            } else {
              if (eventTarget.previousElementSibling !== null &&
                eventTarget.previousElementSibling.classList.contains('est_figure_graphic')) {
                // Check if we have the "illustrations" tab open, if not, open
                const image = {src: event.target.previousElementSibling.src, class: 'illustration'};
                if ( document.querySelector('illustrations') === null ) {
                  this.ngZone.run(() => {
                    this.openNewView(event, null, 'illustrations');
                    // Wait for the DOM to get updated with the illustrations tab before publishing image
                    setTimeout(function () {
                      this.events.publish('give:illustration', image);
                    }.bind(this), 1000);
                  });
                } else {
                  this.ngZone.run(() => {
                    this.events.publish('give:illustration', image);
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }

        if (event.target.parentNode.classList.contains('ref_illustration')) {
          const hashNumber = event.target.parentNode.hash;
          const imageNumber = hashNumber.split('#')[1];
          this.ngZone.run(() => {
            this.openIllustration(imageNumber);
          });
        }
      });

    });
  }

  private scrollToHTMLElement(element: HTMLElement, addTag: boolean, position = 'top', timeOut = 5000) {
    try {
      const tmp = element.previousElementSibling as HTMLElement;
      let addedArrow = false;

      if ( tmp !== null && tmp !== undefined && tmp.classList.contains('anchor_lemma') ) {
        tmp.style.display = 'inline';
        this.scrollElementIntoView(tmp, position);
        setTimeout(function() {
          tmp.style.display = 'none';
        }, timeOut);
        addedArrow = true;
      } else {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.alt = 'ms arrow right image';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        this.scrollElementIntoView(tmpImage, position);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
        addedArrow = true;
      }

      if ( addTag && !addedArrow ) {
        element.innerHTML = '<img class="inl_ms_arrow" alt="arrow right image" src="assets/images/ms_arrow_right.svg"/>';
        this.scrollElementIntoView(element, position);
        setTimeout(function() {
          element.innerHTML = '';
        }, timeOut);
      }
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

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Established', 'Established', String(this.link));
  }
}
