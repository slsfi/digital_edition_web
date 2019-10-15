import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Nav, App, Platform, Events } from 'ionic-angular';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { GenericSettingsService } from '../../app/services/settings/generic-settings.service';

/**
 * Generated class for the MobilePagesListPage page.
 *
 * Since mobile version doesn't use a SplitPlane menu this is page lists all items that are available in the desktop menu.
 * User can access this page from the mobile tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'pages-list',
  segment: 'pages-list'
})
@Component({
  selector: 'page-mobile-pages-list',
  templateUrl: 'mobile-pages-list.html',
})
export class MobilePagesListPage {
  personSearchTypes = [];
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private config: ConfigService,
    private app: App,
    private userSettingsService: UserSettingsService,
    public genericSettingsService: GenericSettingsService,
    private events: Events) {
      this.getPersonSearchTypes();
  }

  openPage(page, animate = true) {
    const nav = this.app.getActiveNavs();
    nav[0].push(page, {animate: animate, direction: 'forward', animation: 'ios-transition'});
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MobilePagesListPage');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    console.log('Entering mobile-pages-list');
    this.events.publish('musicAccordion:reset', true);
  }

  getPersonSearchTypes() {
    this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
  }

  openPersonSearchPage(searchPage) {
    const params = {
      type: searchPage.object_type,
      subtype: searchPage.object_subtype
    };

    this.navCtrl.setRoot('person-search', params);
  }

}
