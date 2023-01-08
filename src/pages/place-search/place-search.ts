import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Platform, ModalController, Events, ViewController, Content } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { Occurrence, OccurrenceType, OccurrenceResult } from '../../app/models/occurrence.model';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { Storage } from '@ionic/storage';
import { FilterPage } from '../filter/filter';
import { OccurrencesPage } from '../occurrences/occurrences';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { MetadataService } from '../../app/services/metadata/metadata.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { CommonFunctionsService } from '../../app/services/common-functions/common-functions.service';
import { Subscription } from 'rxjs/Subscription';
import debounce from 'lodash/debounce';

/**
 * A page for searching place occurrences.
 */

@IonicPage({
  name: 'place-search',
  segment: 'places'
})
@Component({
  selector: 'page-place-search',
  templateUrl: 'place-search.html',
})
export class PlaceSearchPage {
  @ViewChild(Content) content: Content;
  places: any[] = [];
  searchText: string;
  max_fetch_size = 500;
  last_fetch_size = 0;
  agg_after_key: Record<string, any> = {};
  showLoading = false;
  showFilter = true;
  filters: any[] = [];
  immediate_search = false;
  objectType = 'location';
  mdContent: string;

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  languageSubscription: Subscription;
  debouncedSearch = debounce(this.searchPlaces, 500);

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              private mdContentService: MdContentService,
              protected config: ConfigService,
              private app: App,
              private platform: Platform,
              public occurrenceService: OccurrenceService,
              protected storage: Storage,
              private events: Events,
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private userSettingsService: UserSettingsService,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService,
              public commonFunctions: CommonFunctionsService
  ) {
    try {
      this.showFilter = this.config.getSettings('LocationSearch.ShowFilter');
    } catch (e) {
      this.showFilter = true;
    }

    try {
      this.max_fetch_size = this.config.getSettings('LocationSearch.InitialLoadNumber');
      if (this.max_fetch_size > 10000) {
        this.max_fetch_size = 10000;
      }
    } catch (e) {
      this.max_fetch_size = 500;
    }
  }

  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'place-search'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'placeSearch',
      component: 'place-search'
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Places');
  }

  ionViewDidLoad() {
    this.selectMusicAccordionItem();
    this.getPlaces();
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.getMdContent(lang + '-12-03');
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getPlaces() {
    this.showLoading = true;
    this.semanticDataService.getLocationElastic(this.agg_after_key, this.searchText, this.filters, this.max_fetch_size).subscribe(
      places => {
        // console.log('Elastic response: ', places);
        if (places.error !== undefined) {
          console.error('Elastic search error getting places: ', places);
        }
        if (places.aggregations && places.aggregations.unique_places && places.aggregations.unique_places.buckets.length > 0) {
          this.agg_after_key = places.aggregations.unique_places.after_key;
          this.last_fetch_size = places.aggregations.unique_places.buckets.length;

          console.log('Number of fetched places: ', this.last_fetch_size);

          const combining = /[\u0300-\u036F]/g;

          places = places.aggregations.unique_places.buckets;
          places.forEach(element => {
            element = element['key'];

            let sortByName = String(element['name']);
            if (element['sort_by_name']) {
              sortByName = String(element['sort_by_name']);
            }
            sortByName = sortByName.replace('ʽ', '').trim().toLowerCase();
            const ltr = sortByName.charAt(0);
            if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
              element['sort_by_name'] = sortByName;
            } else {
              element['sort_by_name'] = sortByName.normalize('NFKD').replace(combining, '').replace(',', '');
            }

            this.places.push(element);
          });
        } else {
          this.agg_after_key = {};
          this.last_fetch_size = 0;
        }

        this.sortListAlphabeticallyAndGroup(this.places);
        this.showLoading = false;
      },
      err => {
        console.error(err);
        this.showLoading = false;
        this.agg_after_key = {};
        this.last_fetch_size = 0;
      }
    );
  }

  showAll() {
    this.filters = [];
    this.searchText = '';
    this.searchPlaces();
  }

  filterByLetter(letter) {
    this.searchText = letter;
    this.searchPlaces();
    this.content.scrollToTop(400);
  }

  onSearchInput() {
    if (this.immediate_search) {
      this.immediate_search = false;
      this.searchPlaces();
    } else {
      this.debouncedSearch();
    }
  }

  onSearchClear() {
    this.immediate_search = true;
  }

  searchPlaces() {
    this.agg_after_key = {};
    this.places = [];
    if (this.showLoading) {
      this.debouncedSearch();
    } else {
      this.getPlaces();
    }
  }

  loadMore(e) {
    this.getPlaces();
  }

  hasMore() {
    return this.last_fetch_size > this.max_fetch_size - 1;
  }

  appHasMusicAccordionConfig() {
    let appHasMusicAccordion = false;

    try {
      appHasMusicAccordion = this.config.getSettings('AccordionMusic');
    } catch ( e ) {
      appHasMusicAccordion = false;
    }

    return appHasMusicAccordion;
  }

  selectMusicAccordionItem() {
    const appHasMusicAccordion = this.appHasMusicAccordionConfig();

    if (!appHasMusicAccordion) {
      return;
    }

    this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: 'placeSearch'});
  }

  async openPlace(occurrenceResult: OccurrenceResult) {
    let showOccurrencesModalOnRead = false;
    if (this.config.getSettings('showOccurencesModalOnReadPageAfterSearch.placeSearch')) {
      showOccurrencesModalOnRead = true;
    }

    let openOccurrencesAndInfoOnNewPage = false;

    try {
      openOccurrencesAndInfoOnNewPage = this.config.getSettings('OpenOccurrencesAndInfoOnNewPage');
    } catch (e) {
      openOccurrencesAndInfoOnNewPage = false;
    }

    if (openOccurrencesAndInfoOnNewPage) {
      const nav = this.app.getActiveNavs();

      const params = {
        id: occurrenceResult.id,
        objectType: this.objectType
      }

      if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
        nav[0].push('occurrences-result', params);
      } else {
        nav[0].setRoot('occurrences-result', params);
      }

    } else {
      const occurrenceModal = this.modalCtrl.create(OccurrencesPage, {
        id: occurrenceResult.id,
        type: this.objectType,
        showOccurrencesModalOnRead: showOccurrencesModalOnRead
      });

      occurrenceModal.present();
    }
  }

  sortListAlphabeticallyAndGroup(list: any[]) {
    const data = list;

    // Sort alphabetically
    this.commonFunctions.sortArrayOfObjectsAlphabetically(data, 'sort_by_name');

    // Check when first character changes in order to divide names into alphabetical groups
    for (let i = 0; i < data.length ; i++) {
      if (data[i] && data[i - 1]) {
        if (data[i].sort_by_name && data[i - 1].sort_by_name) {
          if (data[i].sort_by_name.length > 1 && data[i - 1].sort_by_name.length > 1) {
            if (data[i].sort_by_name.charAt(0) !== data[i - 1].sort_by_name.charAt(0)) {
              const ltr = data[i].sort_by_name.charAt(0);
              if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
                data[i]['firstOfItsKind'] = data[i].sort_by_name.charAt(0);
              }
            }
          }
        }
      }
    }

    for (let j = 0; j < data.length; j++) {
      if (data[j].sort_by_name.length > 1) {
        data[j]['firstOfItsKind'] = data[j].sort_by_name.charAt(0);
        break;
      }
    }

    return data;
  }

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'place-search', activeFilters: this.filters });
    filterModal.onDidDismiss(filters => {
      if (filters) {
        this.places = [];
        this.agg_after_key = {};
        this.filters = filters;
        this.getPlaces();
      }
    });
    filterModal.present();
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.mdContent = text.content; },
        error => { this.mdContent = ''; }
      );
  }

}
