import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class ReferenceDataService {
  private referenceDataUrl = '/urn/';
  private urnResolverUrl: string;
  textCache: any;

  constructor(private config: ConfigService, private http: HttpClient) {
    try {
      this.urnResolverUrl = this.config.getSettings('urnResolverUrl') as string;
    } catch (e) {
      this.urnResolverUrl = 'https://urn.fi/';
    }
  }

  getReferenceData(id: string): Observable<any> {
    id = encodeURI(encodeURIComponent(id));
    // We need to doulbe encode the URL for the API
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.referenceDataUrl +
        id +
        '/'
    );
  }

  public getUrnResolverUrl() {
    return this.urnResolverUrl;
  }
}
