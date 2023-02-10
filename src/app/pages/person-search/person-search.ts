import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import debounce from 'lodash/debounce';
import { EventsService } from 'src/app/services/events/events.service';
import { LoadingController, ModalController, NavController, NavParams, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { OccurrenceService } from 'src/app/services/occurrence/occurence.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { MetadataService } from 'src/app/services/metadata/metadata.service';
import { TooltipService } from 'src/app/services/tooltips/tooltip.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { OccurrenceResult } from 'src/app/models/occurrence.model';
import { FilterPage } from 'src/pages/filter/filter';
import { OccurrencesPage } from 'src/app/modals/occurrences/occurrences';

/**
 * A page for searching person occurrences.
 * Can be filtered by person type and year born, as well as searched.
 */

@Component({
  selector: 'page-person-search',
  templateUrl: 'person-search.html',
  styleUrls: ['person-search.scss']
})
export class PersonSearchPage {
  persons: any[] = [];
  searchText?: string;
  max_fetch_size = 500;
  last_fetch_size = 0;
  agg_after_key: Record<string, any> = {};
  showLoading = false;
  showFilter = true;
  filters: any = [];
  immediate_search = false;
  type: any;
  subType: any;
  objectType = 'subject';
  pageTitle?: string | null;
  mdContent?: string;

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  personSearchTypes = [] as any;

  languageSubscription?: Subscription;
  debouncedSearch = debounce(this.searchPersons, 500);

  constructor(public navCtrl: NavController,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              private mdContentService: MdContentService,
              protected config: ConfigService,
              public modalCtrl: ModalController,
              private platform: Platform,
              public loadingCtrl: LoadingController,
              public occurrenceService: OccurrenceService,
              protected storage: StorageService,
              public translate: TranslateService,
              private userSettingsService: UserSettingsService,
              private events: EventsService,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService,
              private tooltipService: TooltipService,
              public commonFunctions: CommonFunctionsService,
              private router: Router,
              private route: ActivatedRoute
  ) {
    try {
      this.showFilter = this.config.getSettings('PersonSearch.ShowFilter') as any;
    } catch (e) {
      this.showFilter = true;
    }

    try {
      this.personSearchTypes = this.config.getSettings('PersonSearchTypes');
    } catch (e) {
      this.personSearchTypes = [];
    }

    try {
      this.max_fetch_size = this.config.getSettings('PersonSearch.InitialLoadNumber') as any;
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

    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'person-search'});
    this.events.publishSelectedItemInMenu({
      menuID: 'personSearch',
      component: 'person-search'
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Subjects');
  }

  ngOnInit() {
    this.getParamsData();
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.getMdContent(lang + '-12-02');
      }
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getParamsData() {
    this.route.params.subscribe(params => {
      this.type = params['type'] || null;
      this.subType = params['subtype'];
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
        this.filters['filterPersonTypes' as keyof typeof this.filters] = [];
        this.filters['filterPersonTypes' as keyof typeof this.filters].push(subTypeObj);
        /**
         * TODO: Get correct page title if subtype person search
         */
        this.pageTitle = null;
      }

      this.selectMusicAccordionItem();
      this.getPersons();
    });

  }

  appHasMusicAccordionConfig() {
    let appHasMusicAccordion = false;

    try {
      appHasMusicAccordion = this.config.getSettings('AccordionMusic') as any;
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
          this.events.publishMusicAccordionSetSelected({musicAccordionKey: this.personSearchTypes[i].musicAccordionKey});
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
          persons.forEach((element: any) => {
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

  groupPersonsAlphabetically(persons: any) {
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

  async openFilterModal() {
    const filterModal = await this.modalCtrl.create({
      component: FilterPage,
      componentProps: {
        searchType: 'person-search',
        activeFilters: this.filters
      }
    });
    filterModal.onDidDismiss().then((filters: any) => {
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
    // this.scrollToTop();
  }

  filterByLetter(letter: any) {
    this.searchText = letter;
    this.searchPersons();
    // this.scrollToTop();
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

  loadMore(e: any) {
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
      openOccurrencesAndInfoOnNewPage = this.config.getSettings('OpenOccurrencesAndInfoOnNewPage') as any;
    } catch (e) {
      openOccurrencesAndInfoOnNewPage = false;
    }

    if (openOccurrencesAndInfoOnNewPage) {
      const params = {
        id: occurrenceResult.id,
        objectType: this.objectType
      }

      if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
        this.router.navigate(['occurrences-result'], { queryParams: params });
      } else {
        this.router.navigate(['occurrences-result'], { queryParams: params });
      }

    } else {
      const occurrenceModal = await this.modalCtrl.create({
        component: OccurrencesPage,
        id: occurrenceResult.id,
        componentProps: {
          type: this.objectType,
          showOccurrencesModalOnRead: showOccurrencesModalOnRead
        }
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
    // this.content.scrollToTop(400);
  }

}
