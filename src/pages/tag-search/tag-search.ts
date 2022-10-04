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
 * Generated class for the tagsearchPage page.
 *
 * A page for searching tag occurrences.
 * Can be filtered by collection.
 * tags can be stored in cache in order to work offline as well.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'tag-search',
  segment: 'tags'
})
@Component({
  selector: 'page-tag-search',
  templateUrl: 'tag-search.html',
})
export class TagSearchPage {

  @ViewChild(Content) content: Content;

  tags: any[] = [];
  descending = false;
  order: number;
  column = 'name';
  count = 0;
  allData: OccurrenceResult[];
  tagsCopy: any[] = [];
  searchText: string;
  texts: any[] = [];
  cacheData: OccurrenceResult[];
  tagsKey = 'tag-search';
  cacheItem = false;
  showLoading = false;
  showFilter = true;
  from = 0;
  infiniteScrollNumber = 30;
  filters: any[] = [];
  mdContent: string;

  selectedLinkID: string;

  objectType = 'tag';

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

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
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private cf: ChangeDetectorRef,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService
  ) {
    try {
      this.showFilter = this.config.getSettings('TagSearch.ShowFilter');
    } catch (e) {
      this.showFilter = true;
    }
    try {
      this.infiniteScrollNumber = this.config.getSettings('TagSearch.InitialLoadNumber');
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
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'tag-search'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'tagSearch',
      component: 'tag-search'
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Tags');
  }

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.selectMusicAccordionItem();
      this.setData();
      if (lang) {
        this.getMdContent(lang + '-12-04');
      } else {
        this.langService.getLanguage().subscribe(language => {
          this.getMdContent(language + '-12-04');
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
    this.storage.get(this.tagsKey).then((tags) => {
      if (tags) {
        this.cacheItem = true;
        this.getCacheText(this.tagsKey);
      } else {
        this.gettags();
      }
    });
  }

  gettags() {
    this.showLoading = true;
    this.semanticDataService.getTagElastic(this.from, this.searchText, this.filters).subscribe(
      tags => {
        const tagsTmp = [];
        tags = tags.hits.hits;
        tags.forEach(element => {
          element = element['_source'];
          element.name = String(element.name)
          element['sortBy'] = String(element.name).trim().replace('ʽ', '').toUpperCase();
          if ( element.name ) {
            let found = false;
            this.tags.forEach(tag => {
              if ( tag.id === element['id'] ) {
                found = true;
              }
            });
            if ( !found ) {
              tagsTmp.push(element);
              this.tags.push(element);
            }
          }
          const ltr = element['sortBy'].charAt(0);
          const mt = ltr.match(/[a-zåäö]/i);
          if (ltr.length === 1 && ltr.match(/[a-zåäö]/i) !== null) {
            // console.log(ltr);
          } else {
            const combining = /[\u0300-\u036F]/g;
            element['sortBy'] = element['sortBy'].normalize('NFKD').replace(combining, '').replace(',', '');
          }
        });

        this.allData = this.tags;
        this.cacheData = this.tags;
        this.showLoading = false;
        this.sortListAlphabeticallyAndGroup(this.allData);
      },
      err => {console.error(err); this.showLoading = false; },
      () => console.log(this.tags)
    );
  }

  onChanged(obj) {
    this.cf.detectChanges();
    console.log('segment changed')
    this.filter(obj);
  }

  loadMoretags() {
    for (let i = 0; i < 30; i++) {
      if (i === this.allData.length) {
        break;
      } else {
        this.tags.push(this.allData[this.count]);
        this.tagsCopy.push(this.allData[this.count]);
        this.count++
      }
    }
  }

  showAll() {
    /*
    this.tags = [];
    this.allData = [];
    this.count = 0;
    this.allData = this.cacheData;
    this.loadMoretags();
    */
    this.count = 0;
    this.from = 0;
    this.searchText = '';
    this.filters = [];
    this.tags = [];
    this.gettags();
    this.content.scrollToTop(400);
  }

  sortByLetter(letter) {
    this.searchText = letter;
    this.tags = [];
    this.cf.detectChanges();
    this.gettags();
    this.content.scrollToTop(400);
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

    this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: 'tagSearch'});
  }

  filter(terms) {
    if ( terms._value ) {
      terms = terms._value;
    }
    if (!terms) {
      this.tags = this.tagsCopy;
    } else if (terms != null) {
      this.from = 0;
      this.gettags();
      this.tags = [];
      terms = String(terms).toLowerCase().replace(' ', '');
      for (const tag of this.allData) {
        if (tag.name) {
          const title = tag.name.toLocaleLowerCase();
          if (title.includes(terms)) {
            const inList = this.tags.some(function(p) {
              return p.name === tag.name
            });
            if (!inList) {
              this.tags.push(tag);
            }
          }
        }
      }
    } else {
      this.tags = this.tagsCopy;
    }
  }

  doInfinite(infiniteScroll) {
    this.from += this.infiniteScrollNumber;
    this.gettags();
    infiniteScroll.complete();
  }

  async openTag(occurrenceResult: OccurrenceResult) {
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
      await this.storeCacheText(this.tagsKey, this.cacheData);
    } else if (!this.cacheItem) {
      this.removeFromCache(this.tagsKey);
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
    this.storage.get(id).then((tags) => {
      this.allData = tags;

      this.sortListAlphabeticallyAndGroup(this.allData);

      for (let i = 0; i < 30; i++) {
        this.tags.push(this.allData[this.count]);
        this.tagsCopy.push(this.allData[this.count]);
        this.count++
      }
    });
  }

  async addedToCacheToast(id: string) {
    let status = '';

    await this.storage.get(id).then((content) => {
      if (content) {
        status = 'tags downloaded successfully';
      } else {
        status = 'tags were not added to cache';
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
        status = 'tags were not removed from cache';
      } else {
        status = 'tags were successfully removed from cache';
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

    if (text.textType === 'ms') {
      text_type = 'manuscripts';
    } else if (text.textType === 'var') {
      text_type = 'variations';
    } else if (text.textType === 'facs') {
      text_type = 'facsimiles'
    } else {
      text_type = 'comments';
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
      this.app.getRootNav().push('read', params);
    } else {
      this.app.getRootNav().push('read', params);
    }
  }

  openFilterModal() {
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'tag-search', activeFilters: this.filters });
    filterModal.onDidDismiss(filters => {

      if (filters) {
        this.tags = [];
        this.allData = [];
        this.filters = filters;
        if (filters['isEmpty']) {
          console.log('filters are empty')
          this.tags = [];
          this.allData = [];
          this.count = 0;
          this.gettags();
        }

        if (filters.filterCategoryTypes) {
          this.gettags();
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

    for (const tag of this.tags) {
      for (const occurrence of tag.occurrences) {
        const inFilterList = filterCollectionIds.some(function(filter) {
          return filter === occurrence.collection_id;
        });
        if (!inFilterList) {
          this.tags.splice(this.tags.indexOf(tag), 1);
          this.tagsCopy.splice(this.tags.indexOf(tag), 1);
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
