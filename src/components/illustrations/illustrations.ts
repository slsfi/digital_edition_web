import { Component, Input, OnDestroy } from '@angular/core';
import { NavParams, Events } from 'ionic-angular';
import { TextService } from '../../app/services/texts/text.service';
import { ModalController } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { FacsimileZoomModalPage } from '../../pages/facsimile-zoom/facsimile-zoom';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import { CommonFunctionsService } from '../../app/services/common-functions/common-functions.service';
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
    private analyticsService: AnalyticsService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.registerEventListeners();
  }
  ngOnInit() {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    this.getIllustrationImages();
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
    const imageSrc = image.src;
    let imageFilename = '';
    if (imageSrc) {
      imageFilename = imageSrc.substring(imageSrc.lastIndexOf('/') + 1);
      let target = null as HTMLElement;
      const readtextElem = document.querySelector('page-read:not([hidden]) read-text');
      try {
        if (image.class === 'doodle') {
          // Get the image filename without format and prepend tag_ to it
          let imageDataId = 'tag_' + imageFilename.substring(0, imageFilename.lastIndexOf('.'));
          target = readtextElem.querySelector(`img.doodle[data-id="${imageDataId}"]`) as HTMLElement;
          if (target === null) {
            // Try dropping the prefix 'tag_' from image data-id as unknown pictograms don't have this
            imageDataId = imageDataId.replace('tag_', '');
            target = readtextElem.querySelector(`img.doodle[data-id="${imageDataId}"]`) as HTMLElement;
          }
          if (target !== null) {
            if (target.previousElementSibling !== null && target.previousElementSibling !== undefined) {
              if (target.previousElementSibling.previousElementSibling !== null
                && target.previousElementSibling.previousElementSibling !== undefined
                && target.previousElementSibling.previousElementSibling.classList.contains('ttNormalisations')) {
                // Change the scroll target from the doodle icon itself to the preceding word which the icon represents.
                target = target.previousElementSibling.previousElementSibling as HTMLElement;
              }
            } else if (target.parentElement !== null && target.parentElement !== undefined) {
              if (target.parentElement.classList.contains('ttNormalisations')) {
                target = target.parentElement as HTMLElement;
              }
            }
          }
        } else {
          // Get the image element with src-attribute value ending in image filename
          const imageSrcFilename = '/' + imageFilename;
          target = readtextElem.querySelector(`[src$="${imageSrcFilename}"]`) as HTMLElement;
        }

        if (target !== null && target.parentElement !== null && target.parentElement !== undefined) {
          if (image.class !== 'visible-illustration') {
            // Prepend arrow to the image/icon in the reading text and scroll into view
            const tmpImage: HTMLImageElement = new Image();
            tmpImage.src = 'assets/images/ms_arrow_right.svg';
            tmpImage.alt = 'ms arrow right image';
            tmpImage.classList.add('inl_ms_arrow');
            target.parentElement.insertBefore(tmpImage, target);
            this.commonFunctions.scrollElementIntoView(tmpImage);
            setTimeout(function() {
              target.parentElement.removeChild(tmpImage);
            }, 5000);
          } else {
            this.commonFunctions.scrollElementIntoView(target, 'top', 75);
          }
        } else {
          console.log('Unable to find target when scrolling to image position in text, imageSrc:', imageSrc);
        }
      } catch (e) {
        console.log('Error scrolling to image position in text.');
      }
    } else {
      console.log('Empty src-attribute for image, unable to scroll to position in text.');
    }
  }

  private getIllustrationImages() {
    this.images = [];
    this.textService.getEstablishedText(this.itemId).subscribe(
      text => {
        const c_id = String(this.itemId).split('_')[0];
        text = this.textService.mapIllustrationImagePaths(text, c_id);

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

}
