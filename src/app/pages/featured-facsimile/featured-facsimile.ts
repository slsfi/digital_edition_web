import { Component } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { FacsimileZoomModalPage } from 'src/app/modals/facsimile-zoom/facsimile-zoom';
import { EventsService } from 'src/app/services/events/events.service';
import { FacsimileService } from 'src/app/services/facsimile/facsimile.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

/**
 * Generated class for the FeaturedFacsimilePage page.
 *
 * Read collection in facsimiles
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'featured-facsimiles',
//   segment: 'featured/facsimiles'
// })
@Component({
  selector: 'page-featured-facsimile',
  templateUrl: 'featured-facsimile.html',
  styleUrls: ['featured-facsimile.scss']
})
export class FeaturedFacsimilePage {

  facsimileCollections?: any[];

  constructor(
    public navCtrl: NavController,
    public userSettingsService: UserSettingsService,
    public facsimileService: FacsimileService,
    protected modalController: ModalController,
    private events: EventsService,
  ) {
    this.getFacsimiles();
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishPageLoadedFeaturedFacsimiles();
    // this.userSettingsService.showSplitPane();
  }

  getFacsimiles() {
    this.facsimileService.getFeaturedFacsimiles().subscribe(
      facsimileCollections => {
        const f_collections = facsimileCollections as any;
        const facsimiles = [];
        for (const f of f_collections) {
          f.urls = []
          for (let i = f.startPageNumber; i <= f.numberOfPages; i++) {
            f.urls.push(this.facsimileService.getFacsimileImage(f.id, i, '4'));
          }
          f.thumbnail = this.facsimileService.getFacsimileImage(f.id, 1, '1');
        }
        this.facsimileCollections = f_collections;
        console.log(this.facsimileCollections);
      },
      err => console.error(err),
      () => console.log('get facsimiles')
    );
  }

  async openFacsimileCollection(facsimileCollection: any) {
    const modal = await this.modalController.create({
      component: FacsimileZoomModalPage,
      cssClass: 'facsimile-zoom-modal',
      componentProps: {
        'images': facsimileCollection.urls, 'activeImage': 0
      }
    });
    modal.present();
  }
}
