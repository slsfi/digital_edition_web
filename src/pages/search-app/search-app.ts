import { Component, ViewChild } from '@angular/core';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { SimpleSearchComponent } from 'src/app/components/simple-search/simple-search';
import { EventsService } from 'src/app/services/events/events.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';

/**
 * Generated class for the SearchAppPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-search-app',
  templateUrl: 'search-app.html',
})
export class SearchAppPage {
  @ViewChild(SimpleSearchComponent) childcmp?: SimpleSearchComponent;

  results: any[];
  show: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ModalController,
    public events: EventsService,
    private analyticsService: AnalyticsService
  ) {
    this.show = 'simple';
    this.results = ['foo', 'bar', 'foobar', 'Hello World'];
    this.events.getSearchModalClosed().subscribe(() => {
      this.cancel();
    });
  }

  onInput(event: any) {
  }

  ngOnDestroy() {
    this.events.getSearchModalClosed().unsubscribe();
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Search');
    setTimeout(() => {
        this.childcmp?.setFocus();
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  cancel() {
    this.viewCtrl.dismiss();
  }
}
