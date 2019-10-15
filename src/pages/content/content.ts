import { UserSettingsService } from './../../app/services/settings/user-settings.service';
import { Component, Renderer } from '@angular/core';
import { NavController, NavParams, Events, Platform, ViewController } from 'ionic-angular';

import { ConfigService } from '@ngx-config/core';

import { IonicPage } from 'ionic-angular';
import { LanguageService } from '../../app/services/languages/language.service';
import { MdContent } from '../../app/models/md-content.model';
import { MdContentService } from '../../app/services/md/md-content.service';
import { TopMenuComponent } from '../components/top-menu/top-menu';
import { SongService } from '../../app/services/song/song.service';

/**
 * A page used for displaying markdown content.
 */

@IonicPage({
  name: 'content',
  segment: 'content/:id'
})
@Component({
  selector: 'page-content',
  templateUrl: 'content.html'
})
export class ContentPage /*implements OnDestroy*/ {

  errorMessage: string;
  appName: string;
  mdContent: MdContent;
  lang: String;
  songCategories: Array<string> = [];
  songCategory: string;
  songExample: string;

  constructor(
    public navCtrl: NavController,
    public params: NavParams,
    private mdContentService: MdContentService,
    renderer: Renderer,
    private userSettingsService: UserSettingsService,
    private config: ConfigService,
    private langService: LanguageService,
    public events: Events,
    private viewctrl: ViewController,
    public songService: SongService
  ) {
    const data = this.config.getSettings('staticPages.about');
    let fileID = this.params.get('id');
    this.mdContent = new MdContent({id: fileID, title: '...', content: null, filename: null});
    this.lang = 'sv';

    this.langService.getLanguage().subscribe((lang) => {
      this.lang = lang;
    });

    this.events.subscribe('language:change', () => {
      this.langService.getLanguage().subscribe((lang) => {
        this.lang = lang;
        if ( !String(fileID).includes(lang) ) {
          const tmpId = String(fileID).split('-')
          fileID = lang + '-' + tmpId[1] + '-' + tmpId[2];
        }
        this.getMdContent(fileID);
        this.songCategoriesConfig();
      });
    });

    this.events.publish('view:enter', 'content');

    if (!this.params.get('selectedItemInAccordion')) {
      this.searchTocItem();
    }
    this.songCategoriesConfig();
  }

  songCategoriesConfig() {
    try {
      this.songCategories = this.config.getSettings(`SongCategories.${this.lang}`);
    } catch (e) {
      this.songCategories = [];
    }
  }

  searchTocItem() {
    let playManTraditionPageInMusicAccordion = false;

    try {
      playManTraditionPageInMusicAccordion = this.config.getSettings('MusicAccordionShow.PlaymanTraditionPage');
    } catch (e) {
      playManTraditionPageInMusicAccordion = false;
    }

    // If playman tradition exists in musicaccordion
    // we don't have to search for it in table-of-contents-accordion component.
    // Instead we search for it in MusicAccordion
    let language = 'sv';
    this.langService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });

    let playmanTraditionPageID = '03-03';
    playmanTraditionPageID = `${language}-${playmanTraditionPageID}`;

    if (playManTraditionPageInMusicAccordion && this.params.get('id') === playmanTraditionPageID) {
      this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: 'playmanTraditionPage'});
    } else {
      this.events.publish('tableOfContents:findMarkdownTocItem', {
        markdownID: this.params.get('id')
      });
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('pageLoaded:content', {'title': this.mdContent.title});
    this.getMdContent(this.mdContent.id);
    this.events.publish('title-logo:setTitle', this.config.getSettings('app.page-title.' + this.lang));
  }

  getMdContent(fileID: string) {
    // console.log(`Calling getMdContent from content.ts ${fileID}`);
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {
              this.getSongsByType(text.content);
              this.getSongExample(text.content);
              this.mdContent.content = text.content;
            },
            error =>  {this.errorMessage = <any>error}
        );
  }

  getSongsByType(markdownText) {
    for (const category of this.songCategories) {
      if (markdownText.indexOf(`<!-- {songtype:"${category}"} -->`) !== -1) {
        // Fetch songs
        this.songCategory = category;
        break;
      }
    }
  }

  getSongExample(markdownText) {
    const songExample = markdownText.split('<!--SONGEXAMPLESTART--').pop().split('--SONGEXAMPLEEND-->')[0];
    if (songExample) {
      this.songExample = songExample;
    }
  }
}
