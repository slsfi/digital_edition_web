import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Events } from 'ionic-angular';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { FacsimileService } from '../../app/services/facsimile/facsimile.service';
import { Observable } from 'rxjs/Observable';
import { Facsimile } from '../../app/models/facsimile.model';
import { FacsimileZoomModalPage } from '../facsimile-zoom/facsimile-zoom';

/**
 * Generated class for the FeaturedFacsimilePage page.
 *
 * Read collection in facsimiles
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'featured-facsimiles',
  segment: 'featured/facsimiles'
})
@Component({
  selector: 'page-featured-facsimile',
  templateUrl: 'featured-facsimile.html',
})
export class FeaturedFacsimilePage {

  facsimileCollections: any[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private userSettingsService: UserSettingsService,
    public facsimileService: FacsimileService,
    protected modalController: ModalController,
    private events: Events
  ) {
    this.getFacsimiles();
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('pageLoaded:featured-facsimiles');
    // this.userSettingsService.showSplitPane();
  }

  getFacsimiles() {
    this.facsimileService.getFeaturedFacsimiles().subscribe(
      facsimileCollections => {
        const f_collections = facsimileCollections;
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

  openFacsimileCollection(facsimileCollection) {
    const modal = this.modalController.create(FacsimileZoomModalPage,
      {'images': facsimileCollection.urls, 'activeImage': 0},
      { cssClass: 'facsimile-zoom-modal' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      console.log('dismissed', data);
    });
  }
}
