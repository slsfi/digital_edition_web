import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Searchbar, App } from 'ionic-angular';
import { SimpleSearchComponent } from '../../components/simple-search/simple-search';

/**
 * Generated class for the SearchAppPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-search-app',
  templateUrl: 'search-app.html',
})
export class SearchAppPage {
  @ViewChild(SimpleSearchComponent) childcmp: SimpleSearchComponent;

  results: any[];
  show: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public events: Events
  ) {
    this.show = 'simple';
    this.results = ['foo', 'bar', 'foobar', 'Hello World'];
    this.events.subscribe('searchModal:closed', () => {
      this.cancel();
    });
  }

  onInput(event) {
  }

  ionViewDidEnter() {
    setTimeout(() => {
        this.childcmp.setFocus();
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }


  cancel() {
    this.viewCtrl.dismiss();
  }
}
