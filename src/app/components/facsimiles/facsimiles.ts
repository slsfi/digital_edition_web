import { Component, Input, EventEmitter, Output, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AlertButton, AlertController, AlertInput, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { FacsimileZoomModalPage } from 'src/app/modals/facsimile-zoom/facsimile-zoom';
import { Facsimile } from 'src/app/models/facsimile.model';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { FacsimileService } from 'src/app/services/facsimile/facsimile.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { SongService } from 'src/app/services/song/song.service';

/**
 * Generated class for the FacsimilesComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'facsimiles',
  templateUrl: 'facsimiles.html',
  styleUrls: ['facsimiles.scss']
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
  protected errorMessage?: string;

  selection?: 0;
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
  externalFacsimilesExist = false;
  selectedFacsimileName: string;
  selectedFacsimileIsExternal = false;

  facsUrl = '';
  facsBase = null;
  externalURLs: any = [];
  facsimilePagesInfinite = false;
  // If defined, this size will be appended to the image url.
  // So define only if the image API supports it.
  facsSize?: number | null;
  facsPage: any;
  facsNumber = 0;
  facsimileDefaultZoomLevel = 1;
  facsimileZoomPageLevel = 1;
  numberOfPages?: number;
  chapter?: string;

  constructor(
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected modalController: ModalController,
    protected facsimileService: FacsimileService,
    public translate: TranslateService,
    protected config: ConfigService,
    protected events: EventsService,
    private alertCtrl: AlertController,
    public songService: SongService,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
  ) {
    this.deRegisterEventListeners();
    this.registerEventListeners();
    this.manualPageNumber = 1;
    this.text = '';
    this.facsimiles = [];
    this.selectedFacsimileName = '';

    try {
      this.facsimilePagesInfinite = this.config.getSettings('settings.getFacsimilePagesInfinite');
    } catch (e) {
      this.facsimilePagesInfinite = false;
    }

    try {
      this.facsimileDefaultZoomLevel = this.config.getSettings('settings.facsimileDefaultZoomLevel');
    } catch (e) {
      this.facsimileDefaultZoomLevel = 1;
    }

    try {
      this.facsimileZoomPageLevel = this.config.getSettings('settings.facsimileZoomPageLevel');
    } catch (e) {
      this.facsimileZoomPageLevel = 1;
    }

    try {
      this.facsBase = this.config.getSettings('app.facsimileBase');
    } catch (e) {
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

    this.route.queryParams.subscribe(params => {
      if (params['facsimilePage']) {
        this.facsimilePage = params['facsimilePage'];
        // To account for index at 0
        this.facsimilePage -= 1;
      } else {
        this.facsimilePage = 0;
      }
    });

    const parts = String(this.itemId).split('_');
    this.chapter = '';
    if (parts[2] !== undefined) {
      this.chapter = parts[2].split(';')[0];
    }

    if (!this.selectedFacsimile) {
      if (this.facsimilePagesInfinite) {
        /* In the if-branches below the displayed facsimile image is set based on input, i.e. the facsimile component
           has been opened through an emitted event. The default behaviour of the component is in the else-branch. */
        if (this.facsID && this.facsNr && this.songID) {
          this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
            this.config.getSettings('app.machineName') +
            `/song-example/page/image/${this.facsID}/`;
          this.facsNumber = this.facsNr;
          this.facsSize = null;
        } else if (this.facsID && this.facsNr) {
          this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
            this.config.getSettings('app.machineName') +
            `/facsimile/page/image/${this.facsID}/`;
          this.facsNumber = this.facsNr;
          this.facsSize = null;
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
        /* The facsimiles are returned ordered by priority (highest first) */
        // console.log(facs);
        const sectionId = this.chapter?.replace('ch', '');
        // console.log('sectionId', sectionId);
        if (facs.length > 0) {
          this.facsimiles = [];
          if (this.chapter) {
            /* Find facsimile with matching sectionId number AND lowest priority number */
            let fPriority = 100000;
            let fIndex = null;
            for (let i = 0; i < facs.length; i++) {
              if (i < 1) {
                fPriority = facs[i]['priority'];
              }
              if (String(facs[i]['section_id']) === sectionId && facs[i]['priority'] <= fPriority) {
                fPriority = facs[i]['priority'];
                fIndex = i;
              }
            }
            if (fIndex !== null && fIndex !== undefined) {
              this.facsPage = facs[fIndex];
            } else {
              this.facsPage = facs[0];
            }
          } else {
            this.facsPage = facs[0];
          }
          // console.log('this.facsPage', this.facsPage);

          if (this.facsPage['external_url'] !== null && this.facsPage['external_url'] !== '' && this.facsPage['folder_path'] == null) {
            this.selectedFacsimileIsExternal = true;
          }

          this.manualPageNumber = this.activeImage = this.facsNumber = (
            this.facsPage['page_nr'] + this.facsPage['start_page_number'] + this.facsimilePage
          );
          this.numberOfPages = this.facsPage['number_of_pages'];

          this.facsPage['title'] = this.sanitizer.sanitize(SecurityContext.HTML,
            this.sanitizer.bypassSecurityTrustHtml(this.facsPage['title']));

          this.selectedFacsimile = this.facsPage;
          this.selectedFacsimile.f_col_id = this.facsPage['publication_facsimile_collection_id'];
          this.selectedFacsimile.title = this.facsPage['title'];
          this.selectedFacsimileName = this.selectedFacsimile.title;

          // add all facsimiles to facsimiles array
          for (const f of facs) {
            const facsimile = new Facsimile(f);
            facsimile.itemId = this.itemId;
            facsimile.manuscript_id = f.publication_manuscript_id;
            if ( f['external_url'] === null || f['external_url'] === '' ) {
              facsimile.title = this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(f['title']));
            }
            if ( f['external_url'] !== null && f['external_url'] !== '' ) {
              this.externalFacsimilesExist = true;
              this.externalURLs.push({'title': f['title'], 'url': f['external_url']});
            } else {
              if (sectionId !== '') {
                if (String(f['section_id']) === sectionId) {
                  this.facsimiles.push(facsimile);
                }
              } else {
                this.facsimiles.push(facsimile);
              }
            }
          }

          /**
           * * The following code block has been restored to its state before 29.12.2021 because the
           * * modifications then broke the facsimiles for all SLS projects.
           * * this.facsPage['folder_path'] can't be a condition for setting this.facsUrl, since folder_path
           * * is not used for any facsimile_collection in any SLS project. // SK
           */
          if (this.facsPage['external_url'] === undefined || this.facsPage['external_url'] === null
            || this.facsPage['external_url'] === '') {
            this.externalFacsimilesExist = false;
            this.selectedFacsimileIsExternal = false;
            this.facsUrl = this.config.getSettings('app.apiEndpoint') + '/' +
              this.config.getSettings('app.machineName') +
              `/facsimiles/${this.facsPage['publication_facsimile_collection_id']}/`;
          }

          /*
          if (this.facsimiles.length > 0) {
            console.log('recieved facsimiles (infinite) ,..,');
          }
          */
          /*
          if (this.externalURLs.length > 0) {
            console.log('recieved external facsimiles ,...,');
          }
          */
        } else {
          this.translate.get('Read.Facsimiles.NoFacsimiles').subscribe(
            translation => {
              this.text = translation;
            }, err => {
              console.error(err);
              this.text = 'Inga faksimil';
            }
          );
        }
      },
      error => {
        this.errorMessage = <any>error;
        console.error('Error loading facsimiles...', String(this.errorMessage));
      }
    );
  }

  getFacsimiles(itemId?: any) {
    if (itemId) {
      this.itemId = itemId
    }
    this.facsimileService.getFacsimiles(this.itemId, this.chapter).subscribe(
      (facs: any) => {
        this.facsimiles = [];
        for (const f of facs) {
          const facsimile = new Facsimile(f);
          for (let i = f.first_page; i <= f.last_page; i++) {
            if (f.publication_facsimile_collection_id === undefined && f['publication_facsimile_collection_id'] !== undefined) {
              f.publication_facsimile_collection_id = f['publication_facsimile_collection_id'];
            }
            const f_url = this.facsimileService.getFacsimileImage(f.publication_facsimile_collection_id, i, this.facsimileDefaultZoomLevel);
            facsimile.images.push(f_url);
            const zf_url = this.facsimileService.getFacsimileImage(f.publication_facsimile_collection_id, i, this.facsimileZoomPageLevel);
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
          console.log('recieved facsimiles ,..,');
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
    this.events.getNextFacsimile().subscribe(() => {
      this.next();
    });
    this.events.getPreviousFacsimile().subscribe(() => {
      this.next();
    });
    this.events.getZoomFacsimile().subscribe(() => {
      this.next();
    });
    // this.events.subscribe('next:facsimile', () => {
    //   this.next();
    // });
    // this.events.subscribe('previous:facsimile', () => {
    //   this.previous();
    // });
    // this.events.subscribe('zoom:facsimile', () => {
    //   this.openZoom();
    // });
  }

  deRegisterEventListeners() {
    this.events.getNextFacsimile().complete();
    this.events.getPreviousFacsimile().complete();
    this.events.getZoomFacsimile().complete();
    // this.events.unsubscribe('next:facsimile');
    // this.events.unsubscribe('previous:facsimile');
    // this.events.unsubscribe('zoom:facsimile');
  }

  changeFacsimile(facs?: any) {
    if (facs === 'external') {
      this.selectedFacsimileIsExternal = true;
    } else if (facs) {
      this.selectedFacsimileIsExternal = false;
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

  async selectFacsimile() {
    let facsTranslations = null as any;
    const inputs = [] as AlertInput[];
    const buttons = [] as AlertButton[];
    this.translate.get('Read.Facsimiles').subscribe(
      translation => {
        facsTranslations = translation;
      }, error => { }
    );

    let buttonTranslations = null as any;
    this.translate.get('BasicActions').subscribe(
      translation => {
        buttonTranslations = translation;
      }, error => { }
    );

    const alert = await this.alertCtrl.create({
      header: facsTranslations.SelectFacsDialogTitle,
      subHeader: facsTranslations.SelectFacsDialogSubtitle,
      cssClass: 'select-text-alert'
    });

    if (this.externalFacsimilesExist && this.externalURLs.length > 0) {
      inputs.push({
        type: 'radio',
        label: facsTranslations.ExternalHeading,
        value: '-1',
        checked: this.selectedFacsimileIsExternal
      });
    }

    this.facsimiles.forEach((facsimile: any, index: any) => {
      let checkedValue = false;

      if (!this.selectedFacsimileIsExternal
      && (this.selectedFacsimile.publication_facsimile_collection_id === facsimile.publication_facsimile_collection_id
      && (this.selectedFacsimile.page === undefined && this.selectedFacsimile.first_page === facsimile.page
      || this.selectedFacsimile.page === facsimile.page))) {
        checkedValue = true;
      }

      // Tags are stripped from the title which is shown as the label

      inputs.push({
        type: 'radio',
        label: facsimile.title.replace(/(<([^>]+)>)/gi, ''),
        value: String(index),
        checked: checkedValue
      });
    });

    if (buttonTranslations) {
      buttons.push({
        text: buttonTranslations.Cancel
      });
      buttons.push({
        text: buttonTranslations.Ok,
        handler: (index: string) => {
  
          console.log('changing facsimile, ', index);
  
          if (parseInt(index) < 0) {
            // External facsimiles selected
            this.changeFacsimile('external');
          } else {
            this.changeFacsimile(this.facsimiles[parseInt(index)]);
          }
        }
      });
    }

    alert.inputs = inputs;
    alert.buttons = buttons;

    await alert.present();
  }

  previous() {
    if (this.facsimilePagesInfinite) {
      if (Number(this.manualPageNumber) > 1) {
        this.prevFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) - 1;
      } else {
        this.facsNumber = this.numberOfPages as number;
        this.manualPageNumber = this.numberOfPages as number;
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
      if ( (Number(this.manualPageNumber) + 1) <= (this.numberOfPages || 0) ) {
        this.nextFacsimileUrl();
        this.manualPageNumber = Number(this.manualPageNumber) + 1;
      } else {
        this.facsNumber = 1;
        this.manualPageNumber = 1;
      }
      return;
    }
    this.activeImage = (this.activeImage + 1);
    this.manualPageNumber = Number(this.manualPageNumber) + 1;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
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

  setPage(e: any) {
    if (this.manualPageNumber < 1) {
      this.manualPageNumber = 1;
    } else if (this.manualPageNumber > (this.numberOfPages || 0)) {
      this.manualPageNumber = this.numberOfPages as number;
    }
    const pNumber: number = (this.manualPageNumber - 1);
    if (this.facsimilePagesInfinite) {
      this.facsNumber = this.manualPageNumber;
      return;
    }
    this.activeImage = pNumber;
    if (this.activeImage > this.images.length - 1) {
      this.activeImage = 0;
      this.manualPageNumber = 1;
    }
  }

  async openZoom() {
    // let modal = null;
    let params: object;
    this.facsSize = this.facsimileDefaultZoomLevel;

    if (this.facsimilePagesInfinite) {
      const images = []
      for (let i = 1; i < (this.numberOfPages || 0) + 1; i++) {
        images.push(this.facsUrl + i + '/' + this.facsSize)
      }

      params = {
        facsimilePagesInfinite: false,
        facsUrl: this.facsUrl,
        facsID: this.facsID,
        facsNr: this.facsNr,
        facsSize: this.facsSize,
        images,
        activeImage: this.manualPageNumber - 1,
      };
    } else {
      params = {
        images: this.selectedFacsimile.zoomedImages,
        activeImage: this.activeImage,
      };
    }

    const modal = await this.modalController.create({
      component: FacsimileZoomModalPage,
      componentProps: { params },
      cssClass: 'facsimile-zoom-modal',
    });

    modal.present();
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

  handleSwipeEvent(event: any) {
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

  onMouseUp(e: any) {
    // Update the previous position on desktop by adding the latest delta.
    this.prevX += this.latestDeltaX
    this.prevY += this.latestDeltaY
  }

  onTouchEnd(e: any) {
    // Update the previous position on mobile by adding the latest delta.
    this.prevX += this.latestDeltaX
    this.prevY += this.latestDeltaY
  }

  onMouseWheel(e: any) {
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
