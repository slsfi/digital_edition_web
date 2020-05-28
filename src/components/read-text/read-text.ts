
import { Component, Input, ElementRef, Renderer } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { Storage } from '@ionic/storage';
import { ToastController, Events, ModalController } from 'ionic-angular';
import { IllustrationPage } from '../../pages/illustration/illustration';
import { ConfigService } from '@ngx-config/core';
import { TextCacheService } from '../../app/services/texts/text-cache.service';

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
  public text: any;
  protected errorMessage: string;
  defaultView: string;
  apiEndPoint: string;
  appMachineName: string;

  constructor(
    public events: Events,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    protected storage: Storage,
    private toastCtrl: ToastController,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private config: ConfigService,
    protected modalController: ModalController
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.defaultView = this.config.getSettings('defaults.ReadModeView');
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
  }

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
    try {
      if (this.config.getSettings('settings.showReadTextIllustrations')) {
        const showIllustration = this.config.getSettings('settings.showReadTextIllustrations');

        if (event.target.classList.contains('doodle')) {
          const image = {src: '/assets/images/verk/' + String(event.target.dataset.id).replace('tag_', '') + '.jpg', class: 'doodle'};
          this.events.publish('give:illustration', image);
        }
        if ( showIllustration.includes(this.link.split('_')[1])) {
          if (event.target.classList.contains('est_figure_graphic')) {
            const image = {src: event.target.src, class: 'illustration'};
            this.events.publish('give:illustration', image);
          }
        } else {
          if (event.target.previousElementSibling.classList.contains('est_figure_graphic')) {
            const image = {src: event.target.previousElementSibling.src, class: 'illustration'};
            this.events.publish('give:illustration', image);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }


      if (event.target.parentNode.classList.contains('ref_illustration')) {
        const hashNumber = event.target.parentNode.hash;
        const imageNumber = hashNumber.split('#')[1];
        this.openIllustration(imageNumber);
      }
    });
    setTimeout(function() {
      const linkData = this.link.split(';');
        if ( linkData[1] ) {
          const target = document.getElementsByName('' + linkData[1] + '')[0] as HTMLAnchorElement;
          if ( target ) {
            this.scrollToHTMLElement(target, false);
          } else {
            const list = document.getElementsByName('' + linkData[1] + '') as NodeList;
            list.forEach(ele => {
              console.log(ele);
            })
          }
        }
    }.bind(this), 500);

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
      this.text = content;
      this.text = this.sanitizer.bypassSecurityTrustHtml(
        content.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/19/`)
          .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"').replace(/images\//g, 'assets/images/')
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
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          text.replace(/images\/verk\//g, `${this.apiEndPoint}/${this.appMachineName}/gallery/get/19/`)
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"').replace(/images\//g, 'assets/images/')
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
      error => { this.errorMessage = <any>error }
    );
  }

  private scrollToHTMLElement(element: HTMLElement, addTag: boolean, timeOut = 8000) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'start'});
      const tmp = element.previousElementSibling as HTMLElement;
      let addedArrow = false;

      if ( tmp !== null && tmp !== undefined && tmp.classList.contains('anchor_lemma') ) {
        tmp.style.display = 'inline';
        setTimeout(function() {
          tmp.style.display = 'none';
        }, 2000);
        addedArrow = true;
      } else {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
        addedArrow = true;
      }

      if ( addTag && !addedArrow ) {
        element.innerHTML = '<img class="inl_ms_arrow" src="assets/images/ms_arrow_right.svg"/>';
        setTimeout(function() {
          element.innerHTML = '';
        }, timeOut);
      }
    } catch ( e ) {
      console.error(e);
    }
  }

  doAnalytics() {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Established',
        eventLabel: 'Established',
        eventAction: this.link,
        eventValue: 10
      });
    } catch ( e ) {
    }
  }
}
