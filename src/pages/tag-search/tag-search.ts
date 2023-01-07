import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Platform,
  ModalController, Events, ViewController } from 'ionic-angular';
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
 * A page for searching tag occurrences.
 * Can be filtered by tag type.
 */

@IonicPage({
  name: 'tag-search',
  segment: 'tags'
})
@Component({
  selector: 'page-tag-search',
  templateUrl: 'tag-search.html'
})
export class TagSearchPage {
  tags: any[] = [];
  tagsCopy: any[] = [];
  searchText: string;
  texts: any[] = [];
  showLoading = false;
  showFilter = true;
  agg_after_key: Record<string, any> = {};
  last_fetch_size = 0;
  max_fetch_size = 500;
  filters: any[] = [];
  immediate_search = false;
  mdContent: string;
  objectType = 'tag';

  // tslint:disable-next-line:max-line-length
  alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'];

  languageSubscription: Subscription;
  debouncedSearch = debounce(this.searchTags, 500);

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
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private userSettingsService: UserSettingsService,
              private events: Events,
              private analyticsService: AnalyticsService,
              private metadataService: MetadataService,
              public commonFunctions: CommonFunctionsService
  ) {
    try {
      this.showFilter = this.config.getSettings('TagSearch.ShowFilter');
    } catch (e) {
      this.showFilter = true;
    }
    try {
      this.max_fetch_size = this.config.getSettings('TagSearch.InitialLoadNumber');
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
    this.selectMusicAccordionItem();
    this.getTags();
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.getMdContent(lang + '-12-04');
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

  getTags() {
    this.showLoading = true;
    this.semanticDataService.getTagElastic(this.agg_after_key, this.searchText, this.filters, this.max_fetch_size).subscribe(
      tags => {
        // console.log('Elastic response: ', tags);
        if (tags.error !== undefined) {
          console.error('Elastic search error getting tags: ', tags);
        }
        if (tags.aggregations && tags.aggregations.unique_tags && tags.aggregations.unique_tags.buckets.length > 0) {
          this.agg_after_key = tags.aggregations.unique_tags.after_key;
          this.last_fetch_size = tags.aggregations.unique_tags.buckets.length;

          console.log('Number of fetched tags: ', this.last_fetch_size);

          const combining = /[\u0300-\u036F]/g;

          tags = tags.aggregations.unique_tags.buckets;
          tags.forEach(element => {
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

            this.tags.push(element);
          });
        } else {
          this.agg_after_key = {};
          this.last_fetch_size = 0;
        }

        this.sortListAlphabeticallyAndGroup(this.tags);
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
    this.searchTags();
  }

  filterByLetter(letter) {
    this.searchText = letter;
    this.searchTags();
    this.scrollToTop();
  }

  onSearchInput() {
    if (this.immediate_search) {
      this.immediate_search = false;
      this.searchTags();
    } else {
      this.debouncedSearch();
    }
  }

  onSearchClear() {
    this.immediate_search = true;
  }

  searchTags() {
    this.agg_after_key = {};
    this.tags = [];
    if (this.showLoading) {
      this.debouncedSearch();
    } else {
      this.getTags();
    }
  }

  loadMore(e) {
    this.getTags();
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

    this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: 'tagSearch'});
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
    const filterModal = this.modalCtrl.create(FilterPage, { searchType: 'tag-search', activeFilters: this.filters });
    filterModal.onDidDismiss(filters => {
      if (filters) {
        this.tags = [];
        this.agg_after_key = {};
        this.filters = filters;
        this.getTags();
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

  scrollToTop() {
    const topElem = document.querySelector('.search-area-row') as HTMLElement;
    if (topElem) {
      this.commonFunctions.scrollElementIntoView(topElem, 'top', 0);
    }
  }

}
