import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { GenericSettingsService } from 'src/app/services/settings/generic-settings.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

/**
 * Generated class for the MobilePagesListPage page.
 *
 * Since mobile version doesn't use a SplitPlane menu this is page lists all items that are available in the desktop menu.
 * User can access this page from the mobile tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'pages-list',
//   segment: 'pages-list'
// })
@Component({
  selector: 'page-mobile-pages-list',
  templateUrl: 'mobile-pages-list.html',
})
export class MobilePagesListPage {
  personSearchTypes = [] as any;
  constructor(
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    public genericSettingsService: GenericSettingsService,
    private events: EventsService,
    private router: Router) {
      this.getPersonSearchTypes();
  }

  openPage(page: any) {
    this.router.navigate([page]);
  }

  ngOnInit() {
    console.log('ionViewDidLoad MobilePagesListPage');
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    console.log('Entering mobile-pages-list');
    this.events.publishMusicAccordionReset(true);
  }

  getPersonSearchTypes() {
    this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
  }

  openPersonSearchPage(searchPage: any) {
    const params = {
      type: searchPage.object_type,
      subtype: searchPage.object_subtype
    };

    this.router.navigate([`/person-search/${searchPage.object_type}/${searchPage.object_subtype}`]);
  }

}
