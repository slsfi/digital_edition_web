import { Component, ViewChild, ChangeDetectorRef } from '@angular/core'
// tslint:disable-next-line:max-line-length
import { IonicPage, NavController, NavParams, ModalController, App, Platform,
  LoadingController, ToastController, Content, Events, ViewController } from 'ionic-angular'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import size from 'lodash/size'

import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service'
import { LanguageService } from '../../app/services/languages/language.service'
import { ConfigService } from '@ngx-config/core'
import { TextService } from '../../app/services/texts/text.service'
import { SingleOccurrence } from '../../app/models/single-occurrence.model'
import { Storage } from '@ionic/storage'
import { UserSettingsService } from '../../app/services/settings/user-settings.service'
import { ElasticSearchService } from '../../app/services/elastic-search/elastic-search.service'

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
  done?: Function
  initialSearch?: boolean
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

  @ViewChild(Content) content: Content
  @ViewChild('myInput') myInput;

  // Helper to loop objects
  objectKeys = Object.keys
  objectValues = Object.values

  loading = false
  infiniteLoading = false
  showFilter = true
  query: string
  hits: object[] = []
  hitsPerPage = 20
  aggregations: object = {}
  facetGroups: FacetGroups = {}
  showAllFacets = false;
  showFacetGroup = [
    {'Type': false},
    {'Location': false},
    {'Collection': false},
    {'Genre': false},
    {'Person': false},
    {'LetterSenderName': false}
  ];
  showAllFor = {};
  facetGroupType = '';

  // -1 when there a search hasn't returned anything yet.
  total = -1
  from = 0
  sort = ''

  range: TimeRange

  type: string = null
  types: string[] = []

  debouncedSearch = debounce(this.search, 500)

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public semanticDataService: SemanticDataService,
    protected langService: LanguageService,
    protected config: ConfigService,
    public modalCtrl: ModalController,
    private app: App,
    private platform: Platform,
    protected textService: TextService,
    public loadingCtrl: LoadingController,
    public elastic: ElasticSearchService,
    protected storage: Storage,
    private toastCtrl: ToastController,
    private userSettingsService: UserSettingsService,
    private events: Events,
    private cf: ChangeDetectorRef
  ) {
    try {
      this.types = this.config.getSettings('ElasticSearch.types')
      this.hitsPerPage = this.config.getSettings('ElasticSearch.hitsPerPage')
    } catch (e) {
      console.error('Failed to load Elastic Search Page. Configuration error.', e)
    }
  }

  private getParamsData() {
    const query = this.navParams.get('query')
    if (query !== ':query') {
      this.query = query
    }
  }

  ionViewDidLoad() {
    this.search({initialSearch: true})

    // Open type by default
    setTimeout(() => {
      const facetListElement = <HTMLElement>document.querySelector('.facetList-Type');
      facetListElement.style.height = '100%';
      const facetArrowElement = <HTMLElement>document.querySelector('#arrow-1');
      facetArrowElement.classList.add('open', 'rotate');
    }, 1000);
  }

  ionViewDidEnter() {
    (<any>window).ga('set', 'page', 'Elastic Search')
    (<any>window).ga('send', 'pageview')
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name)
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name)
    this.events.publish('tableOfContents:unSelectSelectedTocItem', true)
    this.getParamsData()
  }

  /**
   * Triggers a new search and clears selected facets.
   */
  onQueryChanged() {
    this.reset()
    this.facetGroups = {}
    this.range = null
    this.loading = true
    this.debouncedSearch()
    this.cf.detectChanges()
  }

  /**
   * Triggers a new search with selected facets.
   */
  onFacetsChanged() {
    this.cf.detectChanges()
    this.reset()
    this.search()
  }

  /**
   * Triggers a new search with selected years.
   */
  onRangeChange(from: number, to: number) {
    if (from && to) {
      // Certain date range
      this.range = {from, to}

      this.cf.detectChanges()
      this.reset()
      this.search()

    } else if (!from && !to) {
      // All time
      this.range = null
      this.cf.detectChanges()
      this.reset()
      this.search()

    } else {
      // Only one year selected, so do nothing
      this.range = null
    }
  }

  /**
   * Sorting changed so trigger new query.
   */
  onSortByChanged() {
    this.reset()
    this.search()
  }

  /**
   * Resets search results.
   */
  reset() {
    this.hits = []
    this.from = 0
    this.total = -1
  }

  /**
   * Immediately execute a search.
   * Use debouncedSearch to wait for additional key presses when use types.
   */
  private search({ done, initialSearch }: SearchOptions = {}) {
    console.log(`search from ${this.from} to ${this.from + this.hitsPerPage}`)

    this.loading = true
    this.elastic.executeQuery({
      query: this.query,
      type: this.type,
      highlight: {
        fields: {
          textDataIndexed: { number_of_fragments: 2 },
        },
      },
      from: this.from,
      size: initialSearch ? 0 : this.hitsPerPage,
      facetGroups: this.facetGroups,
      range: this.range,
      sort: this.parseSortForQuery(),
    })
      .subscribe((data: any) => {
        console.log('search data', data)
        this.loading = false
        this.total = data.hits.total.value

        // Append new hits to this.hits array.
        Array.prototype.push.apply(this.hits, data.hits.hits.map((hit: any) => ({
          type: hit._source.xml_type,
          source: hit._source,
          highlight: hit.highlight,
        })))
        console.log('search hits', this.hits)

        this.populateFacets(data.aggregations)

        if (done) {
          done()
        }
      })
  }

  private parseSortForQuery() {
    if (!this.sort) {
      return
    }

    const [key, direction] = this.sort.split('.')
    return [{ [key]: direction }]
  }

  hasMore() {
    return this.total > this.from + this.hitsPerPage
  }

  /**
   * TODO: Make infinite scroll should work with the super long facets column.
   * Current workaround for this is to increate hitsPerPage to 20.
   */
  loadMore(e) {
    this.infiniteLoading = true
    this.from += this.hitsPerPage

    // Search and let ion-infinite-scroll know that it can re-enable itself.
    this.search({
      done: () => {
        this.infiniteLoading = false
        e.complete()
      },
    })
  }

  canShowHits() {
    return (!this.loading || this.infiniteLoading) && (this.query || this.range || this.hasSelectedFacets())
  }

  hasSelectedFacets() {
    return Object.values(this.facetGroups).some(facets => Object.values(facets).some(facet => facet.selected))
  }

  hasSelectedFacetGroup(key: string) {
    return Object.keys(this.facetGroups).some(facetGroupKey =>
      facetGroupKey === key && Object.values(this.facetGroups[facetGroupKey]).some(facet => facet.selected)
    )
  }

  hasSelectedNormalFacets() {
    return Object.keys(this.facetGroups).some(facetGroupKey =>
      facetGroupKey !== 'Type' && facetGroupKey !== 'Years' && Object.values(this.facetGroups[facetGroupKey]).some(facet => facet.selected)
    )
  }

  toggleFacet(facetGroupKey: string, facet: Facet) {
    const facets = this.facetGroups[facetGroupKey] || {}
    facets[facet.key] = facet
    this.facetGroups[facetGroupKey] = facets
    this.onFacetsChanged()
  }

  /**
   * Populate facets data using the search results aggregation data.
   */
  private populateFacets(aggregations: Object) {
    // Get aggregation keys that are ordered in config.json.
    this.elastic.getAggregationKeys().forEach(facetGroupKey => {
      const latestFacets = this.convertBucketsToFacets(aggregations[facetGroupKey].buckets)
      if (this.facetGroups[facetGroupKey]) {
        Object.entries(this.facetGroups[facetGroupKey]).forEach(([facetKey, facet]: [string, any]) => {
          const latestFacet = latestFacets[facetKey]

          if (facetGroupKey === 'Type') {
            // Don't set count to 0 for Type facet group.
            if (latestFacet) {
              // TODO: Explain this
              facet.doc_count = latestFacet.doc_count
            } else {
              // TODO: Explain this
              facet.doc_count = (this.range || this.hasSelectedFacetGroup('Type')) && !this.hasSelectedNormalFacets() ? facet.doc_count : 0
            }
          } else {
            // TODO: Explain this
            facet.doc_count = latestFacet ? latestFacet.doc_count : (this.hasSelectedFacetGroup(facetGroupKey) ? facet.doc_count : 0)
          }
        })
      } else {
        this.facetGroups[facetGroupKey] = latestFacets
      }
    })
  }

  /**
   * Convert aggregation data to facets data.
   */
  private convertBucketsToFacets(buckets): Facets {
    const facets = {}
    buckets.forEach((facet: Facet) => facets[facet.key] = facet)
    return facets
  }

  hasFacets(facetGroupKey: string) {
    return size(this.facetGroups[facetGroupKey]) > 0
  }

  getFacets(facetGroupKey: string): Facet[] {
    const facets = this.facetGroups[facetGroupKey];
    return facets ? Object.values(facets) : []
  }

  getPublicationName(source: any) {
    return get(source, 'publication_data[0].pubname')
  }

  getTitle(source: any) {
    return (source.TitleIndexed || source.name || '').trim()
  }

  getGenre(source: any) {
    return get(source, 'publication_data[0].genre', source.collection_name)
  }

  private formatISO8601DateToLocale(date: string) {
    return date && new Date(date).toLocaleDateString('fi-FI')
  }

  private getDate(source: any) {
    return get(source, 'publication_data[0].original_publication_date', this.formatISO8601DateToLocale(source.orig_date_certain))
  }

  private filterEmpty(array: any[]) {
    return array.filter(str => str).join(', ')
  }

  getHeading(source: any) {
    switch (source.type) {
      case 'brev':
        return this.filterEmpty([this.getTitle(source), this.getPublicationName(source)])

      default:
        return this.filterEmpty([this.getTitle(source), this.getPublicationName(source)])
    }
  }

  getSubHeading(source) {
    return this.filterEmpty([
      this.getGenre(source),
      source.type !== 'brev' && this.getDate(source)
    ])
  }

  openAccordion(e, group) {
      const facet = document.getElementById('facetList-' + group);
      const arrow = document.getElementById('arrow-' + group);

      arrow.classList.toggle('rotate');

      if (facet.style.height === '100%') {
          facet.style.height = '0';
          arrow.classList.add('closed');
          arrow.classList.remove('open');
      } else {
        facet.style.height = '100%';
        arrow.classList.add('open');
        arrow.classList.remove('closed');
      }
  }
  revealFacets(facet) {
    console.log(this.showFacetGroup[0]);
  }

  resize() {
    const element = this.myInput['_elementRef'].nativeElement.getElementsByClassName('searchbar-input-container')[0]
    console.log(element);

    const scrollHeight = element.scrollHeight;
    element.style.height = scrollHeight + 'px';
    this.myInput['_elementRef'].nativeElement.style.height = (scrollHeight) + 'px';
}

autoExpand(selector, direction) {
  const tag = document.querySelectorAll(selector)

  for (let i = 0; i < tag.length; i++) {

    if (direction === 'height' || direction === 'both') {

      const borderTop = measure(tag[i], 'border-top-width')
      const borderBottom = measure(tag[i], 'border-bottom-width')
      const paddingTop = measure(tag[i], 'padding-top')
      const paddingBottom = measure(tag[i], 'padding-bottom')

      tag[i].style.height = ''
      tag[i].style.height = borderTop + paddingBottom
                           + tag[i].scrollHeight
                           + paddingTop + borderBottom + 'px'

    }

  }

    function measure(tag, property) {

      return parseInt(
              window.getComputedStyle(tag, null)
                .getPropertyValue(property)
                  .replace(/px$/, ''))

    }

    return '\n/* ' + selector + ' { ' + direction + ': auto-expand; } */\n'

  }
}
