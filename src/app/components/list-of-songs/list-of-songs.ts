import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { SongService } from 'src/app/services/song/song.service';

/**
 * Generated class for the ListOfSongsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'list-of-songs',
  templateUrl: 'list-of-songs.html',
  styleUrls: ['./list-of-songs.scss'],
})
export class ListOfSongsComponent {
  @Input() songCategory?: string;
  @Input() currentSong?: string;
  @Input() currentFilterType?: string;
  @Input() songFilters?: {
    subjectName?: string,
    location?: string,
    tag?: string
  };

  isLoading = false;
  allSongs: Array<any> = [];
  songsToShow: Array<any> = [];
  filtersChecked = false;
  songsCount = 0;
  infiniteScrollNumber = 100;

  constructor(
    public songService: SongService,
    private userSettingsService: UserSettingsService,
    private actionSheetCtrl: ActionSheetController,
    public cdRef: ChangeDetectorRef,
    private router: Router) {
  }

  ngOnInit() {
    this.isLoading = true;
    const filters = {} as any;

    if (this.songCategory) {
      filters['category'] = this.songCategory;
    } else if (this.songFilters?.subjectName) {
      filters['subject_name'] = this.songFilters.subjectName;
    } else if (this.songFilters?.location) {
      filters['location'] = this.songFilters.location;
    } else if (this.songFilters?.tag) {
      filters['category'] = this.songFilters.tag;
    }
    this.getSongsFiltered(filters);
    this.filtersChecked = true;
    this.cdRef.detectChanges();
  }

  async songAction(song: any) {
    const btns = [
      {
        text: 'Öppna Sång',
        handler: () => {
          this.selectSong(song);
        }
      }, {
        text: 'Se ort',
        handler: () => {
          this.selectLocation(song.location_id);
        }
      }, {
        text: 'Se Spelman',
        handler: () => {
          this.selectSubject(song.playman_id);
        }
      }, {
        text: 'Se Upptecknare',
        handler: () => {
          this.selectSubject(song.recorder_id);
        }
      }
    ];
    if (song.tag_id) {
      btns.push({
        text: 'Se Melodityp: ' + song.song_type,
        handler: () => {
          this.selectTag(song.tag_id);
        }
      });
    }

    const actionSheet = await this.actionSheetCtrl.create({
      header: song.song_name,
      buttons: btns
    });
    actionSheet.present();

  }

  /**
   * Highlight current song
   * @param currentSong
   */
  setSelected(currentSong: any) {
    for (const song of this.allSongs) {
      if (song.song_name === currentSong) {
        song['selected'] = true;
        break;
      }
    }
  }

  /**
   * Select an other song and show it on same page
   * @param song
   */
  selectSong(song: any) {
    song.song_name = String(song.song_name).replace(' ', '_').toLowerCase();
    const params = {
      song_number: song.publication_song_id,
      filter_songs_by: 'all'
    };

    if (this.songCategory) {
      params.filter_songs_by = this.songCategory;
    }
    this.router.navigate(['/song'], { queryParams: params });
  }

  /**
   * Show subject info and occurrences
   * @param subjectID - subject id
   */
  selectSubject(subjectID: any) {
    const params = {
      objectType: 'subject',
      id: subjectID
    }

    this.router.navigate(['/occurrences-result'], { queryParams: params });
  }

  /**
   * Show location info and occurrences
   * @param locationID - location id
   */
  selectLocation(locationID: any) {
    const params = {
      objectType: 'location',
      id: locationID
    }

    this.router.navigate(['/occurrences-result'], { queryParams: params });
  }

  /**
   * Show tag info and occurrences
   * @param tagID
   */
  selectTag(tagID: any) {
    const params = {
      objectType: 'tag',
      id: tagID
    }

    this.router.navigate(['/occurrences-result'], { queryParams: params });
  }

  /**
   * Get songs filtered
   * @param filters - give either subject_name, location or category
   */
  getSongsFiltered(filters: any) {
    this.songService.getSongsFiltered(filters).subscribe(
      songs => {
        for (const i in songs) {
          songs[i].song_name = songs[i].song_name.replace('_', ' ').toUpperCase();
        }

        this.allSongs = songs;

        this.sortSongs();
        if (this.currentSong && this.allSongs.length) {
          this.setSelected(this.currentSong);
        }

        for (let i = 0; i < this.infiniteScrollNumber; i++) {
          if (i === songs.length) {
            break;
          } else {
            this.songsToShow.push(this.allSongs[this.songsCount]);
            this.songsCount++;
          }
        }
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error =>  {
        console.error('ListOfSongsComponent', error);
        this.isLoading = false;
      }
    );
  }

  sortSongs() {
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    this.allSongs.sort(function(a, b) {
      return collator.compare(a.song_name, b.song_name)
    });
  }

  doInfinite(infiniteScroll: any) {
    if (this.allSongs && this.allSongs.length && this.songsCount < this.allSongs.length ) {
      for (let i = 0; i < this.infiniteScrollNumber; i++) {
        if (this.songsCount < this.allSongs.length) {
          this.songsToShow.push(this.allSongs[this.songsCount]);
          this.songsCount++;
        } else {
          break;
        }
      }
    }
    infiniteScroll.complete();
  }
}
