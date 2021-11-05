import { Component, Input, OnDestroy } from '@angular/core';
import { NavParams, Events } from 'ionic-angular';
import { TextService } from '../../app/services/texts/text.service';
import { ModalController } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { FacsimileZoomModalPage } from '../../pages/facsimile-zoom/facsimile-zoom';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { TranslateService } from '@ngx-translate/core';
/**
 * Generated class for the IllustrationsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'illustrations',
  templateUrl: 'illustrations.html'
})
export class IllustrationsComponent {
  @Input() itemId: string;
  @Input() initialImage: Record<string, any> = {};
  illustrationsPath = 'assets/images/illustrations/2/';
  imgPath: any;
  images: Array<Object> = [];
  imageCountTotal = 0;
  imagesCache: Array<Object> = [];
  selectedImage: Array<string> = [];
  viewAll = true;
  showOne = false;
  textLoading: Boolean = true;
  apiEndPoint: string;
  appMachineName: string;
  projectMachineName: string;
  constructor(
    public navParams: NavParams,
    protected readPopoverService: ReadPopoverService,
    private textService: TextService,
    private modalCtrl: ModalController,
    private config: ConfigService,
    private events: Events,
    public translate: TranslateService,
    private analyticsService: AnalyticsService
  ) {
    this.registerEventListeners();
  }
  ngOnInit() {
    this.getIllustrationImages();
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    this.doAnalytics();
  }

  ngOnDestroy() {
    this.deRegisterEventListeners();
  }

  ngAfterViewInit() {
  }

  registerEventListeners() {
    this.events.subscribe('give:illustration', (image) => {
      this.showSingleImage(image);
    });
  }

  deRegisterEventListeners() {
    this.events.unsubscribe('give:illustration');
  }

  showSingleImage(image) {
    if (image) {
      this.showOne = true;
      this.viewAll = false;
      this.images = [image];
    } else {
      this.showOne = false;
    }
  }

  viewAllIllustrations() {
    this.viewAll = true;
    this.showOne = false;
    this.images = this.imagesCache;
  }

  zoomImage(image) {
    this.selectedImage = [image];
    const illustrationZoomModal = this.modalCtrl.create(
      FacsimileZoomModalPage,
      { 'images': this.selectedImage, 'activeImage': 0  },
      { cssClass: 'facsimile-zoom-modal' }
    );
    illustrationZoomModal.present();
  }

  scrollToPositionInText(image) {
    let imageSrc = image.src;
    let target = null as HTMLElement;
    try {
      if (image.class === 'doodle') {
        const imageDataId = 'tag_' + imageSrc.replace('/assets/images/verk/', '').replace('.jpg', '');
        target = document.querySelector(`img.doodle[data-id="${imageDataId}"]`) as HTMLElement;
        if (target !== null && target.previousElementSibling !== null && target.previousElementSibling !== undefined) {
          if (target.previousElementSibling.previousElementSibling !== null
            && target.previousElementSibling.previousElementSibling !== undefined
            && target.previousElementSibling.previousElementSibling.classList.contains('ttNormalisations')) {
            // Change the scroll target from the doodle icon itself to the preceding word which the icon represents.
            target = target.previousElementSibling.previousElementSibling as HTMLElement;
          }
        }
      } else {
        imageSrc = imageSrc.replace('http:', '');
        target = document.querySelector(`[src="${imageSrc}"]`) as HTMLElement;
      }

      if (target !== null && target.parentElement !== null && target.parentElement !== undefined) {
        if (image.class !== 'visible-illustration') {
          // Prepend arrow to the image/icon in the reading text and scroll into view
          const tmpImage: HTMLImageElement = new Image();
          tmpImage.src = 'assets/images/ms_arrow_right.svg';
          tmpImage.alt = 'ms arrow right image';
          tmpImage.classList.add('inl_ms_arrow');
          target.parentElement.insertBefore(tmpImage, target);
          this.scrollElementIntoView(tmpImage);
          setTimeout(function() {
            target.parentElement.removeChild(tmpImage);
          }, 5000);
        } else {
          this.scrollElementIntoView(target, 'top', 75);
        }
      }
    } catch (e) {
      console.log('Error scrolling to image position in text.');
    }
  }

  private getIllustrationImages() {
    this.images = [];
    this.textService.getEstablishedText(this.itemId).subscribe(
      text => {
        const c_id = String(this.itemId).split('_')[0];
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

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/html');
        const images: any = xmlDoc.querySelectorAll('img.est_figure_graphic');
        const doodles: any = xmlDoc.querySelectorAll('img.doodle');
        for (let i = 0; i < images.length ; i++) {
          let illustrationClass = 'illustration';
          if (!images[i].classList.contains('hide-illustration')) {
            illustrationClass = 'visible-illustration';
          }
          const image = {src: images[i].src, class: illustrationClass};
          this.images.push(image);
        }
        for (let i = 0; i < doodles.length ; i++) {
          const image = {src: '/assets/images/verk/' + String(doodles[i].dataset.id).replace('tag_', '') + '.jpg', class: 'doodle'};
          this.images.push(image);
        }
        this.imageCountTotal = this.images.length;
        this.imagesCache = this.images;
        if (typeof this.initialImage !== 'undefined' && this.initialImage) {
          this.images = [];
          this.images.push(this.initialImage);
          this.viewAll = false;
          this.showOne = true;
        }
        this.textLoading = false;
      },
      error => { this.textLoading = false; }
    );
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Illustration', 'Illustration', String(this.itemId));
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
}
