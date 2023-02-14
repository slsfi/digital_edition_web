import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class DigitalEditionListService {
  private digitalEditionsUrl = '/collections';

  constructor(private config: ConfigService, private http: HttpClient) {}

  getDigitalEditions(): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.digitalEditionsUrl
    );
  }

  async getDigitalEditionsPromise(): Promise<any> {
    try {
      const response = await fetch(
        this.config.getSettings('app.apiEndpoint') +
          '/' +
          this.config.getSettings('app.machineName') +
          this.digitalEditionsUrl
      );
      return response.json();
    } catch (e) {}
  }

  getCollectionsFromAssets(): Observable<any> {
    return this.http.get('assets/collections.json');
  }
}
