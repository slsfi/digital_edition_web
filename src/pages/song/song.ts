import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ModalController, App, Platform } from 'ionic-angular';
import { SongService } from '../../app/services/song/song.service';
import { Song } from '../../app/models/song.model';
import { OccurrenceResult } from '../../app/models/occurrence.model';
import { OccurrencesPage } from '../occurrences/occurrences';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

declare var MIDIjs;

/**
 * Generated class for the SongPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@IonicPage({
  name: 'song',
  segment: 'song/:song_number/:filter_songs_by'
})
@Component({
  selector: 'page-song',
  templateUrl: 'song.html',
})
export class SongPage {
  songFile = '';
  songID = '';
  title = '';
  song: any;
  showOccurrencesModal = false;
  occurrenceResult: OccurrenceResult;
  currentFilterType: ''
  songFilters = {
    subjectName: '',
    location: '',
    tag: ''
  };
  songOriginalId: string;
  playing = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public songService: SongService,
    private events: Events,
    private app: App,
    private platform: Platform,
    public modalCtrl: ModalController,
    private userSettingsService: UserSettingsService,
    public cdRef: ChangeDetectorRef
  ) {
    if (this.navParams.get('occurrenceResult')) {
      this.occurrenceResult = this.navParams.get('occurrenceResult');
      this.showOccurrencesModal = true;
    }
    this.playing = false;
    this.setSongId();
    this.getSongDetails();
  }

  ionViewDidEnter() {
    (<any>window).ga('set', 'page', 'Song');
    (<any>window).ga('send', 'pageview');
  }

  setSongFilter() {
    if (this.navParams.get('filter_songs_by')) {
      const filter = this.navParams.get('filter_songs_by');
      this.currentFilterType = filter;
      if (filter === 'playman') {
        this.songFilters.subjectName = this.song.performer_firstname + ' ' + this.song.performer_lastname;
      } else if (filter === 'recorder') {
        this.songFilters.subjectName = this.song.recorder_firstname + ' ' + this.song.recorder_lastname;
      } else if (filter === 'location') {
        this.songFilters.location = this.song.place;
      } else if (filter === 'tag') {
        this.songFilters.tag = this.song.type;
      } else {
        this.songFilters.tag = filter;
      }
    }
  }

  openOccurrenceResult() {
    let objectType = '';
    if (this.navParams.get('objectType')) {
      objectType = this.navParams.get('objectType');
    }
    const nav = this.app.getActiveNavs();

      const params = {
        id: this.occurrenceResult.id,
        objectType: objectType
      }

      if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
        nav[0].push('occurrences-result', params);
      } else {
        nav[0].setRoot('occurrences-result', params);
      }
  }

  setSongId() {
    if (this.navParams.get('song_number')) {
      const songNumber = this.navParams.get('song_number');
      this.songID = songNumber;
    }
  }

  playSong() {
    this.doAnalytics('Play', 'play midi');
    this.playing = true;
    MIDIjs.play(`assets/midi-files/${this.songOriginalId}.mid`);
  }

  stopSong() {
    this.playing = false;
    MIDIjs.stop();
  }

  getSongDetails() {
    this.songService.getSong(this.songID).subscribe(
      song => {
        this.song = new Song(song);
        this.song.volume = String(this.song.volume).toUpperCase();
        this.songOriginalId = String(song['song_original_id']).toLowerCase();
        this.setSongFilter();
        this.cdRef.detectChanges();
        try {
          (<any>window).ga('send', 'event', {
            eventCategory: 'Song - ' + this.song.type,
            eventLabel: 'Song',
            eventAction: String(this.songOriginalId),
            eventValue: 10
          });
        } catch ( e ) {
        }
      },
      err => console.error(err),
      () => console.log('fetch song')
    );
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
    this.stopSong();
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('musicAccordion:reset', true);
    this.cdRef.detectChanges();
  }

  ionViewDidLoad() {
    // console.log('ionViewDidLoad SongPage');
  }

  downloadMIDI() {
    this.doAnalytics('Download', 'mid');
    const dURL = `assets/midi-files/${this.songOriginalId}.mid`;
    const ref = window.open(dURL, '_self', 'location=no');
  }

  downloadXML() {
    this.doAnalytics('Download', 'xml');
    const dURL = `assets/musicxml/${this.songOriginalId}.xml`;
    const ref = window.open(dURL, '_self', 'location=no');
  }

  downloadJPEG() {
    this.doAnalytics('Download', 'jpg');
    const dURL = `assets/jpeg-files/${this.songOriginalId}.jpg`;
    const ref = window.open(dURL, '_self', 'location=no');
  }

  doAnalytics( action, type ) {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: action,
        eventLabel: 'Song',
        eventAction: type + ' - ' +  this.songOriginalId,
        eventValue: 10
      });
    } catch ( e ) {
    }
  }

}
