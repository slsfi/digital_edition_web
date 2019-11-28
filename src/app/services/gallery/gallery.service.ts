import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class GalleryService {

  private apiEndPoint: string;
  private projectMachineName: string;
  private galleries: Array<any>;

  constructor(private http: Http, private config: ConfigService) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    this.getGalleries('sv');
  }

  async getGalleries(language: string): Promise<any> {
    try {
      const response = await this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
      this.config.getSettings('app.machineName') + '/gallery/data/' + language).toPromise();
      return response.json();
    } catch (e) {}
  }

  async getGalleryTags(id?): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/gallery/connections/tag' + incId).toPromise();
      return response.json();
    } catch (e) { }
  }

  async getGalleryLocations(id?): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/gallery/connections/location' + incId).toPromise();
      return response.json();
    } catch (e) { }
  }

  async getGallerySubjects(id?): Promise<any> {
    try {
      let incId = '';
      if (id) {
        incId = '/' + id;
      }
      const response = await this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
        this.config.getSettings('app.machineName') + '/gallery/connections/subject' + incId).toPromise();
      return response.json();
    } catch (e) { }
  }

  getGallery (id: string): Observable<any> {
    return this.http.get(  this.config.getSettings('app.apiEndpoint') + '/' +
                           this.config.getSettings('app.machineName') + '/gallery/data/' +
                           id + '/sv'
                           )
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  private extractData(res: Response) {
    const body = res.json();
    return body || { };
  }

  getGalleryOccurrences( type, id ) {
    return this.http.get(  this.config.getSettings('app.apiEndpoint')  + '/' +
                          this.config.getSettings('app.machineName') +
                          '/gallery/' + type + '/connections/' + id)
        .map(res => {
          const body = res.json();

          return body || ' - no content - ';
        })
        .catch(this.handleError);
  }

  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }

}
