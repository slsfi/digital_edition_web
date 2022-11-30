import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
// tslint:disable-next-line:max-line-length
import { IonicPage, NavController, NavParams, ModalController, App, Platform,
  LoadingController, ToastController, Content, Events, ViewController } from 'ionic-angular';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import size from 'lodash/size';

import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';
import { TextService } from '../../app/services/texts/text.service';
import { SingleOccurrence } from '../../app/models/single-occurrence.model';
import { Storage } from '@ionic/storage';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ElasticSearchService } from '../../app/services/elastic-search/elastic-search.service';
import { noUndefined } from '@angular/compiler/src/util';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import { MdContentService } from '../../app/services/md/md-content.service';
import { Subscription } from 'rxjs/Subscription';

/*

Specs:

- To the left (probably): all the filters, so the user can decide what filters to use before
actually performing the search, in order to avoid getting results not relevant.

- Since the filters are always visible, they could simply be updated with the number of results
in the different categories after the search is finished?

- Results are shown in different tabs according to the following categories:
  texts by the author ZT (reading texts, variants, manuscripts);
  texts by editors (introductions, comments, title pages, other info material on the site);
  results from the indexes (persons, places, literary works (results both from the name fields and the description fields)).

- Filters include:
  genre -> edition;
  text type (reading text, variant, manuscript, comment, introduction, index);
  time period -> decade -> year -> month -> date;
  sender - receiver (for letters)


Use cases:

The user might want to look at the word 'snömos', but only in prose and reading texts (to find out how it was used by the author in the
19th century). From the results she sees it occurs throughout the decades 1840-1880, so she can take a look directly at the one from 1881.
The user can then decide to look at only comments containing (i.e. explaining) this word; there are 5 of them (and they are all different).

Another user searches for the name Ulla as free text, only in prose, and gets 2 results (one person).
Ulla as an index search in prose returns 3 different persons, occurring in total 8 times, because they are mentioned
in other ways than by their first name in the texts, but connected to index posts containing this first name.

In general, the user of the advanced search might want to use some filters from the start, or at least later choose between the
results according to their different categorization, so it’s important to always keep an overview of what categories the results belong to.

*/

interface SearchOptions {
  done?: Function;
  initialSearch?: boolean;
}

/**
 * Elastic search page.
 */
@IonicPage({
  name: 'elastic-search',
  segment: 'elastic-search/:query',
  defaultHistory: ['HomePage']
})
@Component({
  selector: 'page-elastic-search',
  templateUrl: 'elastic-search.html'
})
export class ElasticSearchPage {

  @ViewChild(Content) content: Content;
  @ViewChild('myInput') myInput;

  // Helper to loop objects
  objectKeys = Object.keys;
  objectValues = Object.values;

  loading = false;
  infiniteLoading = false;
  elasticError = false;
  showFilter = true;
  queries: string[] = [''];
  cleanQueries: string[] = [''];
  hits: object[] = [];
  termData: object[] = [];
  hitsPerPage = 20;
  aggregations: object = {};
  facetGroups: FacetGroups = {};
  selectedFacetGroups: FacetGroups = {};
  suggestedFacetGroups: FacetGroups = {};

  showAllFacets = false;
  showAllFor = {};

  showSortOptions = true;
  showYearFacet = true;

  // -1 when there a search hasn't returned anything yet.
  total = -1;
  from = 0;
  sort = '';

  range: TimeRange;
  groupsOpenByDefault: any;
  debouncedSearch = debounce(this.search, 1500);
  sortSelectOptions: Record<string, any> = {};
  mdContent: string;
  languageSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public semanticDataService: SemanticDataService,
    protected config: ConfigService,
    public modalCtrl: ModalController,
    private app: App,
    private platform: Platform,
    protected textService: TextService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private mdContentService: MdContentService,
    public loadingCtrl: LoadingController,
    public elastic: ElasticSearchService,
    protected storage: Storage,
    private toastCtrl: ToastController,
    private userSettingsService: UserSettingsService,
    private events: Events,
    private cf: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) {
    console.log('constructing elastic search');

    try {
      this.hitsPerPage = this.config.getSettings('ElasticSearch.hitsPerPage');
    } catch (e) {
      console.error('Failed to load Elastic Search Page. Configuration error.', e);
    }
    try {
      this.groupsOpenByDefault = this.config.getSettings('ElasticSearch.groupOpenByDefault');
    } catch (e) {
      console.error('Failed to load set facet groups open by default. Configuration error.', e);
    }
    try {
      this.showSortOptions = this.config.getSettings('ElasticSearch.show.sortOptions');
    } catch (e) {
      this.showSortOptions = false;
    }
    try {
      this.showYearFacet = this.config.getSettings('ElasticSearch.show.yearFacet');
    } catch (e) {
      this.showYearFacet = false;
    }

    this.languageSubscription = null;
  }

  private getParamsData() {
    try {
      const query = this.navParams.get('query');
      if (query !== ':query') {
        this.queries[0] = query;
      }
    } catch (e) {
      console.log('Problems parsing query parameters...');
    }
  }

  ionViewDidLoad() {
    this.search({initialSearch: true});
    // Open type by default
    setTimeout(() => {
      const facetGroups = Object.keys(this.facetGroups);
      facetGroups.forEach(facetGroup => {
        const openGroup = facetGroup.toLowerCase();
        switch (openGroup) {
          case 'type':
            if (this.groupsOpenByDefault.type) {
              const facetListType = <HTMLElement>document.querySelector('.facetList-' + facetGroup);
              try {
                facetListType.style.height = '100%';
                const facetArrowType = <HTMLElement>document.querySelector('#arrow-1');
                facetArrowType.classList.add('open', 'rotate');
              } catch ( e ) {

              }
            }
            break;
          case 'genre':
            if (this.groupsOpenByDefault.genre) {
              const facetListGenre = <HTMLElement>document.querySelector('.facetList-' + facetGroup);
              try {
                facetListGenre.style.height = '100%';
                const facetArrowGenre = <HTMLElement>document.querySelector('#arrow-2');
                facetArrowGenre.classList.add('open', 'rotate');
              } catch ( e ) {

              }
            }
            break;
          case 'collection':
            if (this.groupsOpenByDefault.collection) {
              const facetListCollection = <HTMLElement>document.querySelector('.facetList-' + facetGroup);
              try {
                facetListCollection.style.height = '100%';
                const facetArrowCollection = <HTMLElement>document.querySelector('#arrow-3');
                facetArrowCollection.classList.add('open', 'rotate');
              } catch ( e ) {

              }
            }
            break;
          default:
            const facetListRest = <HTMLElement>document.querySelector('.facetList-' + facetGroup);
            try {
              facetListRest.style.setProperty('height', '0px');
              const facetArrowRest = <HTMLElement>document.querySelector('#arrow-' + facetGroup);
              facetArrowRest.classList.add('closed', 'rotate');
            } catch (e) {
            }
            break;
        }
      })
    }, 300);

    this.languageSubscription = this.languageService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.getMdContent(lang + '-12-01');
      } else {
        this.languageService.getLanguage().subscribe(language => {
          this.getMdContent(language + '-12-01');
        });
      }
      this.translate.get('ElasticSearch.SortBy').subscribe(
        translation => {
          this.sortSelectOptions = {
            title: translation,
            cssClass: 'custom-select-alert'
          };
        }, error => { }
      );
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Elastic Search');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
    console.log('will enter elastic search');
    this.events.publish('ionViewWillEnter', this.constructor.name)
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'elastic-search'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'elasticSearch',
      component: 'elastic-search'
    });
    this.getParamsData();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  open(hit) {
    this.events.publish('searchHitOpened', hit);
    const params = { tocItem: null, fetch: true, collection: { title: hit.source.TitleIndexed } };
    const path = hit.source.path;
    const filename = path.split('/').pop();

    // 199_18434_var_6251.xml This should preferrably be implemented via elastic data instead of path
    const collection_id = filename.split('_').shift(); // 199
    const var_ms_id = filename.replace('.xml', '').split('_').pop(); // 6251

    params['tocLinkId'] = collection_id + '_' + hit.source.publication_id;
    params['collectionID'] = collection_id;
    params['publicationID'] = hit.source.publication_id;
    params['chapterID'] = 'nochapter';

    params['facs_id'] = 'not';
    params['facs_nr'] = 'infinite';
    params['song_id'] = 'nosong';
    params['search_title'] = this.queries[0];
    params['matches'] = this.queries;
    params['views'] = [];
    // : facs_id / : facs_nr / : song_id / : search_title / : urlviews
    // not / infinite / nosong / searchtitle / established & variations & facsimiles


    switch (hit.source.xml_type) {
      case 'est': {
        params['urlviews'] = 'established';
        params['views'].push({type: 'established'});
        break;
      }
      case 'ms': {
        params['urlviews'] = 'manuscripts';
        params['views'].push({type: 'manuscripts', id: var_ms_id});
        break;
      }
      case 'com': {
        params['urlviews'] = 'comments';
        params['views'].push({type: 'comments'});
        break;
      }
      case 'var': {
        params['urlviews'] = 'variations';
        params['views'].push({type: 'variations', id: var_ms_id});
        break;
      }
      case 'inl': {
        params['urlviews'] = 'introduction';
        params['views'].push({type: 'introduction', id: var_ms_id});
        break;
      }
      case 'tit': {
        params['urlviews'] = 'title';
        params['views'].push({type: 'title', id: var_ms_id});
        break;
      }
      default: {
        params['urlviews'] = 'established';
        params['views'].push({type: 'established'});
         // statements;
        break;
      }
    }
    if (hit.source.xml_type === 'tit') {
      this.app.getRootNav().push('title-page', params);
    } else if (hit.source.xml_type === 'fore') {
      this.app.getRootNav().push('foreword-page', params);
    } else if (hit.source.xml_type === 'inl') {
      this.app.getRootNav().push('introduction', params);
    } else {
      params['selectedItemInAccordion'] = false;
      this.app.getRootNav().push('read', params);
    }
  }

  /**
   * https://stackoverflow.com/questions/46991497/how-properly-bind-an-array-with-ngmodel-in-angular-4
   */
  trackByIdx(index: number): number {
    return index;
  }

  /**
   * Triggers a new search and clears selected facets.
   */
  onQueryChange() {
    // this.autoExpandSearchfields();
    this.reset();
    this.loading = true;
    this.debouncedSearch();
    this.cf.detectChanges();
  }

  /**
   * Triggers a new search with selected facets.
   */
  onFacetsChanged() {
    this.cf.detectChanges();
    this.reset();
    this.search();
  }

  /**
   * Triggers a new search with selected years.
   */
  onRangeChange(from: number, to: number) {
    if (from && to) {
      // Certain date range
      this.range = {from, to};
      console.log('year range: ', this.range);

      this.cf.detectChanges();
      this.reset();
      this.search();

    } else if (!from && !to) {
      // All time
      this.range = null;
      this.cf.detectChanges();
      this.reset();
      this.search();

    } else {
      // Only one year selected, so do nothing
      this.range = null
    }
  }

  /**
   * Sorting changed so trigger new query.
   */
  onSortByChanged() {
    this.reset();
    this.search();
  }

  /**
   * Resets search results.
   */
  reset() {
    this.hits = [];
    this.from = 0;
    this.total = -1;
    this.suggestedFacetGroups = {};
  }

  /**
   * Immediately execute a search.
   * Use debouncedSearch to wait for additional key presses when use types.
   */
  private search({ done, initialSearch }: SearchOptions = {}) {
    console.log(`search from ${this.from} to ${this.from + this.hitsPerPage}`);

    this.elasticError = false;
    this.loading = true;

    // Fetch hits
    this.elastic.executeSearchQuery({
      queries: this.queries,
      highlight: {
        fields: {
          'textDataIndexed': { number_of_fragments: 1000, fragment_size: 150, type: 'unified', boundary_scanner: 'sentence' },
          'publication_data.pubname': { number_of_fragments: 0, type: 'plain' },
        },
      },
      from: this.from,
      size: initialSearch ? 0 : this.hitsPerPage,
      facetGroups: this.facetGroups,
      range: this.range,
      sort: this.parseSortForQuery(),
    })
    .subscribe((data: any) => {
      if (data.hits === undefined) {
        console.error('Elastic search error, no hits: ', data);
        this.loading = false;
        this.total = 0;
        this.elasticError = true;
      } else {
        this.loading = false;
        this.total = data.hits.total.value;
        console.log('hits: ', data.hits);

        // Append new hits to this.hits array.
        Array.prototype.push.apply(this.hits, data.hits.hits.map((hit: any) => ({
          type: hit._source.xml_type,
          source: hit._source,
          highlight: hit.highlight,
          id: hit._id
        })));

        /*
        this.cleanQueries = [];
        if (this.queries.length > 0 && this.queries[0] !== undefined && this.queries[0].length > 0 ) {
          this.queries.forEach(term => {
            this.cleanQueries.push(term.toLowerCase().replace(/[^a-zA-ZåäöÅÄÖ[0-9]+/g, ''));
            this.analyticsEvent('term', term);
          });
          for (const item in data.hits.hits) {
            this.elastic.executeTermQuery(this.cleanQueries, [data.hits.hits[item]['_id']])
            .subscribe((termData: any) => {
              this.termData = termData;
              const elementsIndex = this.hits.findIndex(element => element['id'] === data.hits.hits[item]['_id'] );
              this.hits[elementsIndex] = {...this.hits[elementsIndex], count: termData};
            })
          }
        }
        */
      }

      if (done) {
        done();
      }
    });

    // Fetch aggregation data for facets.
    this.elastic.executeAggregationQuery({
      queries: this.queries,
      facetGroups: this.facetGroups,
      range: this.range,
    })
    .subscribe((data: any) => {
      console.log('aggregation data', data);

      this.populateFacets(data.aggregations);
    });

    // Fetch suggestions
    /*
    // TODO: Currently only works with the first search field.
    if (this.queries[0] && this.queries[0].length > 3) {
      this.elastic.executeSuggestionsQuery({
        query: this.queries[0],
      })
      .subscribe((data: any) => {
        console.log('suggestions data', data);
        this.populateSuggestions(data.aggregations);
      });
    }
    */
  }

  private parseSortForQuery() {
    if (!this.sort) {
      return;
    }

    const [key, direction] = this.sort.split('.');
    return [{ [key]: direction }];
  }

  hasMore() {
    return this.total > this.from + this.hitsPerPage;
  }

  analyticsEvent(type, term) {
    this.analyticsService.doAnalyticsEvent('Search', 'ElasticSearch - ' + type, String(term));
  }

  /**
   * TODO: Make infinite scroll should work with the super long facets column.
   * Current workaround for this is to increate hitsPerPage to 20.
   * ! Infinite-scroll commented out, using button for loading more matches for now.
   */
  loadMore(e) {
    this.infiniteLoading = true;
    this.from += this.hitsPerPage;

    // Search and let ion-infinite-scroll know that it can re-enable itself.
    this.search({
      done: () => {
        this.infiniteLoading = false;
        // e.complete() // uncomment this line if using infine-scroll to load more search matches
      },
    });
  }

  canShowHits() {
    return (!this.loading || this.infiniteLoading) && (this.queries[0] || this.range || this.hasSelectedFacets());
  }

  hasSelectedFacets() {
    return Object.values(this.facetGroups).some(facets => Object.values(facets).some(facet => facet.selected));
  }

  hasSelectedFacetsByGroup(groupKey: string) {
    return size(this.selectedFacetGroups[groupKey]) > 0;
  }

  hasSelectedNormalFacets() {
    return Object.keys(this.facetGroups).some(facetGroupKey =>
      facetGroupKey !== 'Type' && facetGroupKey !== 'Years' && Object.values(this.facetGroups[facetGroupKey]).some(facet => facet.selected)
    );
  }

  hasFacets(facetGroupKey: string) {
    return size(this.facetGroups[facetGroupKey]) > 0;
  }

  hasSuggestedFacetsByGroup(groupKey: string) {
    return size(this.suggestedFacetGroups[groupKey]) > 0;
  }

  hasSuggestedFacets() {
    return Object.values(this.suggestedFacetGroups).some(facets => size(facets) > 0);
  }

  getFacets(facetGroupKey: string): Facet[] {
    const facets = this.facetGroups[facetGroupKey];
    return facets ? Object.values(facets) : [];
  }

  /**
   * Toggles facet on/off. Note that the selected state is controlled by the ion-checkbox
   * so it should not be modified here.
   */
  updateFacet(facetGroupKey: string, facet: Facet) {
    const facets = this.facetGroups[facetGroupKey] || {};
    facets[facet.key] = facet;
    this.facetGroups[facetGroupKey] = facets;

    this.updateSelectedFacets(facetGroupKey, facet);

    this.onFacetsChanged();
    this.analyticsEvent('facet', String(facet.key));
  }

  selectSuggestedFacet(facetGroupKey: string, facet: Facet) {
    this.suggestedFacetGroups = {};
    this.queries = [''];

    facet.selected = true;
    this.updateFacet(facetGroupKey, facet);
  }

  unselectFacet(facetGroupKey: string, facet: Facet) {
    facet.selected = false;
    this.updateFacet(facetGroupKey, facet);
  }

  private updateSelectedFacets(facetGroupKey: string, facet: Facet) {
    const facetGroup = this.selectedFacetGroups[facetGroupKey] || {};

    // Set or delete facet from selected facets
    if (facet.selected) {
      facetGroup[facet.key] = facet;
    } else {
      delete facetGroup[facet.key];
    }

    // Set or delete facet group from selected facet groups
    if (size(facetGroup) === 0) {
      delete this.selectedFacetGroups[facetGroupKey];
    } else {
      this.selectedFacetGroups[facetGroupKey] = facetGroup;
    }
  }

  /**
   * Populate facets data using the search results aggregation data.
   */
  private populateFacets(aggregations: AggregationsData) {
    // Get aggregation keys that are ordered in config.json.
    this.elastic.getAggregationKeys().forEach(facetGroupKey => {
      const newFacets = this.convertAggregationsToFacets(aggregations[facetGroupKey]);
      if (this.facetGroups[facetGroupKey]) {
        Object.entries(this.facetGroups[facetGroupKey]).forEach(([facetKey, existingFacet]: [string, any]) => {
          const newFacet = newFacets[facetKey];
          if (newFacet) {
            existingFacet.doc_count = newFacet.doc_count;
          } else if (this.hasSelectedFacetsByGroup(facetGroupKey)) {
            // Unselected facets aren't updating because the terms bool.filter in the query
            // prevents unselected aggregations from appearing in the results.
            // TODO: Fix this by separating search and aggregation query.
          } else {
            delete this.facetGroups[facetGroupKey][facetKey];
           // existingFacet.doc_count = 0;
          }
        })
        Object.entries(newFacets).forEach(([facetKey, existingFacet]: [string, any]) => {
          if ( this.facetGroups[facetGroupKey][facetKey] === undefined ) {
            this.facetGroups[facetGroupKey][facetKey] = existingFacet;
          }
        });
      } else {
        this.facetGroups[facetGroupKey] = newFacets;
      }
    });
  }

  /**
   * Populate suggestions data using the search results aggregation data.
   */
  private populateSuggestions(aggregations: AggregationsData) {
    Object.entries(aggregations).forEach(([aggregationKey, value]: [string, any]) => {
      this.suggestedFacetGroups[aggregationKey] = this.convertAggregationsToFacets(value);
    });
  }

  /**
   * Convert aggregation data to facets data.
   */
  private convertAggregationsToFacets(aggregation: AggregationData): Facets {
    const facets = {};
    // Get buckets from either unfiltered or filtered aggregation.
    const buckets = aggregation.buckets || aggregation.filtered.buckets;

    buckets.forEach((facet: Facet) => {
      facets[facet.key] = facet;
    });
    return facets;
  }

  getPublicationName(source: any) {
    return get(source, 'publication_data[0].pubname');
  }

  getHiglightedPublicationName(highlight: any) {
    if (highlight['publication_data.pubname']) {
      return highlight['publication_data.pubname'][0];
    } else {
      return undefined;
    }
  }

  getPublicationCollectionName(source: any) {
    return get(source, 'publication_data[0].colname');
  }

  // Returns the title from the xml title element in the teiHeader
  getTitle(source: any) {
    return (source.TitleIndexed || source.name || '').trim();
  }

  getGenre(source: any) {
    return get(source, 'publication_data[0].genre');
  }

  private formatISO8601DateToLocale(date: string) {
    return date && new Date(date).toLocaleDateString('fi-FI');
  }

  hasDate(source: any) {
    const dateData = get(source, 'publication_data[0].original_publication_date', source.orig_date_certain);
    if (dateData === undefined || dateData === null || dateData === '') {
      if (source.orig_date_year !== undefined && source.orig_date_year !== null && source.orig_date_year !== '') {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  private getDate(source: any) {
    let date = get(source, 'publication_data[0].original_publication_date', this.formatISO8601DateToLocale(source.orig_date_certain));
    if ((date === undefined || date === '' || date === null)
    && source.orig_date_year !== undefined && source.orig_date_year !== null && source.orig_date_year !== '') {
      date = source.orig_date_year;
    }
    return date;
  }

  private filterEmpty(array: any[]) {
    return array.filter(str => str).join(', ');
  }

  getHitHref(source: any) {
    let path = '/#/';

    if (source.xml_type === 'tit') {
      path = path + 'publication-title/' + source.collection_id;
    } else if (source.xml_type === 'fore') {
      path = path + 'publication-foreword/' + source.collection_id;
    } else if (source.xml_type === 'inl') {
      path = path + 'publication-introduction/' + source.collection_id;
    } else {
      path = path + 'publication/' + source.collection_id;
      path = path + '/text/' + source.publication_id;
      path = path + '/nochapter/not/infinite/nosong/';
      path = path + 'searchtitle' + '/';
    }

    if (source.xml_type === 'est') {
      path = path + 'established';
    } else if (source.xml_type === 'com') {
      path = path + 'comments';
    } else if (source.xml_type === 'ms') {
      path = path + 'manuscripts';
    } else if (source.xml_type === 'var') {
      path = path + 'variations';
    } else {
      path = path + 'established';
    }

    return path;
  }

  getHeading(hit: any) {
    /* If a match is found in the publication name, return it from the highlights. Otherwise from the data. */
    let publication_name = undefined;
    if (hit.highlight) {
      publication_name = this.getHiglightedPublicationName(hit.highlight);
    }
    if (publication_name) {
      return publication_name;
    } else {
      publication_name = this.getPublicationName(hit.source);
      if (publication_name) {
        return publication_name;
      } else {
        return this.getTitle(hit.source);
      }
    }
  }

  getSubHeading(source) {
    return this.filterEmpty([
      this.getGenre(source),
      source.type !== 'brev' && this.getDate(source)
    ]);
  }

  getEllipsisString(str: string, max = 50) {
    if (!str || str.length <= max) {
      return str;
    } else {
      return str.substring(0, max) + '...';
    }
  }

  openAccordion(e, group) {
    const facet = document.getElementById('facetList-' + group);
    const arrow = document.getElementById('arrow-' + group);

    arrow.classList.toggle('rotate');

    if (arrow.classList.contains('open')) {
      facet.style.height = '0';
      arrow.classList.add('closed');
      arrow.classList.remove('open');
    } else {
      facet.style.height = '100%';
      arrow.classList.add('open');
      arrow.classList.remove('closed');
    }
    this.cf.detectChanges();
  }

  addSearchField() {
    this.queries.push('');
  }

  removeSearchField(i) {
    this.queries.splice(i, 1);
  }

  autoExpandSearchfields() {
    const inputs: NodeListOf<HTMLElement> = document.querySelectorAll('.searchInput');

    for (let i = 0; i < inputs.length; i++) {
      const borderTop = measure(inputs[i], 'border-top-width');
      const borderBottom = measure(inputs[i], 'border-bottom-width');

      inputs[i].style.height = '';
      inputs[i].style.height = borderTop + inputs[i].scrollHeight + borderBottom + 'px';
    }

    function measure(elem: Element, property) {
      return parseInt(
        window.getComputedStyle(elem, null)
          .getPropertyValue(property)
          .replace(/px$/, ''));
    }
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.mdContent = text.content; },
        error => { this.mdContent = ''; }
      );
  }

  showAllHitHighlights(event: any) {
    // Find and show all hidden highlights
    let parentElem = event.target.parentElement as HTMLElement;
    while (parentElem !== null && !parentElem.classList.contains('matchHighlights')) {
      parentElem = parentElem.parentElement;
    }

    if (parentElem !== null) {
      const highlightElems = parentElem.querySelectorAll('.hiddenHighlight');
      for (let i = 0; i < highlightElems.length; i++) {
        highlightElems[i].classList.remove('hiddenHighlight');
      }
    }

    // Find and hide the button that triggered the event
    parentElem = event.target.parentElement as HTMLElement;
    while (parentElem !== null && !parentElem.classList.contains('showAllHitHighlights')) {
      parentElem = parentElem.parentElement;
    }

    if (parentElem !== null) {
      parentElem.classList.add('hiddenButton');
    }
  }
}
