import { Component, Input, EventEmitter, Output } from '@angular/core';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { GenericSettingsService } from 'src/app/services/settings/generic-settings.service';
import { EventsService } from 'src/app/services/events/events.service';
import { ModalController, PopoverController } from '@ionic/angular';
import { UserSettingsPopoverPage } from 'src/pages/user-settings-popover/user-settings-popover';
import { SearchAppPage } from 'src/pages/search-app/search-app';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ReferenceDataModalPage } from 'src/app/modals/reference-data-modal/reference-data-modal';

/**
 * Generated class for the TopMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'top-menu',
  templateUrl: 'top-menu.html',
  styleUrls: ['top-menu.scss']
})
export class TopMenuComponent {
  @Input() splitPaneMobile?: boolean;
  @Input() splitPanePossible?: boolean;
  @Input() splitPaneOpen?: boolean;
  @Output() hamburgerMenuClick = new EventEmitter();

  public title?: string;
  public subtitle?: string;
  public showLogo?: boolean;
  public showHelpButton: boolean;
  public showViewToggle: boolean;
  public showTopURNButton: boolean;
  public showTopMusicButton: boolean;
  public showColAmount: string;
  public showTopElasticButton: boolean;
  public showTopSimpleSearchButton: boolean;
  public showTopContentButton: boolean;
  public showTopAboutButton: boolean;

  constructor(
    private events: EventsService,
    private popoverCtrl: PopoverController,
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    public genericSettingsService: GenericSettingsService,
    private modalController: ModalController,
    protected storage: StorageService,
  ) {
    this.registerEventListeners();
    this.showColAmount = 'col-8';

    try {
      this.showHelpButton = this.config.getSettings('app.showHelpButton') as any;
    } catch ( e ) {
      this.showHelpButton = true;
    }
    try {
      this.showViewToggle = this.config.getSettings('app.showViewToggle') as any;
    } catch ( e ) {
      this.showViewToggle = true;
    }
    try {
      this.showTopURNButton = this.config.getSettings('showURNButton.topMenu') as any;
    } catch ( e ) {
      try {
        this.showTopURNButton = this.config.getSettings('app.showTopURNButton') as any;
      } catch ( e ) {
        this.showTopURNButton = true;
      }
    }

    try {
      this.showTopElasticButton = this.config.getSettings('app.showTopElasticButton') as any;
    } catch ( e ) {
      this.showTopElasticButton = true;
    }

    try {
      this.showTopSimpleSearchButton = this.config.getSettings('app.showTopSimpleSearchButton') as any;
    } catch ( e ) {
      this.showTopSimpleSearchButton = true;
    }

    try {
      this.showTopContentButton = this.config.getSettings('app.showTopContentButton') as any;
    } catch ( e ) {
      this.showTopContentButton = true;
    }

    try {
      this.showTopAboutButton = this.config.getSettings('app.showTopAboutButton') as any;
    } catch ( e ) {
      this.showTopAboutButton = true;
    }

    try {
      this.showTopMusicButton = this.config.getSettings('app.showTopMusicButton') as any;
    } catch ( e ) {
      this.showTopMusicButton = true;
    }
    this.events.getTitleLogoShow().subscribe((show: any) => {
      this.storage.set('showLogo', show);
      this.getShowLogo();
    })
    this.getShowLogo();
  }

  ngOnDestroy() {
    this.events.getTitleLogoShow().complete();
    this.events.getTitleLogoSetTitle().complete();
    this.events.getTitleLogoSetSubTitle().complete();
  }

  getShowLogo() {
    this.storage.get('showLogo').then((showLogo) => {
      this.showLogo = showLogo;
    });
  }

  help() {
    this.events.publishTopMenuHelp();
  }

  async searchApp() {
    const modal = await this.modalController.create({
      component: SearchAppPage,
      cssClass: 'foo',
      componentProps: {
        'data': true,
      }
    });
    modal.present();
  }

  public elasticSearch() {
    this.events.publishTopMenuElasticSearch();
    this.storage.set('showLogo', false);
  }

  public front() {
    this.events.publishTopMenuFront();
    this.storage.set('showLogo', true);
  }

  public content() {
    this.events.publishTopMenuContent();
    this.storage.set('showLogo', true);
  }

  public about() {
    this.events.publishTopMenuAbout();
    this.storage.set('showLogo', false);
  }

  public music() {
    this.events.publishTopMenuMusic();
    this.storage.set('showLogo', false);
  }

  public toggleSplitPane() {
    this.hamburgerMenuClick.emit();
  }

  public async showUserSettingsPopover(myEvent: any) {
    const popover = await this.popoverCtrl.create({
      component: UserSettingsPopoverPage,
    });
    popover.present(myEvent);
  }
  private registerEventListeners() {
    this.events.getTitleLogoSetTitle().subscribe((title: any) => {
      this.title = title;
    });
    this.events.getTitleLogoSetSubTitle().subscribe((subTitle: any) => {
      this.subtitle = subTitle;
    });
  }
  public async showReference(event: any) {
    // Get URL of Page and then the URI
    const modal = await this.modalController.create({
      component: ReferenceDataModalPage,
      id: document.URL,
      componentProps: {
        type: 'reference',
        origin: 'top-menu',
      }
    });
    modal.present();
  }
}
