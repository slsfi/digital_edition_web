import { Component } from '@angular/core';
import { NavController, NavParams, Events, ViewController } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { IonicPage } from 'ionic-angular';
import { LanguageService } from '../../app/services/languages/language.service';
import { MdContent } from '../../app/models/md-content.model';
import { MdContentService } from '../../app/services/md/md-content.service';
import { SongService } from '../../app/services/song/song.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { Subscription } from 'rxjs/Subscription';

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
  fileID: string;
  languageSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public params: NavParams,
    private mdContentService: MdContentService,
    private config: ConfigService,
    protected langService: LanguageService,
    public events: Events,
    private viewctrl: ViewController,
    public songService: SongService,
    private analyticsService: AnalyticsService
  ) {
    this.fileID = this.params.get('id');
    this.mdContent = new MdContent({id: this.fileID, title: '...', content: null, filename: null});
    this.languageSubscription = null;
    this.lang = this.config.getSettings('i18n.locale');

    this.langService.getLanguage().subscribe((lang) => {
      this.lang = lang;
    });

    if (!this.params.get('selectedItemInAccordion') || this.params.get('selectedItemInAccordion') === undefined) {
      this.searchTocItem();
    }
    this.songCategoriesConfig();
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('pageLoaded:content', {'title': this.mdContent.title});
    this.events.publish('title-logo:setTitle', this.config.getSettings('app.page-title.' + this.lang));
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Content');
  }

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadContent(lang);
      } else {
        this.langService.getLanguage().subscribe(language => {
          this.loadContent(language);
        });
      }
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    this.events.unsubscribe('aboutMarkdownTOC:loaded');
  }

  loadContent(lang: string) {
    if ( !String(this.fileID).includes(lang) ) {
      // The language has changed so the content needs to be reloaded
      this.fileID = lang + String(this.fileID).slice(String(this.fileID).indexOf('-'));
      // Update url with the new id
      let url = window.location.href;
      url = url.slice(0, url.lastIndexOf('/')) + '/';
      if (url.endsWith('/#/content/')) {
        url += this.fileID;
        history.pushState(null, null, url);
      }
      this.events.subscribe('aboutMarkdownTOC:loaded', (toc) => {
        this.events.publish('tableOfContents:findMarkdownTocItem', {
          markdownID: this.fileID
        });
      });
    }
    this.getMdContent(this.fileID);
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
    let language = this.config.getSettings('i18n.locale');
    this.langService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });

    let playmanTraditionPageID = '03-03';
    playmanTraditionPageID = `${language}-${playmanTraditionPageID}`;

    if (playManTraditionPageInMusicAccordion && this.fileID === playmanTraditionPageID) {
      this.events.publish('musicAccordion:SetSelected', {musicAccordionKey: 'playmanTraditionPage'});
    } else {
      // Wait for the About-markdownpages TOC to be loaded before proceeding to find markdown TOC item
      this.events.subscribe('aboutMarkdownTOC:loaded', (toc) => {
        this.events.publish('tableOfContents:findMarkdownTocItem', {
          markdownID: this.fileID
        });
      });
    }
  }

  doAnalytics( title ) {
    this.analyticsService.doPageView('Content - ' + title);
    this.analyticsService.doAnalyticsEvent('Content', 'Content - ' + title, title);
  }

  getMdContent(fileID: string) {
    // console.log(`Calling getMdContent from content.ts ${fileID}`);
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {
              this.getSongsByType(text.content);
              this.getSongExample(text.content);
              this.mdContent.content = text.content;
              this.doAnalytics(this.mdContent.id);
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
