import { Component } from '@angular/core';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';

@Component({
  selector: 'title-logo',
  templateUrl: 'title-logo.html',
  styleUrls: ['title-logo.scss']
})
export class TitleLogoComponent {

  public title?: string;
  public subtitle?: string;
  public siteLogoURL: string;
  public useMobileLogo: Boolean = false;
  constructor(
    private events: EventsService,
    public userSettingsService: UserSettingsService,
    private config: ConfigService,
    public languageService: LanguageService
  ) {
    try {
      this.siteLogoURL = this.config.getSettings('app.siteLogoURL') as any;
    } catch ( e ) {
      this.siteLogoURL = 'https://www.sls.fi';
    }

    this.registerEventListeners();
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.title = this.config.getSettings('app.page-title.' + lang) as any;
      this.subtitle = this.config.getSettings('app.page-title.' + lang) as any;
    });
  }

  ngOnInit() {
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (viewportWidth <= 820) {
      this.useMobileLogo = true;
    } else {
      this.useMobileLogo = false;
    }
  }

  registerEventListeners() {
    this.events.getTitleLogoSetTitle().subscribe((title: any) => {
      this.title = title;
    })
    this.events.getTitleLogoCollectionTitle().subscribe((subtitle: any) => {
      this.subtitle = subtitle;
    })
  }
  ngOnDestroy() {
    this.events.getTitleLogoSetTitle().unsubscribe();
    this.events.getTitleLogoCollectionTitle().unsubscribe();
  }
}
