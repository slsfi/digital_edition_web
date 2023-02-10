import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events/events.service';

/**
 * Generated class for the GalleriesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'galleries',
//   segment: 'galleries'
// })
@Component({
  selector: 'page-galleries',
  templateUrl: 'galleries.html',
})
export class GalleriesPage {

  constructor(
    private events: EventsService,
    private router: Router,
  ) {
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  openGalleryPage(galleryPage: string) {
    this.router.navigate(['/gallery/' + galleryPage]);
  }
}
