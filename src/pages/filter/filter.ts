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
  filterYearMin: number;
  filterYearMax: number;
  filterCategoryTypes: any[];
  shouldFilterYear = false;
  isEmpty = false;
  activeFilters: any[];
  showLoading = false;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public viewCtrl: ViewController,
              public storage: Storage,
              public semanticDataService: SemanticDataService,
              private events: Events
  ) {

    if ( navParams.get('activeFilters') !== undefined ) {
      this.activeFilters = navParams.get('activeFilters');
      if (this.activeFilters['filterYearMin']) {
        this.filterYearMin = Number(this.activeFilters['filterYearMin']);
      }
      if (this.activeFilters['filterYearMax']) {
        this.filterYearMax = Number(this.activeFilters['filterYearMax']);
      }
    } else {
      this.activeFilters = [];
    }

    if (navParams.get('searchType') === 'person-search') {
      this.getFilterPersonTypes();
      this.shouldFilterYear = true;
    }
    if (navParams.get('searchType') === 'place-search') {
      this.getFilterCollections();
    }
    if (navParams.get('searchType') === 'tag-search') {
      this.getFilterCategoryTypes();
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
            console.log('filter collections in cache empty');
          }
        });
      }
    );
  }

  getFilterPersonTypes() {
    this.showLoading = true;
    this.semanticDataService.getFilterPersonTypes().subscribe(
      filterPersonTypes => {
        this.filterPersonTypes = filterPersonTypes['aggregations']['types']['buckets'];
        this.filterPersonTypes.forEach( cat => {
          cat.name = cat.key;
          if (this.activeFilters['filterPersonTypes'] && this.activeFilters['filterPersonTypes'].length > 0) {
            for (let i = 0; i < this.activeFilters['filterPersonTypes'].length; i++) {
              if (cat.name === this.activeFilters['filterPersonTypes'][i].name) {
                cat.selected = true;
                break;
              } else {
                cat.selected = false;
              }
            }
          } else {
            cat.selected = false;
          }
        });
        this.showLoading = false;
      },
      error =>  {this.errorMessage = <any>error}
    );
  }

  getFilterCategoryTypes() {
    this.showLoading = true;
    this.semanticDataService.getFilterCategoryTypes().subscribe(
      filterCategoryTypes => {
        this.filterCategoryTypes = filterCategoryTypes['aggregations']['types']['buckets'];
        this.filterCategoryTypes.forEach( cat => {
          cat.name = cat.key;
          if (this.activeFilters['filterCategoryTypes'] && this.activeFilters['filterCategoryTypes'].length > 0) {
            for (let i = 0; i < this.activeFilters['filterCategoryTypes'].length; i++) {
              if (cat.name === this.activeFilters['filterCategoryTypes'][i].name) {
                cat.selected = true;
                break;
              } else {
                cat.selected = false;
              }
            }
          } else {
            cat.selected = false;
          }
        });
        this.showLoading = false;
      },
      error =>  {this.errorMessage = <any>error}
    );
  }

  apply() {
    const filters = [];
    const filterCollections = [];
    const filterPersonTypes = [];
    const filterCategoryTypes = [];

    if (this.filterYearMin) {
      filters['filterYearMin'] = this.filterYearMin;
    }
    if (this.filterYearMax) {
      filters['filterYearMax'] = this.filterYearMax;
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

    if (this.filterCategoryTypes) {
      for (const filter of this.filterCategoryTypes) {
        if (filter.selected) {
          filterCategoryTypes.push(filter);
        }
      }
      filters['filterCategoryTypes'] = filterCategoryTypes;
    }

    this.checkIfFiltersEmpty(filters);
    filters['isEmpty'] = this.isEmpty;

    this.viewCtrl.dismiss(filters);
    this.updateFilterCache(filterCollections, filterPersonTypes, filterCategoryTypes)
  }

  checkIfFiltersEmpty(filters) {
    if (this.navParams.get('searchType') === 'person-search') {
      const d = new Date();
      if (!filters['filterYearMin'] && filters['filterYearMax']) {
        filters['filterYearMin'] = 1;
      }
      if ((filters['filterYearMin'] && !filters['filterYearMax']) || (Number(filters['filterYearMax']) > d.getFullYear())) {
        filters['filterYearMax'] = d.getFullYear();
      }
      if (!filters['filterYearMin'] && !filters['filterYearMax'] && filters['filterPersonTypes'].length < 1) {
        this.isEmpty = true;
      }
    }

    if (this.navParams.get('searchType') === 'place-search') {
      if (filters['filterCollections'].length < 1) {
        this.isEmpty = true;
      }
    }

    if (this.navParams.get('searchType') === 'tag-search') {
      if (filters['filterCategoryTypes'].length < 1) {
        this.isEmpty = true;
      }
    }
  }

  updateFilterCache(filterCollections?, filterPersonTypes?, filterCategoryTypes?) {
    if (filterCollections) {
      this.storage.remove('filterCollections');
      this.storage.set('filterCollections', this.filterCollections);
    }

    if (filterCategoryTypes) {
      this.storage.remove('filterCategoryTypes');
      this.storage.set('filterCategoryTypes', this.filterCategoryTypes);
    }
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

}
