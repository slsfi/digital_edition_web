import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, NavParams } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MdContent } from 'src/app/models/md-content.model';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { SongService } from 'src/app/services/song/song.service';

/**
 * A page used for displaying markdown content.
 */

// @IonicPage({
//   name: 'content',
//   segment: 'content/:id'
// })
@Component({
  selector: 'page-content',
  templateUrl: 'content.html'
})
export class ContentPage /*implements OnDestroy*/ {

  errorMessage?: string;
  appName?: string;
  mdContent?: MdContent;
  lang: string;
  songCategories: Array<string> = [];
  songCategory?: string;
  songExample?: string;
  fileID?: string;
  languageSubscription: Subscription | null;

  constructor(
    public navCtrl: NavController,
    public params: NavParams,
    private mdContentService: MdContentService,
    private config: ConfigService,
    protected langService: LanguageService,
    public events: EventsService,
    public songService: SongService,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
  ) {
    this.languageSubscription = null;
    this.lang = this.config.getSettings('i18n.locale');

    this.langService.getLanguage().subscribe((lang) => {
      this.lang = lang;
    });

    this.songCategoriesConfig();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (this.fileID !== params['id']) {
        this.fileID = params['id'];
        this.mdContent = new MdContent({id: this.fileID, title: '...', content: null, filename: null});
        this.loadContent(this.lang);
        console.log(this.mdContent);
      }

      if (!params['selectedItemInAccordion'] || params['selectedItemInAccordion'] === undefined) {
        this.searchTocItem();
      }
    });

    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadContent(lang);
      }
    });
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishPageLoadedContent({'title': this.mdContent?.title});
    this.events.publishTitleLogoSetTitle(this.config.getSettings('app.page-title.' + this.lang));
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Content');
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    this.events.getAboutMarkdownTOCLoaded().unsubscribe();
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
        history.pushState(null, '', url);
      }
      this.events.getAboutMarkdownTOCLoaded().subscribe((toc) => {
        this.events.publishTableOfContentsFindMarkdownTocItem({
          markdownID: this.fileID
        });
      });
    }
    if (this.fileID) {
      this.getMdContent(this.fileID);
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
    let language = this.config.getSettings('i18n.locale');
    this.langService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });

    let playmanTraditionPageID = '03-03';
    playmanTraditionPageID = `${language}-${playmanTraditionPageID}`;

    if (playManTraditionPageInMusicAccordion && this.fileID === playmanTraditionPageID) {
      this.events.publishMusicAccordionSetSelected({musicAccordionKey: 'playmanTraditionPage'});
    } else {
      // Wait for the About-markdownpages TOC to be loaded before proceeding to find markdown TOC item
      this.events.getAboutMarkdownTOCLoaded().subscribe((toc) => {
        this.events.publishTableOfContentsFindMarkdownTocItem({
          markdownID: this.fileID
        });
      });
    }
  }

  doAnalytics( title: any ) {
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
              if (this.mdContent) {
                this.mdContent.content = text.content;
                this.doAnalytics(this.mdContent.id);
              }
            },
            error =>  {this.errorMessage = <any>error}
        );
  }

  getSongsByType(markdownText: any) {
    for (const category of this.songCategories) {
      if (markdownText.indexOf(`<!-- {songtype:"${category}"} -->`) !== -1) {
        // Fetch songs
        this.songCategory = category;
        break;
      }
    }
  }

  getSongExample(markdownText: any) {
    const songExample = markdownText.split('<!--SONGEXAMPLESTART--').pop().split('--SONGEXAMPLEEND-->')[0];
    if (songExample) {
      this.songExample = songExample;
    }
  }
}
