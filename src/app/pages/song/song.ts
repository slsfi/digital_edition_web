import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { OccurrenceResult } from 'src/app/models/occurrence.model';
import { Song } from 'src/app/models/song.model';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { EventsService } from 'src/app/services/events/events.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { SongService } from 'src/app/services/song/song.service';

declare var MIDIjs: any;

/**
 * Generated class for the SongPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
// @IonicPage({
//   name: 'song',
//   segment: 'song/:song_number/:filter_songs_by'
// })
@Component({
  selector: 'page-song',
  templateUrl: 'song.html',
  styleUrls: ['song.scss']
})
export class SongPage {
  songFile = '';
  songID = '';
  title = '';
  song: any;
  showOccurrencesModal = false;
  occurrenceResult?: OccurrenceResult;
  currentFilterType?: ''
  songFilters = {
    subjectName: '',
    location: '',
    tag: ''
  };
  songOriginalId?: string;
  playing = false;
  objectType: any;
  filterSongsBy: any;

  constructor(
    public songService: SongService,
    private events: EventsService,
    private platform: Platform,
    public modalCtrl: ModalController,
    private userSettingsService: UserSettingsService,
    public cdRef: ChangeDetectorRef,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.playing = false;
  }

  async ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['song_number']) {
        const songNumber = params['song_number'];
        this.songID = songNumber;
        this.getSongDetails();
      }
      this.filterSongsBy = params['filter_songs_by'];
    });

    this.route.queryParams.subscribe(params => {
      if (params['occurrenceResult']) {
        this.occurrenceResult = JSON.parse(params['occurrenceResult']);
        this.showOccurrencesModal = true;
      }
      this.objectType = params['objectType'];
    });
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Song');
  }

  setSongFilter() {
    if (this.filterSongsBy) {
      const filter = this.filterSongsBy;
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
    if (this.objectType) {
      objectType = this.objectType;
    }

      this.router.navigate([`/result/${objectType}/${this.occurrenceResult?.id}`]);

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
        this.analyticsService.doAnalyticsEvent('Song - ' + this.song.type, 'Song', String(this.songOriginalId));
      },
      err => console.error(err),
      () => console.log('fetch song')
    );
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
    this.stopSong();
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishMusicAccordionReset(true);
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

  doAnalytics( category: any, type: any ) {
    this.analyticsService.doAnalyticsEvent(category, 'Song', String(type + ' - ' +  this.songOriginalId));
  }

}
