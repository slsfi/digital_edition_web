import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

/**
 * List of collections.
 */

// @IonicPage({
//   segment: 'publications'
// })
@Component({
  selector: 'editions-page',
  templateUrl: 'editions.html',
  styleUrls: ['editions.scss']
})
export class EditionsPage {
  selectedItem: any;
  appName?: string;
  readContent?: string;
  errorMessage?: string;

  constructor(
    public navCtrl: NavController,
    private config: ConfigService,
    private mdContentService: MdContentService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: EventsService,
    public userSettingsService: UserSettingsService,
    public platform: Platform,
    private route: ActivatedRoute,
  ) {
    // If we navigated to this page, we will have an item available as a nav param
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedItem = params['item'];
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem(true);
    this.events.publishMusicAccordionReset(true);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.getMdContent(lang + '-02');
      this.appName = this.config.getSettings('app.name.' + lang);
      this.events.publishTitleLogoSetTitle(this.config.getSettings('app.page-title.' + lang));
      this.events.publishTitleLogoSetSubTitle('Digitala verk');
    });
    this.events.publishPageLoadedCollections({'title': 'Editions'});
  }

  getMdContent(fileID: string) {
    // console.log('calling getMdContent from editions.ts');
    this.mdContentService.getMdContent(fileID)
      .subscribe(
        text => { this.readContent = text.content.trim(); },
        error => { this.errorMessage = <any>error }
      );
  }
}
