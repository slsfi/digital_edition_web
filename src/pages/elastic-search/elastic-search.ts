import { Component, ViewChild, ChangeDetectorRef } from '@angular/core'
// tslint:disable-next-line:max-line-length
import { IonicPage, NavController, NavParams, ModalController, App, Platform,
  LoadingController, ToastController, Content, Events, ViewController } from 'ionic-angular'
import get from 'lodash/get'
import debounce from 'lodash/debounce'

import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service'
import { LanguageService } from '../../app/services/languages/language.service'
import { ConfigService } from '@ngx-config/core'
import { TextService } from '../../app/services/texts/text.service'
import { SingleOccurrence } from '../../app/models/single-occurrence.model'
import { Storage } from '@ionic/storage'
import { UserSettingsService } from '../../app/services/settings/user-settings.service'
import { ElasticSearchService } from '../../app/services/elastic-search/elastic-search.service'


/**
 * Simple elastic search page.
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

  // Helper to loop objects
  objectKeys = Object.keys
  objectValues = Object.values

  loading = false
  showFilter = true
  query: string
  hits: object[] = []
  hitsPerPage = 10
  aggregations: object = {}

  facetGroups: FacetGroups = {}

  // -1 when there a search hasn't returned anything yet.
  total = -1
  from = 0

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
    this.search()
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
    this.cf.detectChanges()
    this.reset()
    this.facetGroups = {}
    this.debouncedSearch()
  }

  /**
   * Triggers a new search with selected facets.
   */
  onFacetsChanged() {
    this.cf.detectChanges()
    this.reset()
    this.debouncedSearch()
  }

  selectedType(type: string) {
    this.type = type
    console.log(type)
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

  hasMore() {
    return this.total > this.from + this.hitsPerPage
  }

  /**
   * TODO: Make infinite scroll should work with the super long facets column.
   */
  loadMore(e) {
    this.from += this.hitsPerPage

    // Search and let ion-infinite-scroll know that it can re-enable itself.
    this.search(() => e.complete())
  }

  search(done?: Function) {
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
      size: this.hitsPerPage,
      facetGroups: this.facetGroups,
    })
      .subscribe((data: any) => {
        console.log('search data', data)
        this.loading = false
        this.total = this.query || this.hasSelectedFacets() ? data.hits.total.value : 0

        // Append new hits to this.hits array.
        Array.prototype.push.apply(this.hits, data.hits.hits.map((hit: any) => ({
          type: Array.isArray(hit._source.xml_type) ? hit._source.xml_type[0] : hit._source.xml_type,
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

  hasSelectedFacets() {
    return Object.values(this.facetGroups).some(facets => Object.values(facets).some(facet => facet.selected))
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
    Object.keys(aggregations).forEach(facetKey => {
      const latestFacets = this.convertBucketsToFacets(aggregations[facetKey].buckets)
      if (this.facetGroups[facetKey]) {
        Object.entries(this.facetGroups[facetKey]).forEach(([key, facet]: [string, any]) => {
          const latestFacet = latestFacets[key]

          // TODO: Don't set count to 0 for type.
          facet.doc_count = latestFacet ? latestFacet.doc_count : 0
        })
      } else {
        this.facetGroups[facetKey] = latestFacets
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

  getPublicationName(source: any) {
    return get(source, 'publication_data[0].pubname')
  }

  getTitle(source: any) {
    return (source.TitleIndexed || source.name || '').trim()
  }

  getGenre(source: any) {
    return get(source, 'publication_data[0].genre', source.collection_name)
  }

  getDate(source: any) {
    return get(source, 'publication_data[0].original_publication_date')
  }

  getHeading(source) {
    return [this.getTitle(source), this.getPublicationName(source)].filter(str => str).join(', ')
  }

  getSubHeading(source) {
    return [this.getGenre(source), this.getDate(source)].filter(str => str).join(', ')
  }

}
