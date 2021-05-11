import { Component, Input, EventEmitter, Output, SecurityContext, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, ModalController, NavParams, Events, ViewController, Platform } from 'ionic-angular';
import { FacsimileZoomModalPage } from '../../pages/facsimile-zoom/facsimile-zoom';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { FacsimileService } from '../../app/services/facsimile/facsimile.service';
import { Facsimile } from '../../app/models/facsimile.model'
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import { SongService } from '../../app/services/song/song.service';
import { IfObservable } from 'rxjs/observable/IfObservable';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

/**
 * Generated class for the FacsimilesComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'facsimiles',
  templateUrl: 'facsimiles.html'
})
export class FacsimilesComponent {

  @Input() itemId: any;
  @Input() selectedFacsimile: any;
  @Input() matches?: Array<string>;
  @Input() facsID?: any;
  @Input() facsNr?: any;
  @Input() songID?: any;
  @Output() openNewFacsimileView: EventEmitter<any> = new EventEmitter();

  public text: any;
  protected errorMessage: string;

  selection: 0;
  facsimiles: any;
  zoomedFacsimiles: any;
  images: any;
  activeImage = 0;
  facsimilePage = 0;
  manualPageNumber: number;
  zoom = 1.0;
  angle = 0;
  latestDeltaX = 0
  latestDeltaY = 0
  prevX = 0
  prevY = 0
  isExternal = false;
  selectedFacsimileName: string;

  facsUrl = '';
  externalURLs = [];
  facsimilePagesInfinite = false;
  // If defined, this size will be appended to the image url.
  // So define only if the image API supports it.
  facsSize: number;
  facsPage: any;
  facsNumber = 0;
  facsimileDefaultZoomLevel = 1;
  numberOfPages: number;
  chapter: string;

  constructor(
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected modalController: ModalController,
    protected facsimileService: FacsimileService,
    public params: NavParams,
    public translate: TranslateService,
    protected config: ConfigService,
    protected events: Events,
    private viewctrl: ViewController,
    private platform: Platform,
    private ngZone: NgZone,
    private alertCtrl: AlertController,
    public songService: SongService,
    private analyticsService: AnalyticsService
  ) {
    this.deRegisterEventListeners();
    this.registerEventListeners();
    this.manualPageNumber = 1;
    this.text = '';
    this.facsimiles = [];
    this.selectedFacsimileName = '';

    const parts = String(this.itemId).split('_')
    this.chapter = null;
    if ( parts[2] !== undefined ) {
      this.chapter = parts[2];
    }

    if (this.params.get('facsimilePage') !== undefined) {
      this.facsimilePage = this.params.get('facsimilePage');
      // To account for index at 0
      this.facsimilePage -= 1;
    } else {
      this.facsimilePage = 0;
    }
    try {
      this.facsimileDefaultZoomLevel = this.config.getSettings('settings.facsimileDefaultZoomLevel');
    } catch (e) {
      this.facsimileDefaultZoomLevel = 1;
    }
  }

  openNewFacs(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'facsimiles';
    this.openNewFacsimileView.emit(id);
  }

  openNewManuscriptFacs(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'facsimileManuscript';
    id.id = id.manuscript_id;
    this.openNewFacsimileView.emit(id);
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Facsimiles', 'Facsimiles', this.selectedFacsimile.title);
  }

  ngOnInit() {
    if (!this.selectedFacsimile) {
      let getFacsimilePagesInfinite = false;
      try {
        getFacsimilePagesInfinite = this.config.getSettings('settings.getFacsimilePagesInfinite')
      } catch (e) {

      }

      if (getFacsimilePagesInfinite) {
        this.facsimilePagesInfinite = this.config.getSettings('settings.getFacsimilePagesInfinite');
      }

      if (this.facsimilePagesInfinite) {
        if (this.facsID && this.facsNr && this.songID) {
          this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
            this.config.getSettings('app.machineName') +
            `/song-example/page/image/${this.facsID}/`;
          this.facsNumber = this.facsNr;
          this.facsSize = null

        } else if (this.facsID && this.facsNr) {
          this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
            this.config.getSettings('app.machineName') +
            `/facsimile/page/image/${this.facsID}/`;
          this.facsNumber = this.facsNr;
          this.facsSize = null

        } else {
          this.facsSize = this.facsimileDefaultZoomLevel;
          this.getFacsimilePageInfinite();
        }
      } else {
        this.getFacsimiles();
      }
    } else {
      this.selectedFacsimileName = this.selectedFacsimile.title;
      this.getFacsimiles(this.selectedFacsimile.itemId);
    }
  }

  getFacsimilePageInfinite() {
    this.facsimileService.getFacsimilePage(this.itemId).subscribe(
      facs => {
        this.facsimiles = [];
        if ( String(this.itemId).indexOf('ch') > 0 ) {
          facs.forEach( fac => {
            let section = String(this.itemId).split(';')[0];
            section = String((String(section).split('_')[2]).replace('ch', ''));
            if ( String(fac['section_id']) === section ) {
              this.facsPage = fac;
            }
          });
          if ( this.facsPage === undefined ) {
            this.facsPage = facs[0];
          }
        } else {
          this.facsPage = facs[0];
        }

        this.manualPageNumber = this.activeImage = this.facsNumber = (
          this.facsPage['page_nr'] + this.facsPage['start_page_number'] + this.facsimilePage
        );
        this.numberOfPages = this.facsPage['number_of_pages'];

        this.facsPage['title'] = this.sanitizer.bypassSecurityTrustHtml(this.facsPage['title']);

        this.selectedFacsimile = this.facsPage;
        this.selectedFacsimile.f_col_id = this.facsPage['publication_facsimile_collection_id'];
        this.selectedFacsimile.title = this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(this.facsPage['title']));
        this.selectedFacsimileName = this.selectedFacsimile.title;

        // add all
        for (const f of facs) {
          const tmp = f;
          tmp.title = this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(tmp.title));
          const facsimile = new Facsimile(tmp);
          facsimile.itemId = this.itemId;
          facsimile.manuscript_id = f.publication_manuscript_id;
          this.facsimiles.push(facsimile);
          if ( f['external_url'] !== null ) {
            this.isExternal = true;
            this.externalURLs.push({'title': f['title'], 'url': f['external_url']});
          }
        }

        if ( this.facsPage['external_url'] === undefined || this.facsPage['external_url'] === null ) {
          this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
          this.config.getSettings('app.machineName') +
          `/facsimiles/${this.facsPage['publication_facsimile_collection_id']}/`;
          this.isExternal = false;
        }

        if (this.facsimiles.length > 0) {
          console.log('recieved facsimiles ,..,', this.facsimiles);
        }
      },
      error => {
        console.error('Error loading facsimiles...');
        this.errorMessage = <any>error
      }
    );
  }

  nextFacsimileUrl() {
    this.facsNumber++;
  }

  prevFacsimileUrl() {
    if (this.facsNumber === 1) {
      return;
    }
    this.facsNumber--;
  }

  getFacsimiles(itemId?: any) {
    if (itemId) {
      this.itemId = itemId
    }
    this.facsimileService.getFacsimiles(this.itemId, this.chapter).subscribe(
      facs => {
        // in order to get id attributes for tooltips
        this.facsimiles = [];
        for (const f of facs) {
          const facsimile = new Facsimile(f);
          for (let i = f.first_page; i <= f.last_page; i++) {
            if (f.publication_facsimile_collection_id === undefined && f['publication_facsimile_collection_id'] !== undefined) {
              f.publication_facsimile_collection_id = f['publication_facsimile_collection_id'];
            }
            const f_url = this.facsimileService.getFacsimileImage(f.publication_facsimile_collection_id, i, this.facsimileDefaultZoomLevel);
            facsimile.images.push(f_url);
            const zf_url = this.facsimileService.getFacsimileImage(f.publication_facsimile_collection_id, i, 1);
            facsimile.zoomedImages.push(zf_url);
          }
          facsimile.itemId = this.itemId;
          facsimile.manuscript_id = f.publication_manuscript_id;
          this.facsimiles.push(facsimile)
        }

        if (!itemId) {
          if (this.selectedFacsimile !== undefined && this.selectedFacsimile['viewType'] === 'manuscriptFacsimile') {
            for (let i = 0; i < facs.length; i++) {
              if (String(facs[i].publication_manuscript_id) === String(this.selectedFacsimile.id)) {
                this.selectedFacsimile = this.facsimiles[i];
              }
            }
          } else {
            this.selectedFacsimile = this.facsimiles[this.facsimiles.length - 1];
          }
          this.selectedFacsimileName = this.selectedFacsimile.title;
          this.images = this.selectedFacsimile.images;
          this.activeImage = 0;
        }
        if (this.facsimiles.length > 0) {
          console.log('recieved facsimiles ,..,', this.facsimiles);
        }
        this.changeFacsimile();
        this.doAnalytics();
      },
      error => {
      console.error('Error loading facsimiles...', this.itemId);
        this.errorMessage = <any>error
      }
    )
  }

  registerEventListeners() {
    this.events.subscribe('next:facsimile', () => {
      this.next();
    });
    this.events.subscribe('previous:facsimile', () => {
      this.previous();
    });
    this.events.subscribe('zoom:facsimile', () => {
      this.openZoom();
    });
  }

  deRegisterEventListeners() {
    this.events.unsubscribe('next:facsimile');
    this.events.unsubscribe('previous:facsimile');
    this.events.unsubscribe('zoom:facsimile');
  }

  changeFacsimile(facs?: any) {
    if (facs) {
      this.selectedFacsimile = facs;
      this.selectedFacsimileName = this.selectedFacsimile.title;
      this.itemId = this.selectedFacsimile.itemId;
      this.facsNumber = facs.page;
      this.facsPage = facs.page;
      this.manualPageNumber = facs.page;
      this.numberOfPages = facs.number_of_pages;
      this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
            this.config.getSettings('app.machineName') +
            `/facsimiles/${facs.publication_facsimile_collection_id}/`;
    }
    this.text = this.sanitizer.bypassSecurityTrustHtml(
      this.selectedFacsimile.content.replace(/images\//g, 'assets/images/')
        .replace(/\.png/g, '.svg')
    );
    this.images = this.selectedFacsimile.images;
    this.activeImage = this.facsimilePage;
  }

  selectFacsimile() {
    let facsTranslations = null;
    this.translate.get('Read.Facsimiles').subscribe(
      translation => {
        facsTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = this.alertCtrl.create({
      title: facsTranslations.SelectFacsDialogTitle,
      subTitle: facsTranslations.SelectFacsDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    this.facsimiles.forEach((facsimile, index) => {
      let checkedValue = false;

      console.log('Selected facsimile:')
      console.log(this.selectedFacsimile);

      if (this.selectedFacsimile.publication_facsimile_collection_id === facsimile.publication_facsimile_collection_id
      && (this.selectedFacsimile.page === undefined || this.selectedFacsimile.page === facsimile.page)) {
        checkedValue = true;
      }

      alert.addInput({
        type: 'radio',
        label: this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(facsimile.title)),
        value: index,
        checked: checkedValue
      });
    });

    alert.addButton(buttonTranslations.Cancel);
    alert.addButton({
      text: buttonTranslations.Ok,
      handler: (index: any) => {
        this.changeFacsimile(this.facsimiles[parseInt(index)]);
      }
    });

    alert.present();
  }

  previous() {
    if (this.facsimilePagesInfinite) {
      if (this.manualPageNumber > 1) {
        this.prevFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) - 1;
      }
      return;
    }
    this.activeImage = (this.activeImage - 1);
    this.manualPageNumber = Number(this.manualPageNumber) - 1;
    if (this.activeImage < 0) {
      this.activeImage = this.images.length - 1;
      this.manualPageNumber = this.images.length;
    }
    if (this.manualPageNumber === 0) {
      this.manualPageNumber = 1;
    }
  }

  next() {
    if (this.facsimilePagesInfinite) {
      if ( (Number(this.manualPageNumber) + 1) <= this.numberOfPages ) {
        this.nextFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) + 1;
      } else {
        this.facsNumber = 1;
        this.manualPageNumber = 1;
      }
      // this.manualPageNumber = Number(this.manualPageNumber) + 1;
      return;
    }
    this.activeImage = (this.activeImage + 1);
    this.manualPageNumber = Number(this.manualPageNumber) + 1;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
  }

  setPage(e) {
    if (this.manualPageNumber <= 0) {
      this.manualPageNumber = 1;
    }
    const pNumber: number = (this.manualPageNumber - 1);
    if (this.facsimilePagesInfinite) {
      this.facsNumber = pNumber;
      return;
    }
    this.activeImage = pNumber;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
  }

  openZoom() {
    let modal = null;
    let params: object;
    this.facsSize = this.facsimileDefaultZoomLevel;

    if (this.facsimilePagesInfinite) {
      // TODO: images array contains 0 index that is invalid since page numbers are 1 based.
      const images = []
      for (let i = 0; i < this.numberOfPages; i++) {
        images.push(this.facsUrl + i + '/' + this.facsSize)
      }

      params = {
        facsimilePagesInfinite: false,
        facsUrl: this.facsUrl,
        facsID: this.facsID,
        facsNr: this.facsNr,
        facsSize: this.facsSize,
        images,
        activeImage: this.manualPageNumber,
      };
    } else {
      params = {
        images: this.selectedFacsimile.zoomedImages,
        activeImage: this.activeImage,
      };
    }

    modal = this.modalController.create(FacsimileZoomModalPage,
      params,
      { cssClass: 'facsimile-zoom-modal' }
    );

    modal.present();
    modal.onDidDismiss(data => {
      console.error('dismissed', data);
    });
  }

  zoomIn() {
    this.zoom = this.zoom + 0.1;
  }
  zoomOut() {
    this.zoom = this.zoom - 0.1;
    if (this.zoom < 0.5) {
      this.zoom = 0.5;
    }
  }

  rotate() {
    this.angle += 90;
    if ( this.angle >= 360 ) {
      this.angle = 0;
    }
  }

  resetFacsimile() {
    this.zoom = 1 + (Math.random() * (0.00001 - 0.00000001) + 0.00000001);
    this.angle = 0;
    this.prevX = 0;
    this.prevY = 0;
  }

  handleSwipeEvent(event) {
    const img = event.target;
    // Store latest zoom adjusted delta.
    // NOTE: img must have touch-action: none !important;
    // otherwise deltaX and deltaY will give wrong values on mobile.
    this.latestDeltaX = event.deltaX / this.zoom
    this.latestDeltaY = event.deltaY / this.zoom

    // Get current position from last position and delta.
    let x = this.prevX + this.latestDeltaX
    let y = this.prevY + this.latestDeltaY

    if ( this.angle === 90 ) {
      const tmp = x;
      x = y;
      y = tmp;
      y = y * -1;
    } else if ( this.angle === 180 ) {
      y = y * -1;
      x = x * -1;
    } else if ( this.angle === 270 ) {
      const tmp = x;
      x = y;
      y = tmp;
      x = x * -1;
    }

    if (img !== null) {
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + x + 'px, ' + y + 'px, 0px)';
    }
  }

  onMouseUp(e) {
    // Update the previous position on desktop by adding the latest delta.
    this.prevX += this.latestDeltaX
    this.prevY += this.latestDeltaY
  }

  onTouchEnd(e) {
    // Update the previous position on mobile by adding the latest delta.
    this.prevX += this.latestDeltaX
    this.prevY += this.latestDeltaY
  }

  onMouseWheel(e) {
    const img = e.target;
    if ( e.deltaY > 0 ) {
      this.zoomIn();
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' +
       this.prevY + 'px, 0px)';
    } else {
      this.zoomOut();
      img.style.transform = 'rotate(' + this.angle + 'deg) scale(' + this.zoom + ') translate3d(' + this.prevX + 'px, ' +
       this.prevY + 'px, 0px)';
    }
  }

}
