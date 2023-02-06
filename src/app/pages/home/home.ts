import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { NavController } from '@ionic/angular';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { TextService } from 'src/app/services/texts/text.service';

/**
 * HomePage is the first page user sees.
 */

@Component({
  selector: 'home-page',
  templateUrl: 'home.html',
  styleUrls: ['home.scss']
})
export class HomePage {
  appName?: string;
  appSubtitle?: string;
  appMachineName: string;
  homeContent?: string;
  homeFooterContent?: string;
  imageOrientationPortrait: Boolean = false;
  imageOnRight: Boolean = false;
  titleOnImage: Boolean = false;
  showSimpleSearch: Boolean = false;
  showEditionList: Boolean = false;
  showFooter: Boolean = false;
  imageUrl = '';
  imageUrlStyle = '';
  portraitImageAltText = '';
  errorMessage?: string;
  initLanguage?: string;
  languageSubscription: Subscription | null;

  constructor(
    public navCtrl: NavController,
    private config: ConfigService,
    public translate: TranslateService,
    public languageService: LanguageService,
    private events: EventsService,
    private mdContentService: MdContentService,
    private userSettingsService: UserSettingsService,
    protected textService: TextService,
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.userSettingsService.temporarilyHideSplitPane();

    // Get config for front page image and text content
    try {
      this.imageOrientationPortrait = this.config.getSettings('frontpageConfig.imageOrientationIsPortrait');
    } catch (e) {
      this.imageOrientationPortrait = false;
    }
    try {
      this.imageOnRight = this.config.getSettings('frontpageConfig.imageOnRightIfPortrait');
    } catch (e) {
      this.imageOnRight = false;
    }
    try {
      this.titleOnImage = this.config.getSettings('frontpageConfig.siteTitleOnTopOfImageInMobileModeIfPortrait');
    } catch (e) {
      this.titleOnImage = false;
    }
    try {
      this.portraitImageAltText = this.config.getSettings('frontpageConfig.portraitImageAltText');
    } catch (e) {
      this.portraitImageAltText = 'front image';
    }
    try {
      this.showSimpleSearch = this.config.getSettings('frontpageConfig.showSimpleSearch');
    } catch (e) {
      this.showSimpleSearch = false;
    }
    try {
      this.showEditionList = this.config.getSettings('frontpageConfig.showEditionList');
    } catch (e) {
      this.showEditionList = false;
    }
    try {
      this.showFooter = this.config.getSettings('frontpageConfig.showFooter');
    } catch (e) {
      this.showFooter = false;
    }
    try {
      this.imageUrl = this.config.getSettings('frontpageConfig.imageUrl');
    } catch (e) {
      this.imageUrl = 'assets/images/frontpage-image-landscape.jpg';
    }

    // Get viewport width
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // Change front page image if viewport size max 900px and the image orientation is set to portrait
    if (vw <= 900 && this.imageOrientationPortrait) {
      try {
        const imageUrlMobile = this.config.getSettings('frontpageConfig.portraitImageUrlInMobileMode');
        if (imageUrlMobile !== '' && imageUrlMobile !== undefined && imageUrlMobile !== null) {
          this.imageUrl = imageUrlMobile;
        }
      } catch (e) {
      }
    }

    this.imageUrlStyle = `url(${this.imageUrl})`;
    this.languageSubscription = null;
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'home'});
    this.events.publishSelectedItemInMenu({
      menuID: 'home',
      component: 'home'
    });
    this.events.publishMusicAccordionReset(true);
  }

  ngOnInit() {
    this.languageSubscription = this.languageService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadContent(lang);
      } else {
        this.languageService.getLanguage().subscribe(language => {
          this.loadContent(language);
        });
      }
    });

    /* Update the variables in textService that keep track of which texts have
       recently been opened in page-read. The purpose of this is to cause
       texts that are cached in storage to be cleared upon the next visit
       to page-read after visiting home. */
    if (this.textService.previousReadViewTextId !== undefined
     && this.textService.readViewTextId !== undefined) {
      this.textService.previousReadViewTextId = this.textService.readViewTextId;
      this.textService.readViewTextId = '';
    }
  }

  loadContent(lang: string) {
    this.getMdContent(lang + '-01');
    this.getFooterMdContent(lang + '-06');
    this.appName = this.config.getSettings('app.name.' + lang);
    const subTitle = this.config.getSettings('app.subTitle1.' + lang);
    if ( subTitle !== '' ) {
      this.appSubtitle = this.config.getSettings('app.subTitle1.' + lang);
    } else {
      this.appSubtitle = '';
    }
    this.events.publishTitleLogoSetTitle(this.config.getSettings('app.page-title.' + lang));
  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {this.homeContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }

  getFooterMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {this.homeFooterContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }

}
