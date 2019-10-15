import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class SongService {

  textCache: any;

  constructor(private http: Http, private config: ConfigService) {

  }

  getSongs (): Observable<any[]> {
    return this.http.get('assets/fsfd_songs_example.json')
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getSongsByCategory (category): Observable<any[]> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        `/songs/category/${category}`)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getSongsFiltered (filters): Observable<any[]> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        '/songs/filtered', {params: filters})
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getSong (file_name: string): Observable<any[]> {
    file_name = String(file_name).toUpperCase();
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        `/song/${file_name}`)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getSongById(id): Observable<any> {
    id = String(id).toUpperCase();
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        `/song/${id}`)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  getSongByItemId(itemid): Observable<any> {
    return this.http.get(this.config.getSettings('app.apiEndpoint') + '/' +
                         this.config.getSettings('app.machineName') +
                        `/song/itemid/${itemid}`)
                    .map(this.extractData)
                    .catch(this.handleError);
  }

  private extractData(res: Response) {
    const body = res.json();
    return body || { };
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
