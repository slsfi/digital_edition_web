import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class SongService {

  textCache: any;

  constructor(private config: ConfigService) {

  }

  getSongs (): Observable<any> {
    return ajax('assets/fsfd_songs_example.json')
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getSongsByCategory (category: any): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
   `/songs/category/${category}`)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getSongsFiltered (filters: any): Observable<any> {
    return ajax.get(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
   '/songs/filtered', {params: filters})
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getSong (file_name: string): Observable<any> {
    file_name = String(file_name).toUpperCase();
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
   `/song/${file_name}`)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getSongById(id: any): Observable<any> {
    id = String(id).toUpperCase();
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
   `/song/${id}`)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  getSongByItemId(itemid: any): Observable<any> {
    return ajax(this.config.getSettings('app.apiEndpoint') + '/' +
    this.config.getSettings('app.machineName') +
   `/song/itemid/${itemid}`)
       .pipe(
          map(this.extractData),
          catchError(this.handleError),
       );
  }

  private extractData(res: AjaxResponse<unknown>) {
    return res.response;
  }

  private async handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = await error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return throwError(errMsg);
  }

}
