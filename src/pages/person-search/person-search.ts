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
  segment: 'search/:type/:subtype',
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
  infiniteScrollNumber = 30;

  personTitle: string;
  selectedLinkID: string;
  showLoading = false;
  showFilter = true;
  type: any;
  subType: any;

  objectType = 'subject';

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  cacheItem = false;
  personsKey = 'person-search';

  personSearchTypes = [];

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
              private toastCtrl: ToastController,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private cf: ChangeDetectorRef
  ) {
    const type = this.navParams.get('type') || null;
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
    });
    this.events.publish('view:enter', 'person-search');
  }

  getParamsData() {
    this.type = this.navParams.get('type');
    this.subType = this.navParams.get('subtype');

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

    this.subType = this.navParams.get('subtype') || null;

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

  ionViewWillLeave() {
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
    const list = [];
    try {
      for (const p of this.allData) {
        if (p.name && p.name.startsWith(letter)) {
          list.push(p);
        }
      }
    } catch ( e ) {
      this.persons = this.allData;
    }
    this.persons = list;
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
    this.semanticDataService.getSubjectOccurrences().subscribe(
      persons => {
        const personsTmp = [];
        persons.forEach(element => {
          const sortBy = [];
          if ( element['last_name'] != null ) {
            sortBy.push(String(element['last_name']).toLowerCase().trim().replace(' ', ''));
          }
          if ( element['first_name'] != null ) {
            sortBy.push(String(element['first_name']).toLowerCase().trim().replace(' ', ''));
          }

          if ( element['last_name'] == null && element['first_name'] == null ) {
            sortBy.push(String(element['name']).toLowerCase().trim().replace(' ', ''));
          }

          element['sortBy'] = sortBy.join();

          if ( this.subType !== '' && element['object_type'] !== this.subType ) {
          } else {
            personsTmp.push(element);
          }
        });

        this.allData = personsTmp;
        this.cacheData = personsTmp;
        this.showLoading = false;
        this.sortListAlphabeticallyAndGroup(this.allData);

        for (let i = 0; i < this.infiniteScrollNumber; i++) {
          if (i === personsTmp.length) {
            break;
          } else {
            this.persons.push(personsTmp[this.count]);
            this.personsCopy.push(personsTmp[this.count]);
            this.count++;
          }
        }
      },
      err => {console.error(err); this.showLoading = false; },
      () => console.log(this.persons)
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
              if (ltr.length === 1 && ltr.match(/[a-z]/i)) {
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
      if (a.sortBy < b.sortBy) { return -1; }
      if (a.sortBy > b.sortBy) { return 1; }
      return 0;
    });

    return persons;
  }

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'person-search' });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        if (filters['isEmpty']) {
          console.log('filters are empty')
          this.persons = [];
          this.allData = [];
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
            const filterSelected = filters.filterPersonTypes.some(function(el) {
              return el.selected === true;
            });
            if (filterSelected) {
              this.getSubjectsOccurrenceBySubjectType(filters.filterPersonTypes);
            }
          }
        }
      }
    });
    filterModal.present();
  }

  filterByYear(year: number) {
    this.count = 0;
    const newData = [];

    for (const p of this.allData) {
      if (p.date_born && p.date_deceased) {
        if (Number(p.date_born.match(/\S+/g)[3]) < year && Number(p.date_deceased.match(/\S+/g)[3]) > year) {
          newData.push(p);
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
      const oldPersons = this.persons;
      this.persons = [];
      terms = String(terms).toLowerCase().replace(' ', '');
      for (const person of this.allData) {
        const sortBy = String(person.first_name + '' + person.last_name).toLowerCase().replace(' ', '');
        const sortByReverse = String(person.last_name + '' + person.first_name).toLowerCase().replace(' ', '');
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
    for (let i = 0; i < this.infiniteScrollNumber; i++) {
      if ( this.allData !== undefined ) {
        this.persons.push(this.allData[this.count]);
        this.personsCopy.push(this.allData[this.count]);
        this.count++
      }
    }
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
    this.persons = [];
    this.allData = [];
    this.count = 0;
    this.allData = this.cacheData;
    this.loadMorePersons();
    this.content.scrollToTop(400);
  }

}
