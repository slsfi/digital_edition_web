import { Component, Input, ViewChild, HostListener, ElementRef } from '@angular/core';
import { App, Platform, Events, NavParams, Searchbar, ViewController } from 'ionic-angular';
import { SearchDataService } from '../../app/services/search/search-data.service';
import { TableOfContentsCategory, GeneralTocItem } from '../../app/models/table-of-contents.model';
import { ConfigService } from '@ngx-config/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { Facet } from '../../app/models/facet.model';
import { IfObservable } from 'rxjs/observable/IfObservable';
/**
 * Generated class for the SimpleSearchComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'simple-search',
  templateUrl: 'simple-search.html'
})
export class SimpleSearchComponent {
  @Input() root: TableOfContentsCategory[];
  @Input() scrollableSimpleSearch?: Boolean;
  @ViewChild(Searchbar) searchbar: Searchbar;

  myInput: any;
  isLoading = false;
  searchTypesMade = 0;
  searchTypesTotal = 3;
  searchSuggestions = [];
  text: string;
  searchResult: Array<any>;
  appliedFacets: Array<any>;
  displayResult: Array<any>;
  displayResults: Array<any>;
  resultsToShow: Array<any>;
  errorMessage: any;
  showPageNumbers: Boolean = true;
  userDefinedSearchFields: Array<string>;
  totalHits: Number = 0;
  apiEndPoint: string;
  projectMachineName: string;
  downloadOccurrencePdf = false;
  textTypes: any;
  checkedItems: boolean[];
  checkedDefault: boolean
  textTypeKeys: string[];
  searchFacets: Array<Facet>;
  searchString: string;
  fromResultToOccurrence: boolean;
  acIndex = 0;
  facsimileLookupData: Array<object>;
  showFacets: boolean;

  simpleSearchHeight = 0;
  simpleSearchHeightSizeInPx = {
    mobile: 200,
    desktop: 250
  }

  objectTypes = {
    all: ['location', 'tag', 'subject', 'recorder', 'playman', 'person'],
    subjects: ['subject', 'recorder', 'playman', 'person']
  }

  constructor(private app: App,
    public search: SearchDataService,
    private platform: Platform,
    private config: ConfigService,
    protected events: Events,
    public navParams: NavParams,
    private _eref: ElementRef,
    public userSettingsService: UserSettingsService,
    public viewctrl: ViewController) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    this.showPageNumbers = this.config.getSettings('simpleSearch.showPageNumbers');
    try {
      this.userDefinedSearchFields = this.config.getSettings('simpleSearch.user_defined_search_fields');
    } catch (e) {
      try {
        this.userDefinedSearchFields = this.config.getSettings('simpleSearch.userDefinedSearchField');
      } catch (e) {
        this.userDefinedSearchFields = ['textData'];
      }
    }

    try {
      this.fromResultToOccurrence = this.config.getSettings('simpleSearch.from_result_to_occurrence');
    } catch (e) {
      this.fromResultToOccurrence = false;
    }

    this.configOccurrencePdf();

    this.searchResult = [];
    this.displayResult = [];
    this.resultsToShow = [];
    this.searchFacets = [];
    this.facsimileLookupData = [];
    this.appliedFacets = [];
    this.searchString = null;
    this.checkedDefault = false;
    this.showFacets = false;

    this.getFacsimileLookupData();

    this.events.publish('view:enter', 'simple-search');
    if (navParams.get('searchResult') !== undefined) {
      this.searchString = navParams.get('searchResult');
      this.onInput(null, this.searchString);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      this.prevAutocomplete();
    }
    if (event.key === 'ArrowDown') {
      this.nextAutocomplete();
    }
    let found = false;
    if (event.key === 'Enter') {
      for (let i = 0; i < this.searchSuggestions.length; i++) {
        if ((i === 0 && this.searchString.toLowerCase() === String(this.searchSuggestions[i]).toLowerCase())
          || (i > 0 && i === this.acIndex)) {
          this.searchString = this.searchSuggestions[i];
          this.selectAutocomplete(this.searchSuggestions[i]);
          found = true;
          break;
        }
      }
      if (!found) {
        this.selectAutocomplete(this.searchString);
      }
    }
  }

  getFacsimileLookupData() {
    this.search.getFacsimileLookupData().subscribe(
      res => {
        this.facsimileLookupData = res;
      },
      error => { this.errorMessage = <any>error }
    );
  }

  getPublicationNameByFacsimileId(fId) {
    for (let i = 0; i < this.facsimileLookupData.length; i++) {
      if (String(this.facsimileLookupData[i]['pf_id']) === String(fId)) {
        return this.facsimileLookupData[i]['p_name'];
      }
    }
  }

  getPublicationNameByPublicationId(fId) {
    for (let i = 0; i < this.facsimileLookupData.length; i++) {
      if (String(this.facsimileLookupData[i]['p_id']) === String(fId)) {
        return {'p_name': this.facsimileLookupData[i]['p_name'], 'pc_name': this.facsimileLookupData[i]['pc_name']};
      }
    }
  }

  getPageCountNameByFacsimileId(fId) {
    for (let i = 0; i < this.facsimileLookupData.length; i++) {
      if (String(this.facsimileLookupData[i]['pf_id']) === String(fId)) {
        return this.facsimileLookupData[i]['page_nr'];
      }
    }
  }

  getPublicationIdNameByFacsimileId(fId) {
    for (let i = 0; i < this.facsimileLookupData.length; i++) {
      if (String(this.facsimileLookupData[i]['pf_id']) === String(fId)) {
        return this.facsimileLookupData[i]['p_id'];
      }
    }
  }

  getPublicationCollectionNameByFacsimileId(fId) {
    for (let i = 0; i < this.facsimileLookupData.length; i++) {
      if (String(this.facsimileLookupData[i]['pf_id']) === String(fId)) {
        return this.facsimileLookupData[i]['pc_name'];
      }
    }
  }

  nextAutocomplete() {
    this.acIndex = this.acIndex < this.searchSuggestions.length - 1 ? ++this.acIndex : 0;
  }

  prevAutocomplete() {
    this.acIndex = this.acIndex > 0 ? --this.acIndex : this.searchSuggestions.length - 1;
  }

  ngOnInit() {
    if (this.userSettingsService.isMobile()) {
      this.simpleSearchHeight = this.simpleSearchHeightSizeInPx.mobile;
    } else {
      this.simpleSearchHeight = this.simpleSearchHeightSizeInPx.desktop;
    }
  }

  configOccurrencePdf() {
    try {
      this.downloadOccurrencePdf = this.config.getSettings('simpleSearch.downloadOccurrencePdf');
    } catch (e) { }
  }

  setFocus() {
    this.searchbar.setFocus();
  }

  filterSubType(item) {
    if (this.appliedFacets.indexOf(item) < 0) {
      this.appliedFacets.push(item);
    }

    this.resultsToShow = [];
    this.displayResults.forEach(element => {
      this.appliedFacets.forEach(facet => {
        if (element.identifier === facet.identifier ||
          (element.collection_name === facet.collection && facet.identifier === undefined)) {
          this.resultsToShow.push(element);
        }
      });
    });
  }

  removeSubType(item) {
    this.appliedFacets.splice(this.appliedFacets.indexOf(item), 1);
    this.resultsToShow = [];
    if (this.appliedFacets.length > 0) {
      this.displayResults.forEach(element => {
        this.appliedFacets.forEach(facet => {
          if (element.identifier === facet.identifier ||
            (element.collection_name === facet.collection && facet.identifier === undefined)) {
            this.resultsToShow.push(element);
          }
        });
      });
    } else {
      this.resultsToShow = this.displayResults;
    }
  }

  onInput(event, preSearch?: string, skipSuggestions?: boolean) {
    this.isLoading = true;
    this.searchTypesMade = 0;
    this.textTypes = <any>{};
    this.searchFacets = new Array<Facet>();
    this.displayResult = [];
    this.displayResults = [];
    if (preSearch) {
      this.searchString = preSearch;
    } else if (event !== null) {
      this.searchString = event.target.value;
    } else {
      this.searchString = null;
    }

    if (this.searchString !== null && this.searchString !== '') {
      if (!skipSuggestions) {
        this.search.getSearchSuggestiongs(this.searchString, 20).subscribe(
          res => {
            this.searchSuggestions = res;
            const foundItems: Array<string> = new Array();
            for (let i = 0; i < this.searchSuggestions.length; i++) {
              if (this.searchSuggestions[i].suggestion === 'undefined' ||
                this.searchSuggestions[i].suggestion === undefined ||
                String(this.searchSuggestions[i].suggestion).trim() === '') {
                continue;
              }
              if (foundItems.indexOf(String(this.searchSuggestions[i].suggestion).toLowerCase()) > -1) {
                continue;
              } else {
                foundItems.push(String(this.searchSuggestions[i].suggestion).toLowerCase());
              }
            }
            this.searchSuggestions = foundItems.reverse();
            this.isLoading = false;
          },
          error => { this.errorMessage = <any>error }
        );
      }
    } else {
      this.searchSuggestions = [];
      this.displayResult = [];
      this.isLoading = false;
    }
  }

  startSearch(searchString) {
    this.isLoading = true;
    this.searchString = searchString;
    this.userDefinedSearchFields.forEach(function (val) {
      this.search.getAll(searchString, val, 1).subscribe(
        res => {
          // in order to get id attributes for tooltips
          this.searchResult = res
          this.formatSearchresult(val);
          this.mergeResults('texts');
          this.mergeResults('subjects');
          this.mergeResults('tags');
          this.mergeResults('locations');
          this.mergeResults('songs');
          this.isLoading = false;
        },
        error => { this.errorMessage = <any>error }
      );
    }.bind(this));
  }

  selectAutocomplete(suggestion) {
    this.myInput = suggestion;
    this.searchSuggestions = [];
    this.startSearch(suggestion);
    this.acIndex = 0;
  }

  mergeResults(type: string) {
    this.isLoading = false;
    if (this.hasKey('collections', this.searchFacets) === false &&
      this.displayResult[type].length > 0) {
      const facet: Facet = new Facet;
      facet.name = 'collections';
      facet.count = 1;
      facet.checked = this.checkedDefault;
      facet.opened = false;
      facet.children = [];
      facet.type = 'collections';
      this.searchFacets.push(facet);
    }

    if (this.displayResult[type] !== undefined && this.displayResult[type].length > 0) {
      if (this.displayResults === undefined) {
        this.displayResults = [];
      }
      this.displayResults = this.displayResults.concat(this.displayResult[type]);
      for (let index = 0; index < this.displayResult[type].length; index++) {
        const facet: Facet = new Facet;
        facet.name = this.displayResult[type][index]['textType'];
        facet.type = this.displayResult[type][index]['textType'];
        facet.count = this.displayResult[type].length;
        facet.checked = this.checkedDefault;
        facet.opened = false;
        facet.children = [];
        if (this.hasKey(this.displayResult[type][index]['textType'], this.searchFacets) === false) {
          this.searchFacets.push(facet);
        }
      }
    }

    this.createCollectionFacets(type);
    this.createFacets(type);
    this.totalHits = this.displayResults.length;
    this.sortResults('score', 'DESC');
    this.searchFacets.sort();
    this.resultsToShow = this.displayResults;
  }

  createCollectionFacets(type: string) {
    const collections: Facet = new Facet;
    collections.type = 'collections';
    collections.name = 'collections';
    collections.checked = true;
    collections.count = 1;
    collections.children = [];

    if (this.displayResult[type] === undefined) {
      return false;
    }

    for (let i = 0; i < this.displayResult[type].length; i++) {
      if (String(this.displayResult[type][i]['collection_name']).trim() === '' ||
        this.displayResult[type][i]['collection_name'] === undefined) {
        continue;
      }
      const facet: Facet = new Facet;
      facet.name = this.displayResult[type][i]['collection_name'];
      facet.count = 1;
      facet.checked = this.checkedDefault;
      facet.opened = false;
      facet.children = [];
      facet.collection = this.displayResult[type][i]['collection_name'];
      facet.type = this.displayResult[type][i]['collection_name'];

      if (this.hasKey('collections', this.searchFacets) === false) {
        if (this.hasKey(facet.type, this.searchFacets) === false) {
          collections.children.push(facet);
        }
      } else {
        for (let j = 0; j < this.searchFacets.length; j++) {
          if (this.searchFacets[j].type === 'collections') {
            if (this.hasKey(facet.type, this.searchFacets[j].children) === false) {
              this.searchFacets[j].children.push(facet);
              this.searchFacets[j].count = this.searchFacets[j].children.length;
            } else {
              for (let k = 0; k < this.searchFacets[j].children.length; k++) {
                if (facet.name === this.searchFacets[j].children[k].name) {
                  this.searchFacets[j].children[k].count += 1;
                }
              }
            }
          }
        }
        this.searchFacets[0].children.sort();
      }
    }

    if (this.hasKey('collections', this.searchFacets) === false && this.displayResult[type].length > 0) {
      this.searchFacets.push(collections);
    }
  }

  createFacets(type: string) {

    if (this.displayResult[type] === undefined) {
      return false;
    }

    for (let i = 0; i < this.displayResult[type].length; i++) {
      for (let j = 0; j < this.searchFacets.length; j++) {
        if (this.searchFacets[j].type === this.displayResult[type][i]['textType']) {
          const facet: Facet = new Facet;
          facet.name = this.displayResult[type][i]['text'];
          facet.checked = this.checkedDefault;
          facet.count = 1;
          facet.type = this.displayResult[type][i]['textType'];
          facet.identifier = String(this.displayResult[type][i]['textType'] +
            this.displayResult[type][i]['text']).toLowerCase().trim().replace(' ', '');
          facet.collection = this.displayResult[type][i]['collection_name'];
          let found = -1;
          for (let k = 0; k < this.searchFacets[j].children.length; k++) {
            if (this.searchFacets[j].children[k].name === facet.name &&
              this.searchFacets[j].children[k].type === facet.type) {
              found = k;
              break;
            }
          }
          if (found === -1) {
            this.searchFacets[j].children.push(facet);
          } else {
            let occ = 0;
            for (let l = 0; l < this.displayResult[type].length; l++) {
              if (this.displayResult[type][l]['text'] === facet.name) {
                occ++;
              }
            }
            this.searchFacets[j].children[found].count = occ;
          }
        }
      }
    }
  }

  hasKey(nameKey: String, myArray: any) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].type === nameKey) {
        return true;
      }
    }
    return false;
  }

  showSubFacets(item: any) {
    if (item.opened) {
      item.opened = false;
    } else {
      item.opened = true;
    }
  }

  sortResults<T>(propName, order: 'ASC' | 'DESC'): void {
    this.displayResults.sort((a, b) => {
      if (a[propName] < b[propName]) {
        return -1;
      }
      if (a[propName] > b[propName]) {
        return 1;
      }
      return 0;
    });
    if (order === 'DESC') {
      this.displayResults.reverse();
    }
  }

  formatSubjectResults(element) {
    const subjectData = element._source;
    const highlightData = (element.highlight !== undefined) ? element.highlight : { 'full_name': null };
    if (element._score > 1) {
      this.displayResult['subjects'].push(
        {
          'TitleIndexed': String(subjectData['full_name']).replace(' ,', ''),
          'highLightText': (highlightData.full_name ? highlightData.full_name[0] : ''),
          'path': subjectData.publication_collection_id + '_' + subjectData.publication_id,
          'textType': subjectData['type'],
          'matches': '',
          'text': subjectData['full_name'],
          'identifier': String(subjectData['type'] + subjectData['full_name']).toLowerCase().trim().replace(' ', ''),
          'origDate': '',
          'object_id': element._source.id ? element._source.id : null,
          'hidden': false,
          'date_born': String(subjectData['date_born']).split('-')[0],
          'date_deceased': String(subjectData['date_deceased']).split('-')[0],
          'place_of_birth': subjectData['place_of_birth'],
          'occupation': subjectData['occupation'],
          'score': element._score,
          'facsimilePage': ((subjectData['publication_facsimile_page']) ? subjectData['publication_facsimile_page'] : null),
          'publication_name': subjectData['publication_name'],
          'collection_name': subjectData['collection_name'],
          'publication_id': subjectData['publication_id'],
          'publication_version_id': subjectData['publication_version_id'],
          'publication_manuscript_id': subjectData['publication_manuscript_id'],
          'publication_facsimile_id': subjectData['publication_facsimile_id'],
          'publication_comment_id': subjectData['publication_comment_id']
        }
      );
    }
  }

  formatTagsResults(element) {
    const tagData = element._source;
    const highlightData = (element.highlight !== undefined) ? element.highlight : { 'name': null };
    if (element._score > 1) {
      this.displayResult['tags'].push(
        {
          'TitleIndexed': String(tagData['name']).replace(' ,', ''),
          'highLightText': (highlightData.name ? highlightData.name[0] : ''),
          'path': tagData.publication_collection_id + '_' + tagData.publication_id,
          'textType': 'tag',
          'matches': '',
          'hidden': false,
          'text': tagData['name'],
          'tag': tagData['name'],
          'identifier': String('tag' + tagData['name']).toLowerCase().trim().replace(' ', ''),
          'origDate': '',
          'object_id': element._source.id ? element._source.id : null,
          'score': element._score,
          'facsimilePage': ((tagData['publication_facsimile_page']) ? tagData['publication_facsimile_page'] : null),
          'publication_name': tagData['publication_name'],
          'collection_name': tagData['collection_name'],
          'publication_id': tagData['publication_id'],
          'publication_version_id': tagData['publication_version_id'],
          'publication_manuscript_id': tagData['publication_manuscript_id'],
          'publication_facsimile_id': tagData['publication_facsimile_id'],
          'publication_comment_id': tagData['publication_comment_id']
        }
      );
    }
  }

  formatSongResults(element) {
    const songData = element._source;
    const highlightData = (element.highlight !== undefined) ? element.highlight : { 'song_name': null };
    if (element._score > 1) {
      this.displayResult['songs'].push(
        {
          'TitleIndexed': String(songData['song_name']).replace(' ,', ''),
          'highLightText': (highlightData.song_name ? highlightData.song_name[0] : ''),
          'path': songData.publication_collection_id + '_' + songData.publication_id,
          'textType': 'song',
          'matches': '',
          'hidden': false,
          'text': songData['song_name'],
          'song': songData['song_name'],
          'identifier': String('song' + songData['song_name']).toLowerCase().trim().replace(' ', ''),
          'origDate': songData['song_original_publication_date'],
          'object_id': String(songData['song_id']).toLowerCase(),
          'song_performer_born_name': songData['song_performer_born_name'],
          'song_performer_firstname': songData['song_performer_firstname'],
          'song_performer_lastname': songData['song_performer_lastname'],
          'song_recorder_born_name': songData['song_recorder_born_name'],
          'song_recorder_firstname': songData['song_recorder_firstname'],
          'song_recorder_lastname': songData['song_recorder_lastname'],
          'song_place': songData['song_place'],
          'song_type': songData['song_type'],
          'song_subtype': songData['song_subtype'],
          'song_variant': songData['song_variant'],
          'song_number': songData['song_number'],
          'song_landscape': songData['song_landscape'],
          'song_page_number': songData['song_page_number'],
          'song_original_collection_location': songData['song_original_collection_location'],
          'song_original_id': songData['song_original_id'],
          'song_original_collection_signature': songData['song_original_collection_signature'],
          'song_note': songData['song_note'],
          'song_lyrics': songData['song_lyrics'],
          'song_comment': songData['song_comment'],
          'score': element._score,
        }
      );
    }
  }

  formatLocationResults(element) {
    const locationData = element._source;
    const highlightData = (element.highlight !== undefined) ? element.highlight : { 'name': null };
    if (element._score > 1) {
      this.displayResult['locations'].push(
        {
          'TitleIndexed': String(locationData['name']).replace(' ,', ''),
          'highLightText': (highlightData.name ? highlightData.name[0] : ''),
          'path': locationData.publication_collection_id + '_' + locationData.publication_id,
          'textType': 'location',
          'matches': '',
          'hidden': false,
          'text': locationData['name'],
          'origDate': '',
          'identifier': String('location' + locationData['name']).toLowerCase().trim().replace(' ', ''),
          'object_id': element._source.id ? element._source.id : null,
          'score': element._score,
          'facsimilePage': ((locationData['publication_facsimile_page']) ? locationData['publication_facsimile_page'] : null),
          'publication_name': locationData['publication_name'],
          'collection_name': locationData['collection_name'],
          'publication_id': locationData['publication_id'],
          'publication_version_id': locationData['publication_version_id'],
          'publication_manuscript_id': locationData['publication_manuscript_id'],
          'publication_facsimile_id': locationData['publication_facsimile_id'],
          'publication_comment_id': locationData['publication_comment_id']
        }
      );
    }
  }

  formatTextResults(userField, element) {
    let pathString = '';
    let pubStr = '';
    let highLightText = '';
    let matches = [];
    if (element['highlight'] !== undefined) {
      highLightText = Array(element['highlight'][userField]).join();
    }
    const path = String(element['_source']['path']).split('/');
    pathString = String(path[path.length - 2]) + '_' + String(path[path.length - 1]).replace('.xml', '').replace('.txt', '');
    pubStr = String(path[path.length - 2]);
    let textType = 'Text';
    if (pathString.indexOf('_est') > 0) {
      textType = 'est';
    } else if (pathString.indexOf('_com') > 0) {
      textType = 'com';
    } else if (pathString.indexOf('_var') > 0) {
      textType = 'var';
    } else if (pathString.indexOf('_inl') > 0) {
      textType = 'inl';
    } else if (pathString.indexOf('_tit') > 0) {
      textType = 'tit';
    } else if (pathString.indexOf('_ms') > 0) {
      textType = 'ms';
    } else {
      textType = 'Text';
    }

    if (element['highlight'] !== undefined) {
      matches = highLightText.match(/<em>(.*?)<\/em>/g).map(function (val) {
        return val.replace(/<\/?em>/g, '');
      });
    }

    let TitleIndexed = '';
    let origDate = '';
    let text = '';
    let facsimilePage = '';
    let SLSCollection = '';
    let collection = '';
    let fId = '';
    try {
      TitleIndexed = (element['_source']['TitleIndexed']) ?
        String(element['_source']['TitleIndexed']).replace('Kommentarer till ', '') :
        Array(element['_source']['Chapter']).join();
      origDate = (element['_source']['origDate']) ? element['_source']['origDate'] : null;
      text = element['_source'][userField][0];
      facsimilePage = ((path[path.length - 1]) ? String(path[path.length - 1]).replace('.txt', '') : null);
      SLSCollection = ((element['_source']['Samling']) ? Array(element['_source']['Samling']).join() : null);
      collection = ((element['_source']['ChapterIndexed']) ? Array(element['_source']['ChapterIndexed']).join() : null);
    } catch (e) {
    }

    fId = String(path[path.length - 1]).split('_')[1];
    const pData = this.getPublicationNameByPublicationId(fId);
    const pubName = pData['p_name'];
    const colName = pData['pc_name'];
    const pubId = this.getPublicationIdNameByFacsimileId(fId);
    if (element._score > 1) {
      this.displayResult['texts'].push(
        {
          'TitleIndexed': TitleIndexed,
          'highLightText': highLightText,
          'path': pathString,
          'textType': textType,
          'matches': matches,
          'text': pubName,
          'hidden': false,
          'origDate': origDate,
          'identifier': String('text' + pubName).toLowerCase().trim().replace(' ', ''),
          'score': element._score,
          'facsimilePage': facsimilePage,
          'SLSCollection': SLSCollection,
          'publication_name': pubName,
          'publication_id': pubId,
          'collection_name': colName
        }
      );
    }
  }

  formatSearchresult(userField?: string) {
    this.displayResult['texts'] = [];
    this.displayResult['subjects'] = [];
    this.displayResult['locations'] = [];
    this.displayResult['tags'] = [];
    this.displayResult['songs'] = [];
    const subjectIds: Array<Number> = [];
    const locationIds: Array<Number> = [];
    const tagIds: Array<Number> = [];
    const songIds: Array<Number> = [];
    const textIds: Array<String> = [];
    this.searchResult.forEach(function (element) {

      if (element['_index'] === 'subject') {
        if (subjectIds.indexOf(element['_source']['id']) === -1) {
          this.formatSubjectResults(element);
        }
        subjectIds.push(Number(element['_source']['id']));
      } else if (element['_index'] === 'location') {
        if (locationIds.indexOf(element['_source']['id']) === -1) {
          this.formatLocationResults(element);
        }
        locationIds.push(Number(element['_source']['id']));
      } else if (element['_index'] === 'tag') {
        if (tagIds.indexOf(element['_source']['id']) === -1) {
          this.formatTagsResults(element);
        }
        tagIds.push(Number(element['_source']['id']));
      } else if (element['_index'] === 'song') {
        if (songIds.indexOf(element['_source']['id']) === -1) {
          this.formatSongResults(element);
        }
        songIds.push(Number(element['_source']['id']));
      } else {
        if (textIds.indexOf(element['_source']['path']) === -1) {
          this.formatTextResults(userField, element);
        }
        textIds.push(String(element['_source']['path']));
      }
    }.bind(this));
  }

  gotToText(id: string, textType: string, matches: Array<string>, facsimilePage, item?) {
    if (this.showFacets === true) {
      this.showFacets = false;
      return true;
    }
    if (this.downloadOccurrencePdf && textType === 'Text') {
      const ids = String(id).split('_');
      this.showPDF(ids[0], ids[1]);
    } else {
      const data = id.split('_');
      let text = {};

      if (data.length > 3) {
        text = {
          'collectionID': data[1],
          'publicationId': data[2],
          'textType': data[3],
          'version': data[4],
          'linkID': id,
          'facsimilePage': facsimilePage
        };
      } else {
        text = {
          'collectionID': data[1],
          'publicationId': data[2],
          'textType': data[3],
          'version': '',
          'linkID': id,
          'facsimilePage': facsimilePage
        };
      }

      if (item && item.object_id) {
        text['object_id'] = item.object_id;
      }

      this.openText(text, matches);
    }
  }

  downloadPdfPath(filePath) {
    const splittedFilePath = filePath.split('/');
    if (!splittedFilePath || splittedFilePath.length < 3) {
      return;
    }

    const collectionID = splittedFilePath[splittedFilePath.length - 2];
    const fileName = splittedFilePath[splittedFilePath.length - 1];
    const fileExtension = fileName.split('.')[-1];

    if (fileExtension !== 'pdf') {
      return;
    }

    const dURL = `${this.apiEndPoint}/${this.projectMachineName}/files/${collectionID}/pdf/${fileName}/`;
    const ref = window.open(dURL, '_self', 'location=no');
  }

  openText(text: any, matches: Array<string>) {
    if (text.object_id &&
      this.objectTypes.all.indexOf(text.textType) !== -1 &&
      this.fromResultToOccurrence === true) {
      let objectType = text.textType;

      if (this.objectTypes.subjects.indexOf(text.textType) !== -1) {
        objectType = 'subject';
      }

      if (this.platform.is('mobile')) {
        this.events.publish('searchModal:closed', {});
      }
      this.goToOccurrencesResultPage(objectType, text.object_id);
      return;
    } else if (text.textType === 'song') {
      if (this.platform.is('mobile')) {
        this.events.publish('searchModal:closed', {});
      }
      this.goToSongResultPage(text.object_id);
      return;
    }

    const params = {};
    const nav = this.app.getActiveNavs();
    const col_id = text.collectionID;
    const pub_id = text.publicationId;
    let text_type: string;

    if (text.textType === 'ms') {
      text_type = 'manuscripts';
    } else if (text.textType === 'var') {
      text_type = 'variations';
    } else if (text.textType === 'facs') {
      text_type = 'facsimiles'
    } else if (text.textType === 'est') {
      text_type = 'established';
    } else if (text.facsimilePage) {
      text_type = 'facsimiles';
    } else if (text.textType === 'location') {
      text_type = 'established';
    } else if (text.textType === 'subject') {
      text_type = 'established';
    } else if (text.textType === 'tag') {
      text_type = 'established';
    } else {
      text_type = 'comments';
    }

    if (text.facsimilePage) {
      params['facsimilePage'] = text.facsimilePage;
    } else {
      params['facsimilePage'] = null;
    }

    params['tocLinkId'] = text.collectionID;
    params['searchResult'] = this.searchString;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    params['root'] = this.root;
    params['matches'] = matches;
    params['views'] = [
      {
        type: text_type,
        id: text.linkID
      }
    ];

    this.app.getRootNav().push('read', params);
    if (this.platform.is('mobile')) {
      this.events.publish('searchModal:closed', {});
    }
  }

  goToOccurrencesResultPage(objectType: String, id: any) {
    const params = {
      objectType: objectType,
      id: id,
      searchResult: this.searchString
    }

    this.app.getRootNav().push('occurrences-result', params);
  }

  goToSongResultPage(id: any) {
    const params = {
      song_number: id,
      filter_songs_by: 'all'
    }

    this.app.getRootNav().push('song', params);
  }

  showPDF(facsimileId, pageNbr) {
    const isChildPdf = true;
    const nav = this.app.getActiveNavs();
    const params = { facsimileId: facsimileId, page: pageNbr, search: 'fooo' };
    this.app.getRootNav().push('pdf', params);
  }

  toggleFacets(closeOnly?) {
    if (closeOnly) {
      this.showFacets = false;
    } else {
      if (this.showFacets) {
        this.showFacets = false;
      } else {
        this.showFacets = true;
      }
    }
  }
}
