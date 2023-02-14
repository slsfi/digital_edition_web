import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonFunctionsService } from '../common-functions/common-functions.service';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class SemanticDataService {
  textCache: any;
  useLegacy: boolean;
  elasticSubjectIndex: string;
  elasticLocationIndex: string;
  elasticWorkIndex: string;
  elasticTagIndex: string;
  flattened: any;

  constructor(
    private config: ConfigService,
    public commonFunctions: CommonFunctionsService,
    private http: HttpClient
  ) {
    try {
      this.useLegacy = !!this.config.getSettings(
        'app.useLegacyIdsForSemanticData'
      ) as boolean;
    } catch (e) {
      this.useLegacy = false;
    }
    this.elasticSubjectIndex = 'subject';
    this.elasticLocationIndex = 'location';
    this.elasticWorkIndex = 'work';
    this.elasticTagIndex = 'tag';
    this.flattened = [];
  }

  getFilterCollections(): Observable<any> {
    return this.http.get('assets/filterCollections.json');
  }

  getFilterPersonTypes(): Observable<any> {
    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: { project_id: this.config.getSettings('app.projectId') },
            },
          ],
        },
      },
      aggs: {
        types: {
          terms: {
            field: 'type.keyword',
          },
        },
      },
    };
    return this.http.post(this.getSearchUrl(this.elasticSubjectIndex), payload);
  }

  getFilterCategoryTypes(): Observable<any> {
    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: { project_id: this.config.getSettings('app.projectId') },
            },
          ],
        },
      },
      aggs: {
        types: {
          terms: {
            field: 'tag_type.keyword',
          },
        },
      },
    };

    return this.http.post(this.getSearchUrl(this.elasticTagIndex), payload);
  }

  getFilterPlaceCountries(): Observable<any> {
    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: { project_id: this.config.getSettings('app.projectId') },
            },
          ],
        },
      },
      aggs: {
        countries: {
          terms: {
            field: 'country.keyword',
          },
        },
      },
    };

    return this.http.post(
      this.getSearchUrl(this.elasticLocationIndex),
      payload
    );
  }

  getPlace(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/location/' +
        id
    );
  }

  getPerson(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/subject/' +
        id
    );
  }

  getTag(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/tag/' +
        id
    );
  }

  getWork(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/work/' +
        id
    );
  }

  getSemanticData(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/tag/' +
        id
    );
  }

  getAllPerson(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/subjects'
    );
  }

  getOccurrencesByType(
    object_type: string,
    object_subtype?: string
  ): Observable<any> {
    let occurrenceURL = `/occurrences/${object_type}`;

    if (object_subtype) {
      occurrenceURL = `${occurrenceURL}/${object_subtype}`;
    }

    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        occurrenceURL
    );
  }

  getSubjectOccurrences(subject_id?: Number): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/subject/occurrences/' +
        (subject_id ? subject_id + '/' : '')
    );
  }

  getSubjects(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/subjects'
    );
  }

  getSubjectsElastic(
    after_key?: any,
    searchText?: any,
    filters?: any,
    max?: any
  ) {
    let showPublishedStatus = 2;
    try {
      showPublishedStatus = this.config.getSettings(
        'PersonSearch.ShowPublishedStatus'
      ) as number;
    } catch (e) {
      showPublishedStatus = 2;
    }

    if (filters === null || filters === undefined) {
      filters = {};
    }

    if (max === undefined || max === null) {
      max = 500;
    } else if (max > 10000) {
      max = 10000;
    }

    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: {
                project_id: { value: this.config.getSettings('app.projectId') },
              },
            },
            { term: { published: { value: showPublishedStatus } } },
            { term: { sub_deleted: { value: 0 } } },
            { term: { ev_c_deleted: { value: 0 } } },
            { term: { ev_o_deleted: { value: 0 } } },
            { term: { publication_deleted: { value: 0 } } },
          ],
        },
      },
      aggs: {
        unique_subjects: {
          composite: {
            size: max,
            sources: [
              {
                sort_by_name: {
                  terms: {
                    field: 'sort_by_name.keyword',
                    missing_bucket: true,
                  },
                },
              },
              { full_name: { terms: { field: 'full_name.keyword' } } },
              {
                date_born: {
                  terms: { field: 'date_born.keyword', missing_bucket: true },
                },
              },
              {
                date_deceased: {
                  terms: {
                    field: 'date_deceased.keyword',
                    missing_bucket: true,
                  },
                },
              },
              {
                type: {
                  terms: { field: 'type.keyword', missing_bucket: true },
                },
              },
              { id: { terms: { field: 'id' } } },
            ],
          },
        },
      },
    };

    if (
      after_key !== undefined &&
      !this.commonFunctions.isEmptyObject(after_key)
    ) {
      payload.aggs.unique_subjects.composite.after = after_key;
    }

    if (
      filters !== undefined &&
      filters['filterPersonTypes'] !== undefined &&
      filters['filterPersonTypes'].length > 0
    ) {
      payload.query.bool.must.push({ bool: { should: [] } });
      filters['filterPersonTypes'].forEach((element: any) => {
        payload.query.bool.must[
          payload.query.bool.must.length - 1
        ].bool.should.push({ term: { 'type.keyword': String(element.name) } });
      });
    }

    // Add date range filter.
    if (filters.filterYearMax && filters.filterYearMin) {
      payload.query.bool.must.push({
        range: {
          date_born_date: {
            gte: ('0000' + String(filters.filterYearMin)).slice(-4) + '-01-01',
            lte: ('0000' + String(filters.filterYearMax)).slice(-4) + '-12-31',
          },
        },
      });
    }

    // Search for first character of name
    if (
      searchText !== undefined &&
      searchText !== '' &&
      String(searchText).length === 1
    ) {
      payload.query.bool.must.push({
        regexp: {
          'sort_by_name.keyword': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
    } else if (searchText !== undefined && searchText !== '') {
      payload.query.bool.must.push({
        fuzzy: {
          full_name: {
            value: `${String(searchText)}`,
          },
        },
      });
    }

    return this.http.post(this.getSearchUrl(this.elasticSubjectIndex), payload);
  }

  getSingleObjectElastic(type: any, id: any) {
    const payload: any = {
      from: 0,
      size: 200,
      query: {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    term: {
                      project_id: this.config.getSettings('app.projectId'),
                    },
                  },
                  {
                    term: { id: id },
                  },
                ],
              },
            },
            {
              bool: {
                must: [
                  {
                    term: {
                      project_id: this.config.getSettings('app.projectId'),
                    },
                  },
                  {
                    term: { legacy_id: id },
                  },
                ],
              },
            },
          ],
        },
      },
    };

    if (type === 'work') {
      payload.query.bool.should[0].bool.must[1]['term'] = { man_id: id };
    }

    // remove if the ID is not strictly numerical
    if (/^\d+$/.test(id) === false) {
      delete payload.query.bool.should[0];
    }

    return this.http.post(this.getSearchUrl(type), payload);
  }

  getLocationElastic(
    after_key?: any,
    searchText?: any,
    filters?: any,
    max?: any
  ) {
    let showPublishedStatus = 2;
    try {
      showPublishedStatus = this.config.getSettings(
        'LocationSearch.ShowPublishedStatus'
      ) as number;
    } catch (e) {
      showPublishedStatus = 2;
    }

    if (filters === null || filters === undefined) {
      filters = {};
    }

    if (max === undefined || max === null) {
      max = 500;
    } else if (max > 10000) {
      max = 10000;
    }

    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: {
                project_id: { value: this.config.getSettings('app.projectId') },
              },
            },
            { term: { published: { value: showPublishedStatus } } },
            { term: { loc_deleted: { value: 0 } } },
            { term: { ev_c_deleted: { value: 0 } } },
            { term: { ev_o_deleted: { value: 0 } } },
            { term: { publication_deleted: { value: 0 } } },
          ],
        },
      },
      aggs: {
        unique_places: {
          composite: {
            size: max,
            sources: [
              {
                sort_by_name: {
                  terms: {
                    field: 'sort_by_name.keyword',
                    missing_bucket: true,
                  },
                },
              },
              { name: { terms: { field: 'name.keyword' } } },
              { id: { terms: { field: 'id' } } },
              { loc_id: { terms: { field: 'loc_id' } } },
            ],
          },
        },
      },
    };

    if (
      after_key !== undefined &&
      !this.commonFunctions.isEmptyObject(after_key)
    ) {
      payload.aggs.unique_places.composite.after = after_key;
    }

    if (
      filters !== undefined &&
      filters['filterPlaceCountries'] !== undefined &&
      filters['filterPlaceCountries'].length > 0
    ) {
      payload.query.bool.must.push({ bool: { should: [] } });
      filters['filterPlaceCountries'].forEach((element: any) => {
        payload.query.bool.must[
          payload.query.bool.must.length - 1
        ].bool.should.push({
          term: { 'country.keyword': String(element.name) },
        });
      });
    }

    if (
      searchText !== undefined &&
      searchText !== '' &&
      String(searchText).length === 1
    ) {
      // Search for first character of place name
      payload.query.bool.must.push({
        regexp: {
          'sort_by_name.keyword': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
    } else if (searchText !== undefined && searchText !== '') {
      // Fuzzy search in full place name
      payload.query.bool.must.push({
        fuzzy: {
          name: {
            value: `${String(searchText)}`,
          },
        },
      });
    }

    return this.http.get(this.getSearchUrl(this.elasticLocationIndex), payload);
  }

  getWorksElastic(from: any, searchText?: any) {
    const payload: any = {
      from: from,
      size: 200,
      sort: [{ 'author_data.last_name.keyword': 'asc' }],
      query: {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    term: {
                      project_id: this.config.getSettings('app.projectId'),
                    },
                  },
                  {
                    term: { deleted: 0 },
                  },
                ],
              },
            },
            {
              bool: {
                must: [
                  {
                    term: {
                      project_id: this.config.getSettings('app.projectId'),
                    },
                  },
                  {
                    term: { deleted: 0 },
                  },
                ],
              },
            },
          ],
        },
      },
    };
    // Search for first character of name
    if (
      searchText !== undefined &&
      searchText !== '' &&
      String(searchText).length === 1
    ) {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.should[0].bool.must.push({
        regexp: {
          'title.keyword': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
      payload.query.bool.should[1].bool.must.push({
        regexp: {
          'title.keyword': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
    } else if (searchText !== undefined && searchText !== '') {
      payload.from = 0;
      payload.size = 5000;
      payload.query.bool.should[0].bool.must.push({
        fuzzy: {
          title: {
            value: `${String(searchText)}`,
          },
        },
      });
      payload.query.bool.should[1].bool.must.push({
        regexp: {
          'author_data.full_name': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
    }
    return this.http.post(this.getSearchUrl(this.elasticWorkIndex), payload);
  }

  getTagElastic(after_key?: any, searchText?: any, filters?: any, max?: any) {
    let showPublishedStatus = 2;
    try {
      showPublishedStatus = this.config.getSettings(
        'TagSearch.ShowPublishedStatus'
      ) as number;
    } catch (e) {
      showPublishedStatus = 2;
    }

    if (filters === null || filters === undefined) {
      filters = {};
    }

    if (max === undefined || max === null) {
      max = 500;
    } else if (max > 10000) {
      max = 10000;
    }

    const payload: any = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: {
                project_id: { value: this.config.getSettings('app.projectId') },
              },
            },
            { term: { published: { value: showPublishedStatus } } },
            { term: { tag_deleted: { value: 0 } } },
            { term: { ev_c_deleted: { value: 0 } } },
            { term: { ev_o_deleted: { value: 0 } } },
            { term: { publication_deleted: { value: 0 } } },
          ],
        },
      },
      aggs: {
        unique_tags: {
          composite: {
            size: max,
            sources: [
              {
                sort_by_name: {
                  terms: {
                    field: 'sort_by_name.keyword',
                    missing_bucket: true,
                  },
                },
              },
              { name: { terms: { field: 'name.keyword' } } },
              {
                tag_type: {
                  terms: { field: 'tag_type.keyword', missing_bucket: true },
                },
              },
              { id: { terms: { field: 'id' } } },
              { tag_id: { terms: { field: 'tag_id' } } },
            ],
          },
        },
      },
    };

    if (
      after_key !== undefined &&
      !this.commonFunctions.isEmptyObject(after_key)
    ) {
      payload.aggs.unique_tags.composite.after = after_key;
    }

    if (
      filters !== undefined &&
      filters['filterCategoryTypes'] !== undefined &&
      filters['filterCategoryTypes'].length > 0
    ) {
      payload.query.bool.must.push({ bool: { should: [] } });
      filters['filterCategoryTypes'].forEach((element: any) => {
        payload.query.bool.must[
          payload.query.bool.must.length - 1
        ].bool.should.push({
          term: { 'tag_type.keyword': String(element.name) },
        });
      });
    }

    if (
      searchText !== undefined &&
      searchText !== '' &&
      String(searchText).length === 1
    ) {
      // Search for first character of tag name
      payload.query.bool.must.push({
        regexp: {
          'sort_by_name.keyword': {
            value: `${String(searchText)}.*|${String(
              searchText
            ).toLowerCase()}.*`,
          },
        },
      });
    } else if (searchText !== undefined && searchText !== '') {
      // Fuzzy search in full tag name
      payload.query.bool.must.push({
        fuzzy: {
          name: {
            value: `${String(searchText)}`,
          },
        },
      });
    }

    return this.http.get(this.getSearchUrl(this.elasticTagIndex), payload);
  }

  getSubjectOccurrencesById(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/occurrences/subject/' + id
    );
  }

  getOccurrences(type: string, id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/occurrences/' +
        type +
        '/' +
        id
    );
  }

  getLocationOccurrencesById(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/occurrences/location/' + id
    );
  }

  getTagOccurrencesById(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/occurrences/tag/' + id
    );
  }

  getWorkOccurrencesById(id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/workregister/work/project/occurrences/' +
        id
    );
  }

  getLocationOccurrences(id?: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/location/occurrences/' +
        (id ? id + '/' : '')
    );
  }

  getTagOccurrences(id?: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/tag/occurrences/' +
        (id ? id + '/' : '')
    );
  }

  getWorkOccurrences(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/workregister/manifestations/'
    );
  }

  getAllPlaces(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') + '/tooltips/locations'
    );
  }

  getSubjectsOccurencesByCollection(
    object_type: string,
    id: any[]
  ): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/occurrences/collection/' +
        object_type +
        '/' +
        id
    );
  }

  getPublicationTOC(collection_id: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/toc/' +
        collection_id
    );
  }

  private flatten(toc: any) {
    if (toc.children) {
      for (let i = 0, count = toc.children.length; i < count; i++) {
        if (
          toc.children[i].itemId !== undefined &&
          toc.children[i].itemId !== ''
        ) {
          this.flattened.push(toc.children[i]);
        }
        this.flatten(toc.children[i]);
      }
    }
  }

  private getSearchUrl(index: any): string {
    return (
      this.config.getSettings('app.apiEndpoint') +
      '/' +
      this.config.getSettings('app.machineName') +
      '/search/elastic/' +
      index
    );
  }
}
