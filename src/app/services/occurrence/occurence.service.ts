import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class OccurrenceService {
  constructor(private config: ConfigService, private http: HttpClient) {}

  getOccurences(object_type: string, id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/occurrences/' +
        object_type +
        '/' +
        id
    );
  }

  getMediaData(object_type: string, id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/media/data/' +
        object_type +
        '/' +
        id
    );
  }

  getGalleryOccurrences(type: any, id: any) {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/gallery/' +
        type +
        '/connections/' +
        id +
        '/1'
    );
  }

  getArticleData(object_type: string, id: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/media/articles/' +
        object_type +
        '/' +
        id
    );
  }
}
