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
  appName: string;
  descending = false;
  order: number;
  count = 0;
  allData: OccurrenceResult[];
  cacheData: OccurrenceResult[];
  personsCopy: any[] = [];
  searchText: string;
  texts: SingleOccurrence[] = [];
  infiniteScrollNumber = 800;

  personTitle: string;
  selectedLinkID: string;
  showLoading = false;
  showFilter = true;
  type: any;
  subType: any;
  from = 0;

  filters: any[] = [];

  objectType = 'subject';

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  cacheItem = false;
  personsKey = 'person-search';

  personSearchTypes = [];
  filterYear: number;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
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
              private metadataService: MetadataService
  ) {
    const type = this.navParams.get('type') || null;
    this.filterYear = null;
    this.langService.getLanguage().subscribe((lang) => {
      this.appName = this.config.getSettings('app.name.' + lang);
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
        this.infiniteScrollNumber = this.config.getSettings('PersonSearch.InitialLoadNumber');
      } catch (e) {
        this.infiniteScrollNumber = 800;
      }
    });
  }

  getParamsData() {
    this.type = this.navParams.get('type');
    this.subType = this.navParams.get('subtype');

    if ( String(this.subType).includes('subtype') ) {
      this.subType = null;
    }

    if (this.subType) {
      this.personsKey += `-${this.subType}`;
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

  ionViewDidLeave() {
    this.storage.remove('filterCollections');
    this.storage.remove('filterPersonTypes');
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Subjects');
  }

  ionViewWillLeave() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true);
    this.getParamsData();
    this.selectMusicAccordionItem();
    this.setData();
  }

  sortByLetter(letter) {
    this.searchText = letter;
    this.persons = [];
    this.cf.detectChanges();
    this.getPersons();
    this.content.scrollToTop(400);
  }

  setData() {
    this.storage.get(this.personsKey).then((persons) => {
      if (persons) {
        this.cacheItem = true;
        this.getCacheText(this.personsKey);
      } else {
        this.getPersons();
      }
    });
  }

  getPersons() {
    this.showLoading = true;
    this.semanticDataService.getSubjectsElastic(this.from, this.searchText, this.filters, this.infiniteScrollNumber).subscribe(
      persons => {
        const personsTmp = [];
        persons = persons.hits.hits;
        persons.forEach(element => {
          element = element['_source'];
          const sortBy = [];
          let sortByName = String(element['full_name']).toLowerCase().replace('ʽ', '');
          sortByName = sortByName.replace('de ', '');
          sortByName = sortByName.replace('von ', '');
          sortByName = sortByName.replace('van ', '');
          sortByName = sortByName.replace('af ', '');
          sortByName = sortByName.trim();
          if ( element['date_deceased'] !== null ) {
            element['date_deceased'] = String(element['date_deceased']).replace(/^0+/, '');
          }
          if ( element['date_born'] !== null ) {
            element['date_born'] = String(element['date_born']).replace(/^0+/, '');
          }
          element.year_born_deceased = element['date_born'] + '–' + element['date_deceased'];
          sortBy.push(sortByName);
          element['sortBy'] = sortBy.join();
          const ltr = element['sortBy'].charAt(0);
          if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
          } else {
            const combining = /[\u0300-\u036F]/g;
            element['sortBy'] = element['sortBy'].normalize('NFKD').replace(combining, '').replace(',', '');
          }
          if ( this.subType !== '' && this.subType !== null && element['type'] !== this.subType ) {
          } else {
            let found = false;
            this.persons.forEach(pers => {
              if ( pers.id === element['id'] ) {
                found = true;
              }
            });
            if ( !found ) {
              personsTmp.push(element);
              this.persons.push(element);
            }
          }
        });

        console.log('persons', this.persons);
        this.allData = this.persons;
        this.cacheData = this.persons;
        this.showLoading = false;
        this.sortListAlphabeticallyAndGroup(this.persons);
      },
      err => {console.error(err); this.showLoading = false; }
    );
  }

  async download() {
    this.cacheItem = !this.cacheItem;

    if (this.cacheItem) {
      await this.storeCacheText(this.personsKey, this.cacheData);
    } else if (!this.cacheItem) {
      this.removeFromCache(this.personsKey);
    }
  }

  async storeCacheText(id: string, text: any) {
    await this.storage.set(id, text);
    await this.addedToCacheToast(id);
  }

  async removeFromCache(id: string) {
    await this.storage.remove(id);
    await this.removedFromCacheToast(id);
  }

  getCacheText(id: string) {
    this.storage.get(id).then((persons) => {
      this.allData = persons;

      this.sortListAlphabeticallyAndGroup(this.allData);

      for (let i = 0; i < this.infiniteScrollNumber; i++) {
        this.persons.push(this.allData[this.count]);
        this.personsCopy.push(this.allData[this.count]);
        this.count++
      }
    });
  }

  async addedToCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'Persons downloaded successfully';
      } else {
        status = 'Persons were not added to cache';
      }
    });

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    await toast.present();
  }

  async removedFromCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'Persons were not removed from cache';
      } else {
        status = 'Persons were successfully removed from cache';
      }
    });

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    await toast.present();
  }

  sortListAlphabeticallyAndGroup(listOfPersons: any[]) {
    const persons = listOfPersons;

    this.sortPersonsAlphabetically(persons);
    this.groupPersonsAlphabetically(persons);

    for (let j = 0; j < persons.length; j++) {
      if (persons[j].sortBy.length > 1) {
        persons[j]['firstOfItsKind'] = persons[j].sortBy.charAt(0);
        break;
      }
    }
    return persons;
  }

  groupPersonsAlphabetically(persons) {
    // Checks when first character changes in order to divide names into alphabetical groups
    for (let i = 0; i < persons.length ; i++) {
      if (persons[i] && persons[i - 1]) {
        if (persons[i].sortBy && persons[i - 1].sortBy) {
          if (persons[i].sortBy.length > 1 && persons[i - 1].sortBy.length > 1) {
            if (persons[i].sortBy.charAt(0) !== persons[i - 1].sortBy.charAt(0)) {
              const ltr = persons[i].sortBy.charAt(0);
              if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
                persons[i]['firstOfItsKind'] = persons[i].sortBy.charAt(0);
              }
            }
          }
        }
      }
    }
    return persons;
  }
  sortPersonsAlphabetically(persons) {
    persons.sort(function(a, b) {
      if (a.sortBy.charCodeAt(0) < b.sortBy.charCodeAt(0)) { return -1; }
      if (a.sortBy.charCodeAt(0) > b.sortBy.charCodeAt(0)) { return 1; }
      return 0;
    });

    return persons;
  }
  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'person-search' });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        this.persons = [];
        this.allData = [];
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
    for (let k = 0; k < this.infiniteScrollNumber; k++) {
      if (k === this.allData.length) {
        break;
      } else {
        this.persons.push(this.allData[this.count]);
        this.personsCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  loadMorePersons() {
    for (let i = 0; i < this.infiniteScrollNumber; i++) {
      if (i === this.allData.length) {
        break;
      } else {
        this.persons.push(this.allData[this.count]);
        this.personsCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  onChanged(obj) {
    this.cf.detectChanges();
    console.log('segment changed')
    this.filter(obj);
  }

  filter(terms) {
    if ( terms._value ) {
      terms = terms._value;
    }
    if ( !terms || terms === '' ) {
      this.persons = this.personsCopy;
    } else if (terms != null) {
      this.from = 0;
      this.getPersons();
      this.persons = [];
      terms = String(terms).toLowerCase().replace(' ', '');
      for (const person of this.allData) {
        let sortBy = String(person.full_name).toLowerCase().replace(' ', '').replace('ʽ', '');
        sortBy = sortBy.replace('de', '').replace('von', '').replace('van', '').replace('af', '');
        let sortByReverse = String(person.full_name).toLowerCase().replace(' ', '').replace('ʽ', '');
        sortByReverse = sortByReverse.replace('de', '').replace('von', '').replace('van', '').replace('af', '');
        if (sortBy) {
          if (sortBy.includes(terms) || sortByReverse.includes(terms)) {
            const inList = this.persons.some(function(p) {
              return (p.sortBy === person.sortBy)
            });
            if (!inList) {
              this.persons.push(person);
            }
          }
        }
      }
    } else {
    }
  }

  doInfinite(infiniteScroll) {
    this.from += this.infiniteScrollNumber;
    this.getPersons();
    infiniteScroll.complete();
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

  showAll() {
    /*
    this.persons = [];
    this.allData = [];
    this.count = 0;
    this.allData = this.cacheData;
    this.loadMorePersons();
    */
    this.count = 0;
    this.from = 0;
    this.searchText = '';
    this.filters = [];
    this.persons = [];
    this.getPersons();
    this.content.scrollToTop(400);
  }

}
