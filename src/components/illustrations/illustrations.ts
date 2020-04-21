import { Component, Input, OnDestroy } from '@angular/core';
import { NavParams, Events } from 'ionic-angular';
import { TextService } from '../../app/services/texts/text.service';
import { ModalController } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { FacsimileZoomModalPage } from '../../pages/facsimile-zoom/facsimile-zoom';
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
  illustrationsPath = 'assets/images/illustrations/2/';
  imgPath: any;
  images: Array<string> = [];
  selectedImage: Array<string> = [];
  viewAll = false;
  showOne = false;
  apiEndPoint: string;
  projectMachineName: string;
  constructor(
    public navParams: NavParams,
    private textService: TextService,
    private modalCtrl: ModalController,
    private config: ConfigService,
    private events: Events
  ) { }
  ngOnInit() {
    this.getIllustrationImages();
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
  }

  ngOnDestroy() {
    this.events.unsubscribe('give:illustration');
  }

  ngAfterViewInit() {
    document.body.addEventListener('click', (event: any) => {
      const isReadTextThumbnail = event.target.classList.contains('est_figure_graphic');
      if (isReadTextThumbnail) {
        this.events.subscribe('give:illustration', (image) => {
          if (image) {
            this.showOne = true;
            this.viewAll = false;
            this.images = [image];
          } else {
            this.showOne = false;
          }
        });
      }
    });
  }

  toggleViewAll() {
    this.viewAll = !this.viewAll;
    this.showOne = false;

    if (this.viewAll) {
      this.getIllustrationImages();
    }
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
    image = image.replace('http:', '');
    const target = document.querySelector(`[src="${image}"]`);
    target.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
  }

  private getIllustrationImages() {
    this.images = [];
    this.textService.getEstablishedText(this.itemId).subscribe(text => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/html');
      const images: any = xmlDoc.querySelectorAll('img.est_figure_graphic');
      for (let i = 0; i < images.length ; i++) {
        const image = images[i].src;
        this.images.push(image);
      }
    });
  }
}
