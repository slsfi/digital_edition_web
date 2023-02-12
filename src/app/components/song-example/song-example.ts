import { Component, Input } from '@angular/core';
import { Song } from 'src/app/models/song.model';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { SongService } from 'src/app/services/song/song.service';

declare var MIDIjs: any;

/**
 * Generated class for the SongExampleComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'song-example',
  templateUrl: 'song-example.html',
  styleUrls: ['song-example.scss']
})
export class SongExampleComponent {

  @Input() songDatafile?: string;
  @Input() legacyId?: string;

  songFile = '';
  song: any;
  musicXmlPath = '';
  playing = false;

  constructor(
    public songService: SongService,
    protected config: ConfigService
  ) {
    this.setAudio();
    this.playing = false;
    this.musicXmlPath = this.config.getSettings('app.apiEndpoint') + '/' +
                        this.config.getSettings('app.machineName') +
                        '/song-files/musicxml/'
  }

  ngOnInit() {
    this.getSongDetails();
  }

  setAudio() {
    // TODO
    // midi or mp3?
  }

  playSong() {
    this.playing = true;
    MIDIjs.play(`assets/midi-files/${this.songDatafile}.mid`);
  }

  stopSong() {
    MIDIjs.stop();
    this.playing = false;
  }

  getSongDetails() {
    if (this.songDatafile) {
      this.getSong(this.songDatafile);
    } else if (this.legacyId) {
      this.getSongByItemId();
    }
  }

  getSong(id: any) {
    this.songService.getSong(id).subscribe(
      song => {
        this.song = new Song(song);
      },
      err => console.error(err),
      () => console.log('get song')
    );
  }

  getSongDatafile(id: any) {
    this.songService.getSong(id).subscribe(
      song => {
        this.song = new Song(song);
      },
      err => console.error(err),
      () => console.log('get song')
    );
  }

  getSongByItemId () {
    this.songService.getSongById(this.legacyId).subscribe(
      song => {
        this.getSong(song.id);
      },
      err => console.error(err),
      () => console.log('get song by itemid')
    );
  }

  ionViewDidLoad() {
    // console.log('ionViewDidLoad SongPage');
  }

  ionViewWillLeave() {
    this.stopSong();
  }

}
