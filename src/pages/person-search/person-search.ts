import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, App, Platform,
  LoadingController, Events, Content } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';
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
 * A page for searching person occurrences.
 * Can be filtered by person type and year born, as well as searched.
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
  searchText: string;
  max_fetch_size = 500;
  last_fetch_size = 0;
  agg_after_key: Record<string, any> = {};
  showLoading = false;
  showFilter = true;
  filters: any[] = [];
  immediate_search = false;
  type: any;
  subType: any;
  objectType = 'subject';
  pageTitle: string;
  mdContent: string;

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  personSearchTypes = [];

  languageSubscription: Subscription;
  debouncedSearch = debounce(this.searchPersons, 500);

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              private mdContentService: MdContentService,
              protected config: ConfigService,
              public modalCtrl: ModalController,
              private app: App,
              private platform: Platform,
              public loadingCtrl: LoadingController,
              public occurrenceService: OccurrenceService,
              protected storage: Storage,
              public translate: TranslateService,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService,
              private tooltipService: TooltipService,
              public commonFunctions: CommonFunctionsService
  ) {
    try {
      this.showFilter = this.config.getSettings('PersonSearch.ShowFilter');
    } catch (e) {
      this.showFilter = true;
    }

    try {
      this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
    } catch (e) {
      this.personSearchTypes = [];
    }

    try {
      this.max_fetch_size = this.config.getSettings('PersonSearch.InitialLoadNumber');
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

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getParamsData() {
    this.type = this.navParams.get('type') || null;
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
      this.filters['filterPersonTypes'] = [];
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
            sortByName = sortByName.replace(/^(?:de la |de |von |van |af |d’ |d’|di |du |des |zu |auf |del |do |dos |da |das |e )/, '');
            sortByName = sortByName.toLowerCase();
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
          if (persons[i].sort_by_name.length > 0 && persons[i - 1].sort_by_name.length > 0) {
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

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'person-search', activeFilters: this.filters });
    filterModal.onDidDismiss(filters => {
      if (filters) {
        this.persons = [];
        this.agg_after_key = {};
        this.filters = filters;
        this.getPersons();
      }
    });
    filterModal.present();
  }

  showAll() {
    this.filters = [];
    this.searchText = '';
    this.searchPersons();
    this.scrollToTop();
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
    if (this.config.getSettings('showOccurencesModalOnReadPageAfterSearch.personSearch')) {
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

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.mdContent = text.content; },
        error => { this.mdContent = ''; }
      );
  }

  scrollToTop() {
    this.content.scrollToTop(400);
  }

}
