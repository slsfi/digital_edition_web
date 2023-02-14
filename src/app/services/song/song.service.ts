import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/core/config.service';

@Injectable()
export class SongService {
  textCache: any;

  constructor(private config: ConfigService, private http: HttpClient) {}

  getSongs(): Observable<any> {
    return this.http.get('assets/fsfd_songs_example.json');
  }

  getSongsByCategory(category: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        `/songs/category/${category}`
    );
  }

  getSongsFiltered(filters: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        '/songs/filtered',
      { params: filters }
    );
  }

  getSong(file_name: string): Observable<any> {
    file_name = String(file_name).toUpperCase();
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        `/song/${file_name}`
    );
  }

  getSongById(id: any): Observable<any> {
    id = String(id).toUpperCase();
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        `/song/${id}`
    );
  }

  getSongByItemId(itemid: any): Observable<any> {
    return this.http.get(
      this.config.getSettings('app.apiEndpoint') +
        '/' +
        this.config.getSettings('app.machineName') +
        `/song/itemid/${itemid}`
    );
  }
}
