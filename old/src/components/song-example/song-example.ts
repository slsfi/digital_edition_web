import { Component, Input } from '@angular/core';
import { Song } from '../../app/models/song.model';
import { NavController, NavParams } from 'ionic-angular';
import { SongService } from '../../app/services/song/song.service';
import { ConfigService } from '@ngx-config/core';

declare var MIDIjs;

/**
 * Generated class for the SongExampleComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'song-example',
  templateUrl: 'song-example.html'
})
export class SongExampleComponent {

  @Input() songDatafile?: string;
  @Input() legacyId?: string;

  songFile = '';
  song: any;
  musicXmlPath = '';
  playing = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
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

  getSong(id) {
    this.songService.getSong(id).subscribe(
      song => {
        this.song = new Song(song);
      },
      err => console.error(err),
      () => console.log('get song')
    );
  }

  getSongDatafile(id) {
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
