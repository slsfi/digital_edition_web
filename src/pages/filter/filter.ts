import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';

/**
 * Generated class for the FilterPage page.
 *
 * This is a modal/page used to filter results.
 * Used by pages person-search and place-search.
 * Filters available: collections, person types.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-filter',
  templateUrl: 'filter.html',
})
export class FilterPage {
  errorMessage: string;
  filterCollections: any[];
  filterPersonTypes: any[];
  filterYear: number;
  shouldFilterYear = false;
  isEmpty = false;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public viewCtrl: ViewController,
              public storage: Storage,
              public semanticDataService: SemanticDataService,
              private events: Events
  ) {
    if (navParams.get('searchType') === 'person-search') {
      this.getFilterCollections();
      this.getFilterPersonTypes();
      this.shouldFilterYear = true;
    }
    if (navParams.get('searchType') === 'place-search') {
      this.getFilterCollections();
    }
    if (navParams.get('searchType') === 'tag-search') {
      this.getFilterCollections();
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  getFilterCollections() {
    this.semanticDataService.getFilterCollections().subscribe(
      filterCollections => {
        this.filterCollections = filterCollections;
      },
      error =>  {this.errorMessage = <any>error},
      () => {
        this.storage.get('filterCollections').then((filterCollections) => {
          if (filterCollections) {
            this.filterCollections = filterCollections;
          } else {
            console.log('filters in cache empty');
          }
        });
      }
    );
  }

  getFilterPersonTypes() {
    this.semanticDataService.getFilterPersonTypes().subscribe(
      filterPersonTypes => {
        this.filterPersonTypes = filterPersonTypes;
      },
      error =>  {this.errorMessage = <any>error},
      () => {
        this.storage.get('filterPersonTypes').then((filterPersonTypes) => {
          if (filterPersonTypes) {
            this.filterPersonTypes = filterPersonTypes;
          } else {
            console.log('filters in cache empty');
          }
        });
      }
    );
  }

  apply() {
    const filters = [];
    const filterCollections = [];
    const filterPersonTypes = [];

    if (this.filterYear) {
      filters['filterYear'] = this.filterYear;
    }

    if (this.filterCollections) {
      for (const filter of this.filterCollections) {
        if (filter.selected) {
          filterCollections.push(filter);
        }
      }
      filters['filterCollections'] = filterCollections;
    }

    if (this.filterPersonTypes) {
      for (const filter of this.filterPersonTypes) {
        if (filter.selected) {
          filterPersonTypes.push(filter);
        }
      }
      filters['filterPersonTypes'] = filterPersonTypes;
    }

    this.checkIfFiltersEmpty(filters);
    filters['isEmpty'] = this.isEmpty;

    this.viewCtrl.dismiss(filters);
    this.updateFilterCache(filterCollections, filterPersonTypes)
  }

  checkIfFiltersEmpty(filters) {
    if (this.navParams.get('searchType') === 'person-search') {
      if (!filters['filterYear'] && filters['filterCollections'].length <= 0 && filters['filterPersonTypes'].length <= 0) {
        this.isEmpty = true;
      }
    }

    if (this.navParams.get('searchType') === 'place-search') {
      if (filters['filterCollections'].length <= 0) {
        this.isEmpty = true;
      }
    }

    if (this.navParams.get('searchType') === 'tag-search') {
      if (filters['filterCollections'].length <= 0) {
        this.isEmpty = true;
      }
    }
  }

  updateFilterCache(filterCollections?, filterPersonTypes?) {
    if (filterCollections) {
      this.storage.remove('filterCollections');
      this.storage.set('filterCollections', this.filterCollections);
    }

    if (filterPersonTypes) {
      this.storage.remove('filterPersonTypes');
      this.storage.set('filterPersonTypes', this.filterPersonTypes);
    }
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

}
