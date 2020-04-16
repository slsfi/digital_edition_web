import { Component, Input } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { TextService } from '../../app/services/texts/text.service';
import { ModalController } from 'ionic-angular';
import { IllustrationsZoomModalPage } from '../../pages/illustrations-zoom-modal/illustrations-zoom-modal';
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
  images: any = [];
  viewAll = false;
  constructor(
    public navParams: NavParams,
    private textService: TextService,
    private modalCtrl: ModalController
  ) { }
  ngOnInit() {
    this.textService.getEstablishedText(this.itemId).subscribe(text => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/html');
      const images: any = xmlDoc.querySelectorAll('img.est_figure_graphic');
      for (let i = 0; i < images.length ; i++) {
        let image = images[i].src;
        image = image.replace(`${window.location.origin}/images/verk/`, '');
        image = 'http://api.sls.fi/digitaledition/topelius/gallery/get/19/' + image;
        this.images.push(image);
      }
    });
  }

  zoomImage(image) {
    const profileModal = this.modalCtrl.create(IllustrationsZoomModalPage, { image: image }, { cssClass: 'illustrations-zoom-modal' });
    profileModal.present();
  }

  scrollToPlaceInText(image) {
    image = image.replace('http://api.sls.fi/digitaledition/topelius/gallery/get/19/', '');
    const target = document.querySelector(`[src="assets/images/verk/${image}"]`);
    target.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
  }
}
