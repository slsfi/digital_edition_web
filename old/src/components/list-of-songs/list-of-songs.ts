import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { App, ActionSheetController } from 'ionic-angular';
import { SongService } from '../../app/services/song/song.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * Generated class for the ListOfSongsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'list-of-songs',
  templateUrl: 'list-of-songs.html'
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
    private app: App,
    public songService: SongService,
    private userSettingsService: UserSettingsService,
    private actionSheetCtrl: ActionSheetController,
    public cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.isLoading = true;
    const filters = {};

    if (this.songCategory) {
      filters['category'] = this.songCategory;
    } else if (this.songFilters.subjectName) {
      filters['subject_name'] = this.songFilters.subjectName;
    } else if (this.songFilters.location) {
      filters['location'] = this.songFilters.location;
    } else if (this.songFilters.tag) {
      filters['category'] = this.songFilters.tag;
    }
    this.getSongsFiltered(filters);
    this.filtersChecked = true;
    this.cdRef.detectChanges();
  }

  songAction(song) {
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

    const actionSheet = this.actionSheetCtrl.create({
      title: song.song_name,
      buttons: btns
    });
    actionSheet.present();

  }

  /**
   * Highlight current song
   * @param currentSong
   */
  setSelected(currentSong) {
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
  selectSong(song) {
    const nav = this.app.getActiveNavs();
    song.song_name = String(song.song_name).replace(' ', '_').toLowerCase();
    const params = {
      song_number: song.publication_song_id,
      filter_songs_by: 'all'
    };

    if (this.songCategory) {
      params.filter_songs_by = this.songCategory;
    }
    this.app.getRootNav().push('song', params);
  }

  /**
   * Show subject info and occurrences
   * @param subjectID - subject id
   */
  selectSubject(subjectID) {
    const params = {
      objectType: 'subject',
      id: subjectID
    }

    this.app.getRootNav().push('occurrences-result', params);
  }

  /**
   * Show location info and occurrences
   * @param locationID - location id
   */
  selectLocation(locationID) {
    const params = {
      objectType: 'location',
      id: locationID
    }

    this.app.getRootNav().push('occurrences-result', params);
  }

  /**
   * Show tag info and occurrences
   * @param tagID
   */
  selectTag(tagID) {
    const params = {
      objectType: 'tag',
      id: tagID
    }

    this.app.getRootNav().push('occurrences-result', params);
  }

  /**
   * Get songs filtered
   * @param filters - give either subject_name, location or category
   */
  getSongsFiltered(filters) {
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

  doInfinite(infiniteScroll) {
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
