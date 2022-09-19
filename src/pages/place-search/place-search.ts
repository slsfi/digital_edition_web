import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Platform, ToastController,
  ModalController, Content, Events, ViewController } from 'ionic-angular';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';
import { TextService } from '../../app/services/texts/text.service';
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

/**
 * Generated class for the PlaceSearchPage page.
 *
 * A page for searching place occurrences.
 * Can be filtered by collection.
 * Places can be stored in cache in order to work offline as well.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
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
  appName: string;
  descending = false;
  order: number;
  column = 'name';
  count = 0;
  allData: OccurrenceResult[];
  placesCopy: any[] = [];
  searchText: string;
  texts: any[] = [];
  cacheData: OccurrenceResult[];
  placesKey = 'place-search';
  cacheItem = false;
  showLoading = false;
  showFilter = true;
  mdContent: string;

  from = 0;
  infiniteScrollNumber = 30;

  selectedLinkID: string;

  objectType = 'location';

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];


  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public semanticDataService: SemanticDataService,
              protected langService: LanguageService,
              private mdContentService: MdContentService,
              protected config: ConfigService,
              private app: App,
              private platform: Platform,
              protected textService: TextService,
              public occurrenceService: OccurrenceService,
              protected storage: Storage,
              private events: Events,
              private toastCtrl: ToastController,
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private userSettingsService: UserSettingsService,
              private cf: ChangeDetectorRef,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService
  ) {
    this.langService.getLanguage().subscribe((lang) => {
      this.appName = this.config.getSettings('app.name.' + lang);
      try {
        this.showFilter = this.config.getSettings('LocationSearch.ShowFilter');
      } catch (e) {
        this.showFilter = true;
      }
      this.getMdContent(lang + '-12-03');
    });
    this.setData();
  }

  setData() {
    this.storage.get(this.placesKey).then((places) => {
      if (places) {
        this.cacheItem = true;
        this.getCacheText(this.placesKey);
      } else {
        this.getPlaces();
      }
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Places');
  }

  ionViewDidLoad() {
    this.events.subscribe('language:change', () => {
      this.langService.getLanguage().subscribe((lang) => {
        this.getMdContent(lang + '-12-03');
      });
    });
  }

  async getPlaces() {
    this.showLoading = true;
    this.semanticDataService.getLocationElastic(this.from, this.searchText).subscribe(
      places => {
        places = places.hits.hits;
        this.showLoading = false;

        const placesTmp = [];
        places.forEach(element => {
          element = element['_source'];
          element['sortBy'] = String(element['name']).toLowerCase().trim().replace('ʽ', '');
          const ltr = element['sortBy'].charAt(0);
          const mt = ltr.match(/[a-zåäö]/i);
          if (ltr.length === 1 && ltr.match(/[a-zåäö]/i) !== null) {
            // console.log(ltr);
          } else {
            const combining = /[\u0300-\u036F]/g;
            element['sortBy'] = element['sortBy'].normalize('NFKD').replace(combining, '').replace(',', '');
          }
          let found = false;
          this.places.forEach(place => {
            if ( place.id === element['id'] ) {
              found = true;
            }
          });
          if ( !found ) {
            placesTmp.push(element);
            this.places.push(element);
          }
        });

        this.allData = this.places;
        this.cacheData = this.places;
        this.sortListAlphabeticallyAndGroup(this.allData);
      },
      err => {console.error(err); this.showLoading = false; }
    );
  }

  loadMorePlaces() {
    for (let i = 0; i < 30; i++) {
      if (i === this.allData.length) {
        break;
      } else {
        this.places.push(this.allData[this.count]);
        this.placesCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  onChanged(obj) {
    this.cf.detectChanges();
    console.log('segment changed')
    this.filter(obj);
  }

  showAll() {
    /*
    this.places = [];
    this.allData = [];
    this.count = 0;
    this.allData = this.cacheData;
    this.loadMorePlaces();
    */
    this.count = 0;
    this.from = 0;
    this.searchText = '';
    this.places = [];
    this.getPlaces();
    this.content.scrollToTop(400);
  }

  ionViewDidLeave() {
    this.storage.remove('filterCollections');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
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
    this.selectMusicAccordionItem();
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
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

  sortByLetter(letter: any) {
    this.searchText = letter;
    this.getPlaces();
    const list = [];
    try {
      for (const p of this.allData) {
        if (p.sortBy && p.sortBy.charCodeAt(0) === String(letter).toLowerCase().charCodeAt(0)) {
          list.push(p);
        } else {
          const combining = /[\u0300-\u036F]/g;
          const tmpChar = p.sortBy.normalize('NFKD').replace(combining, '').replace(',', '');
          if ( tmpChar.charCodeAt(0) === String(letter).toLowerCase().charCodeAt(0) ) {
            list.push(p);
          }
        }
      }
    } catch ( e ) {
      this.places = this.allData;
    }
    this.places = list;
    this.content.scrollToTop(400);
  }

  filter(terms) {
    if ( terms._value ) {
      terms = terms._value;
    }
    if (terms != null) {
      this.from = 0;
      this.getPlaces().then(() => {
        const oldPersons = this.places;
        this.places = [];
        terms = terms.toLocaleLowerCase();
        for (const place of this.allData) {
          if (place.sortBy) {
            const title = String(place.name).toLowerCase().replace(' ', '').replace('ʽ', '');
            if (title.includes(terms) ) {
              const inList = this.places.some(function(p) {
                return p.sortBy === place.sortBy
              });
              if (!inList && title.charAt(0) === String(terms).toLowerCase().charAt(0)) {
                this.places.push(place);
              }
            }
          }
        }
      });

    } else {
      this.places = this.placesCopy;
    }
  }

  doInfinite(infiniteScroll) {
    this.from += this.infiniteScrollNumber;
    this.getPlaces();
    infiniteScroll.complete();
  }

  async openPlace(occurrenceResult: OccurrenceResult) {
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

  async download() {
    this.cacheItem = !this.cacheItem;

    if (this.cacheItem) {
      await this.storeCacheText(this.placesKey, this.cacheData);
    } else if (!this.cacheItem) {
      this.removeFromCache(this.placesKey);
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
    this.storage.get(id).then((places) => {
      this.allData = places;

      this.sortListAlphabeticallyAndGroup(this.allData);

      for (let i = 0; i < 30; i++) {
        this.places.push(this.allData[this.count]);
        this.placesCopy.push(this.allData[this.count]);
        this.count++
      }
    });
  }

  async addedToCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'Places downloaded successfully';
      } else {
        status = 'Places were not added to cache';
      }
    });

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
    });

    await toast.present();
  }

  async removedFromCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'Places were not removed from cache';
      } else {
        status = 'Places were successfully removed from cache';
      }
    });

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
    });

    await toast.present();
  }

  sortListAlphabeticallyAndGroup(list: any[]) {
    const data = list;

    // Sort alphabetically
    data.sort(function(a, b) {
      if (a.sortBy.charCodeAt(0) < b.sortBy.charCodeAt(0)) { return -1; }
      if (a.sortBy.charCodeAt(0) > b.sortBy.charCodeAt(0)) { return 1; }
      return 0;
    });

    // Check when first character changes in order to divide names into alphabetical groups
    for (let i = 0; i < data.length ; i++) {
      if (data[i] && data[i - 1]) {
        if (data[i].sortBy && data[i - 1].sortBy) {
          if (data[i].sortBy.length > 1 && data[i - 1].sortBy.length > 1) {
            if (data[i].sortBy.charAt(0) !== data[i - 1].sortBy.charAt(0)) {
              const ltr = data[i].sortBy.charAt(0);
              if (ltr.length === 1 && ltr.match(/[a-zåäö]/i)) {
                data[i]['firstOfItsKind'] = data[i].sortBy.charAt(0);
              }
            }
          }
        }
      }
    }

    for (let j = 0; j < data.length; j++) {
      if (data[j].sortBy.length > 1) {
        data[j]['firstOfItsKind'] = data[j].sortBy.charAt(0);
        break;
      }
    }

    return data;
  }

  openText(text: any) {
    const params = {};
    const nav = this.app.getActiveNavs();
    const col_id = text.collectionID.split('_')[0];
    const pub_id = text.collectionID.split('_')[1];
    let text_type: string;

    if (text.textType === 'ms') {
      text_type = 'manuscript';
    } else if (text.textType === 'var') {
      text_type = 'variation';
    } else if (text.textType === 'facs') {
      text_type = 'facsimile'
    } else {
      text_type = 'commentary';
    }

    params['tocLinkId'] = text.collectionID;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    params['views'] = [
      {
        type: text_type,
        id: text.linkID
      }
    ];

    if (this.platform.is('mobile')) {
      nav[0].push('read', params);
    } else {
      console.log('Opening read from PlaceSearch.openText()');
      nav[0].setRoot('read', params);
    }
  }

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'place-search' });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        if (filters['isEmpty']) {
          this.places = [];
          this.allData = [];
          this.count = 0;
          this.getPlaces();
        }
        if (filters.filterCollections) {
          const filterSelected = filters.filterCollections.some(function(el) {
            return el.selected === true;
          });
          if (filterSelected) {
            this.getSubjectsOccurrencesByCollection(filters.filterCollections, this.sortListAlphabeticallyAndGroup);
          }
        }
      }
    });
    filterModal.present();
  }

  getSubjectsOccurrencesByCollection(filterCollections, callback) {
    this.count = 0;
    const filterCollectionIds = [];

    for (const f of filterCollections) {
      filterCollectionIds.push(f.id);
    }

    for (const place of this.places) {
      for (const occurrence of place.occurrences) {
        const inFilterList = filterCollectionIds.some(function(filter) {
          return filter === occurrence.collection_id;
        });
        if (!inFilterList) {
          this.places.splice(this.places.indexOf(place), 1);
          this.placesCopy.splice(this.places.indexOf(place), 1);
        }
      }
    }
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.mdContent = text.content; },
        error => { this.mdContent = ''; }
      );
  }

}
