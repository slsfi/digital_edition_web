import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConfigService } from '../config/core/config.service';

@Injectable()
export class HtmlContentService {
  private htmlUrl = '/html/';

  constructor(private config: ConfigService, private http: HttpClient) {}

  getHtmlContent(filename: string): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        this.htmlUrl +
        filename
    );
  }
}
