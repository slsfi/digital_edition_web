import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
// tslint:disable-next-line:max-line-length
import { IonicPage, NavController, NavParams, ModalController, App, Platform,
  LoadingController, ToastController, Content, Events, ViewController } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';
import { TextService } from '../../app/services/texts/text.service';
import { FilterPage } from '../filter/filter';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { Occurrence, OccurrenceType, OccurrenceResult } from '../../app/models/occurrence.model';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { Storage } from '@ionic/storage';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { OccurrencesPage } from '../occurrences/occurrences';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { MetadataService } from '../../app/services/metadata/metadata.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { TooltipService } from '../../app/services/tooltips/tooltip.service';
import { CommonFunctionsService } from '../../app/services/common-functions/common-functions.service';
import { Subscription } from 'rxjs/Subscription';
import debounce from 'lodash/debounce';

/**
 * Generated class for the PersonSearchPage page.
 *
 * A page for searching person occurrences.
 * Can be filtered by collection and person type.
 * Persons can be stored in cache in order to work offline as well.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'person-search',
  segment: 'person-search/:type/:subtype',
  defaultHistory: ['HomePage']
})
@Component({
  selector: 'page-person-search',
  templateUrl: 'person-search.html'
})
export class PersonSearchPage {

  @ViewChild(Content) content: Content;

  persons: any[] = [];
  descending = false;
  order: number;
  count = 0;
  allData: OccurrenceResult[];
  cacheData: OccurrenceResult[];
  personsCopy: any[] = [];
  searchText: string;
  texts: SingleOccurrence[] = [];
  max_fetch_size = 500;

  personTitle: string;
  selectedLinkID: string;
  showLoading = false;
  showFilter = true;
  type: any;
  subType: any;
  agg_after_key: Record<string, any> = {};
  last_fetch_size = 0;

  filters: any[] = [];
  immediate_search = false;

  objectType = 'subject';
  pageTitle: string;
  mdContent: string;

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  personSearchTypes = [];
  filterYear: number;

  languageSubscription: Subscription;
  debouncedSearch = debounce(this.searchPersons, 750);

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              private mdContentService: MdContentService,
              protected config: ConfigService,
              public modalCtrl: ModalController,
              private app: App,
              private platform: Platform,
              protected textService: TextService,
              public loadingCtrl: LoadingController,
              public occurrenceService: OccurrenceService,
              protected storage: Storage,
              public translate: TranslateService,
              private toastCtrl: ToastController,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private cf: ChangeDetectorRef,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService,
              private tooltipService: TooltipService,
              public commonFunctions: CommonFunctionsService
  ) {
    const type = this.navParams.get('type') || null;
    this.filterYear = null;
    /*
    try {
      this.showFilter = this.config.getSettings('PersonSearch.ShowFilter');
    } catch (e) {
      this.showFilter = true;
    }
    */
    try {
      this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
    } catch (e) {
      this.personSearchTypes = [];
    }
    /*
    try {
      this.max_fetch_size = this.config.getSettings('PersonSearch.InitialLoadNumber');
    } catch (e) {
      this.max_fetch_size = 500;
    }
    */
  }

  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'person-search'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'personSearch',
      component: 'person-search'
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Subjects');
  }

  ionViewDidLoad() {
    this.getParamsData();
    this.selectMusicAccordionItem();
    this.getPersons();
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.getMdContent(lang + '-12-02');
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewDidLeave() {
    this.storage.remove('filterCollections');
    this.storage.remove('filterPersonTypes');
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getParamsData() {
    this.type = this.navParams.get('type');
    this.subType = this.navParams.get('subtype');

    if ( String(this.subType).includes('subtype') ) {
      this.subType = null;
      this.translate.get('TOC.PersonSearch').subscribe(
        translation => {
          this.pageTitle = translation;
        }, error => { this.pageTitle = null; }
      );
    }

    if (this.subType) {
      const subTypeObj = {
        key: this.subType,
        name: this.subType,
        selected: true
      }
      this.filters['filterPersonTypes'].push(subTypeObj);
      /**
       * TODO: Get correct page title if subtype person search
       */
      this.pageTitle = null;
    }
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

    if (!appHasMusicAccordion || !this.subType.length) {
      return;
    }

    if ( this.subType !== null ) {
      for ( let i = 0; i < this.personSearchTypes.length; i++ ) {
        if ( this.personSearchTypes[i].object_subtype === this.subType ) {
          this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: this.personSearchTypes[i].musicAccordionKey});
        }
      }
    }
  }

  getPersons() {
    this.showLoading = true;
    this.semanticDataService.getSubjectsElastic(this.agg_after_key, this.searchText, this.filters, this.max_fetch_size).subscribe(
      persons => {
        // console.log('Elastic response: ', persons);
        if (persons.error !== undefined) {
          console.error('Elastic search error getting persons: ', persons);
        }

        if (persons.aggregations && persons.aggregations.unique_subjects && persons.aggregations.unique_subjects.buckets.length > 0) {
          this.agg_after_key = persons.aggregations.unique_subjects.after_key;
          this.last_fetch_size = persons.aggregations.unique_subjects.buckets.length;

          console.log('Number of fetched persons: ', this.last_fetch_size);

          const combining = /[\u0300-\u036F]/g;

          persons = persons.aggregations.unique_subjects.buckets;
          persons.forEach(element => {
            element = element['key'];

            let sortByName = String(element['full_name']);
            if (element['sort_by_name']) {
              sortByName = String(element['sort_by_name']);
            }
            sortByName = sortByName.replace('ʽ', '').trim();
            sortByName = sortByName.replace(/^(?:de |von |van |af |d’ |d’|di |zu )/, '').toLowerCase();
            const ltr = sortByName.charAt(0);
            if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
              element['sort_by_name'] = sortByName;
            } else {
              element['sort_by_name'] = sortByName.normalize('NFKD').replace(combining, '').replace(',', '');
            }

            element['year_born_deceased'] = this.tooltipService.constructYearBornDeceasedString(element['date_born'],
            element['date_deceased']);

            if ( this.subType !== '' && this.subType !== null && element['type'] !== this.subType ) {
            } else {
              this.persons.push(element);
            }
          });
        } else {
          this.agg_after_key = {};
          this.last_fetch_size = 0;
        }

        this.allData = this.persons;
        this.cacheData = this.persons;
        this.sortListAlphabeticallyAndGroup(this.persons);
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

  sortListAlphabeticallyAndGroup(listOfPersons: any[]) {
    const persons = listOfPersons;

    this.commonFunctions.sortArrayOfObjectsAlphabetically(persons, 'sort_by_name');
    this.groupPersonsAlphabetically(persons);

    for (let j = 0; j < persons.length; j++) {
      if (persons[j].sort_by_name.length > 1) {
        persons[j]['firstOfItsKind'] = persons[j].sort_by_name.charAt(0);
        break;
      }
    }
    return persons;
  }

  groupPersonsAlphabetically(persons) {
    // Checks when first character changes in order to divide names into alphabetical groups
    for (let i = 0; i < persons.length ; i++) {
      if (persons[i] && persons[i - 1]) {
        if (persons[i].sort_by_name && persons[i - 1].sort_by_name) {
          if (persons[i].sort_by_name.length > 1 && persons[i - 1].sort_by_name.length > 1) {
            if (persons[i].sort_by_name.charAt(0) !== persons[i - 1].sort_by_name.charAt(0)) {
              const ltr = persons[i].sort_by_name.charAt(0);
              if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
                persons[i]['firstOfItsKind'] = persons[i].sort_by_name.charAt(0);
              }
            }
          }
        }
      }
    }
    return persons;
  }

  /**
   * TODO: No project sites have the filter modal enabled because it hasn't been fully developed yet.
   */
  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'person-search' });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        this.persons = [];
        this.allData = [];
        this.agg_after_key = {};
        this.filters = filters;
        if (filters['isEmpty'] || filters['isEmpty'] === undefined) {
          console.log('filters are empty')
          this.count = 0;
          this.getPersons();
        } else {
          this.allData = this.cacheData;
          if (filters.filterYear) {
            this.filterByYear(filters.filterYear);
          }
          if (filters.filterCollections) {
            const filterSelected = filters.filterCollections.some(function(el) {
              return el.selected === true;
            });
            if (filterSelected) {
              this.getSubjectsOccurrencesByCollection(filters.filterCollections, this.sortListAlphabeticallyAndGroup);
            }
          }
          if (filters.filterPersonTypes) {
            this.getPersons();
          }
        }
      }
    });
    filterModal.present();
  }

  filterByYear(year: number) {
    this.filterYear = year;
    this.getPersons();
  }

  getSubjectsOccurrencesByCollection(filterCollections, callback) {
    this.count = 0;
    const filterCollectionIds = [];

    for (const f of filterCollections) {
      filterCollectionIds.push(f.id);
    }

    for (const person of this.persons) {
      for (const occurrence of person.occurrences) {
        const inFilterList = filterCollectionIds.some(function(filter) {
          return filter === occurrence.collection_id;
        });
        if (!inFilterList) {
          this.persons.splice(this.persons.indexOf(person), 1);
          this.personsCopy.splice(this.persons.indexOf(person), 1);
        }
      }
    }
  }

  getSubjectsOccurrenceBySubjectType(filterTypes) {
    this.count = 0;
    const filterSubjectTypes = [];
    const newData = [];

    for (const f of filterTypes) {
      filterSubjectTypes.push(f.type);
    }

    for (let i = 0; i < this.allData.length; i ++) {
      for (let j = 0; j < filterSubjectTypes.length; j ++) {
        if (filterSubjectTypes[j] === this.allData[i].object_type) {
          newData.push(this.allData[i]);
        }
      }
    }

    this.persons = [];
    this.allData = newData;
    for (let k = 0; k < this.max_fetch_size; k++) {
      if (k === this.allData.length) {
        break;
      } else {
        this.persons.push(this.allData[this.count]);
        this.personsCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  showAll() {
    this.count = 0;
    this.filters = [];
    this.searchText = '';
    this.searchPersons();
  }

  filterByLetter(letter) {
    this.searchText = letter;
    this.searchPersons();
    this.scrollToTop();
  }

  onSearchInput() {
    if (this.immediate_search) {
      this.immediate_search = false;
      this.searchPersons();
    } else {
      this.debouncedSearch();
    }
  }

  onSearchClear() {
    this.immediate_search = true;
  }

  searchPersons() {
    this.agg_after_key = {};
    this.persons = [];
    if (this.showLoading) {
      this.debouncedSearch();
    } else {
      this.getPersons();
    }
  }

  loadMore(e) {
    this.getPersons();
  }

  hasMore() {
    return this.last_fetch_size > this.max_fetch_size - 1;
  }

  async openPerson(occurrenceResult: OccurrenceResult) {
    let showOccurrencesModalOnRead = false;
    if (this.config.getSettings('showOccurencesModalOnReadPageAfterSearch.tagSearch')) {
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
        occurrenceResult: occurrenceResult,
        showOccurrencesModalOnRead: showOccurrencesModalOnRead,
        objectType: this.objectType
      });

      occurrenceModal.present();
    }
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.mdContent = text.content; },
        error => { this.mdContent = ''; }
      );
  }

  scrollToTop() {
    const topElem = document.querySelector('.search-area-row') as HTMLElement;
    if (topElem) {
      this.commonFunctions.scrollElementIntoView(topElem, 'top', 0);
    }
  }

}
