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
import { Subscription } from 'rxjs/Subscription';

/**
 * Generated class for the worksearchPage page.
 *
 * A page for searching work occurrences.
 * Can be filtered by collection.
 * works can be stored in cache in order to work offline as well.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'work-search',
  segment: 'works'
})
@Component({
  selector: 'page-work-search',
  templateUrl: 'work-search.html',
})
export class WorkSearchPage {

  @ViewChild(Content) content: Content;

  works: any[] = [];
  descending = false;
  order: number;
  column = 'name';
  count = 0;
  allData: OccurrenceResult[];
  worksCopy: any[] = [];
  searchText: string;
  texts: any[] = [];
  cacheData: OccurrenceResult[];
  worksKey = 'work-search';
  cacheItem = false;
  showLoading = false;
  showFilter = true;
  objectType = 'work';
  mdContent: string;

  selectedLinkID: string;

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];
  from = 0;
  infiniteScrollNumber = 200;

  languageSubscription: Subscription;

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
              private toastCtrl: ToastController,
              public viewCtrl: ViewController,
              public modalCtrl: ModalController,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private cf: ChangeDetectorRef,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService
  ) {
    try {
      this.showFilter = this.config.getSettings('WorkSearch.ShowFilter');
    } catch (e) {
      this.showFilter = false;
    }
    try {
      this.infiniteScrollNumber = this.config.getSettings('WorkSearch.InitialLoadNumber');
    } catch (e) {
      this.infiniteScrollNumber = 200;
    }
  }

  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'work-search'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'workSearch',
      component: 'work-search'
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Works');
  }

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.setData();
      if (lang) {
        this.getMdContent(lang + '-12-05');
      } else {
        this.langService.getLanguage().subscribe(language => {
          this.getMdContent(language + '-12-05');
        });
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewDidLeave() {
    this.storage.remove('filterCollections');
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  setData() {
    this.storage.get(this.worksKey).then((works) => {
      if (works) {
        this.cacheItem = true;
        this.getCacheText(this.worksKey);
      } else {
        this.getworks();
      }
    });
  }

  getworks() {
    this.showLoading = true;
    this.semanticDataService.getWorksElastic(this.from, this.searchText).subscribe(
      works => {
        works = works.hits.hits;
        this.showLoading = false;

        const worksTmp = [];
        works.forEach(element => {
          element = element['_source'];

          element['sortBy'] = String(element['title']).trim().replace('ʽ', '');

          // remove any empty author_data
          if ( element['author_data'][0]['id'] === undefined ) {
            element['author_data'] = [];
          }

          if ( element['author_data'].length > 0 ) {
            element['sortBy'] = String(element['author_data'][0]['first_name']).trim().replace('ʽ', '');
          }

          // prefer sorting by last_name
          if ( element['author_data'].length > 0 && String(element['author_data'][0]['last_name']).trim().length > 0 ) {
            element['sortBy'] = String(element['author_data'][0]['last_name']).trim().replace('ʽ', '');
          }

          const ltr = element['sortBy'].charAt(0);
          const mt = ltr.match(/[a-zåäö]/i);
          if (ltr.length === 1 && ltr.match(/[a-zåäö]/i) !== null) {
            // console.log(ltr);
          } else {
            const combining = /[\u0300-\u036F]/g;
            element['sortBy'] = element['sortBy'].normalize('NFKD').replace(combining, '').replace(',', '');
          }
          let found = false;
          this.works.forEach(work => {
            work.id = work.man_id;
            work.description = work.reference;
            work.name = work.title;
            if ( work.id === element['id'] ) {
              found = true;
            }
          });
          if ( !found ) {
            worksTmp.push(element);
            this.works.push(element);
          }
        });

        this.allData = this.works;
        this.cacheData = this.works;
        this.sortListAlphabeticallyAndGroup(this.allData);
      },
      err => {console.error(err); this.showLoading = false; }
    );
  }

  loadMoreworks() {
    for (let i = 0; i < this.infiniteScrollNumber; i++) {
      if (i === this.allData.length) {
        break;
      } else {
        this.works.push(this.allData[this.count]);
        this.worksCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  showAll() {
    /*
    this.works = [];
    this.allData = [];
    this.count = 0;
    this.allData = this.cacheData;
    this.loadMoreworks();
    */
    this.count = 0;
    this.from = 0;
    this.searchText = '';
    this.works = [];
    this.getworks();
    this.content.scrollToTop(400);
  }

  sortByLetter(letter) {
    const list = [];

    for (const p of this.allData) {
      if (p.name && p.name.startsWith(letter)) {
        list.push(p);
      }
    }

    this.works = list;
    this.content.scrollToTop(400);
  }

  filter(terms) {
    if ( terms._value ) {
      terms = terms._value;
    }
    if (!terms) {
      this.works = this.worksCopy;
    } else if (terms != null) {
      this.from = 0;
      this.works = [];
      this.getworks();
      terms = String(terms).toLowerCase().replace(' ', '');
      for (const work of this.allData) {
        if (work.name) {
          const title = work.name.toLocaleLowerCase();
          if (title.includes(terms)) {
            const inList = this.works.some(function(p) {
              return p.name === work.name
            });
            if (!inList) {
              this.works.push(work);
            }
          }
        }
      }
    } else {
      this.worksCopy = this.worksCopy;
    }
  }

  onChanged(obj) {
    this.cf.detectChanges();
    this.filter(obj);
  }

  doInfinite(infiniteScroll) {
    this.from += this.infiniteScrollNumber;
    this.getworks();
    infiniteScroll.complete();
  }

  async openWork(occurrenceResult: OccurrenceResult) {
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
      await this.storeCacheText(this.worksKey, this.cacheData);
    } else if (!this.cacheItem) {
      this.removeFromCache(this.worksKey);
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
    this.storage.get(id).then((works) => {
      this.allData = works;

      this.sortListAlphabeticallyAndGroup(this.allData);

      for (let i = 0; i < 30; i++) {
        this.works.push(this.allData[this.count]);
        this.worksCopy.push(this.allData[this.count]);
        this.count++
      }
    });
  }

  async addedToCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'works downloaded successfully';
      } else {
        status = 'works were not added to cache';
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
        status = 'works were not removed from cache';
      } else {
        status = 'works were successfully removed from cache';
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

  sortListAlphabeticallyAndGroup(list: any[]) {
    const data = list;

    // Sort alphabetically
    data.sort(function(a, b) {
      if (a.sortBy < b.sortBy) { return -1; }
      if (a.sortBy > b.sortBy) { return 1; }
      return 0;
    });

    // Check when first character changes in order to divide names into alphabetical groups
    for (let i = 0; i < data.length ; i++) {
      if (data[i] && data[i - 1]) {
        if (data[i].sortBy && data[i - 1].sortBy) {
          if (data[i].sortBy.length > 1 && data[i - 1].sortBy.length > 1) {
            if (data[i].sortBy.charAt(0) !== data[i - 1].sortBy.charAt(0)) {
              console.log(data[i].sortBy.charAt(0) + ' != ' + data[i - 1].sortBy.charAt(0))
              const ltr = data[i].sortBy.charAt(0);
              if (ltr.length === 1 && ltr.match(/[a-z]/i)) {
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

    text_type = 'established';
    params['tocLinkId'] = text.collectionID;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    params['views'] = [
      {
        type: text_type,
        id: text.linkID
      }
    ];
      this.app.getRootNav().push('read', params);
  }

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'work-search' });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        if (filters['isEmpty']) {
          console.log('filters are empty')
          this.works = [];
          this.allData = [];
          this.count = 0;
          this.getworks();
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

    for (const work of this.works) {
      for (const occurrence of work.occurrences) {
        const inFilterList = filterCollectionIds.some(function(filter) {
          return filter === occurrence.collection_id;
        });
        if (!inFilterList) {
          this.works.splice(this.works.indexOf(work), 1);
          this.worksCopy.splice(this.works.indexOf(work), 1);
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
