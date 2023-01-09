import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Events, PopoverController, ModalController } from 'ionic-angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserSettingsPopoverPage } from '../../pages/user-settings-popover/user-settings-popover';
import { ConfigService } from '@ngx-config/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { SearchAppPage } from '../../pages/search-app/search-app';
import { ReferenceDataModalPage } from '../../pages/reference-data-modal/reference-data-modal';
import { Storage } from '@ionic/storage';
import { GenericSettingsService } from '../../app/services/settings/generic-settings.service';

/**
 * Generated class for the TopMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'top-menu',
  templateUrl: 'top-menu.html'
})
export class TopMenuComponent {
  @Input() splitPaneMobile?: boolean;
  @Input() splitPanePossible?: boolean;
  @Input() splitPaneOpen?: boolean;
  @Output() hamburgerMenuClick = new EventEmitter();

  public title: string;
  public subtitle: string;
  public showLogo: boolean;
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
    private events: Events,
    private popoverCtrl: PopoverController,
    private config: ConfigService,
    private userSettingsService: UserSettingsService,
    private genericSettingsService: GenericSettingsService,
    private modalController: ModalController,
    protected storage: Storage,
  ) {
    this.registerEventListeners();
    this.showColAmount = 'col-8';

    try {
      this.showHelpButton = this.config.getSettings('app.showHelpButton');
    } catch ( e ) {
      this.showHelpButton = true;
    }
    try {
      this.showViewToggle = this.config.getSettings('app.showViewToggle');
    } catch ( e ) {
      this.showViewToggle = true;
    }
    try {
      this.showTopURNButton = this.config.getSettings('showURNButton.topMenu');
    } catch ( e ) {
      try {
        this.showTopURNButton = this.config.getSettings('app.showTopURNButton');
      } catch ( e ) {
        this.showTopURNButton = true;
      }
    }

    try {
      this.showTopElasticButton = this.config.getSettings('app.showTopElasticButton');
    } catch ( e ) {
      this.showTopElasticButton = true;
    }

    try {
      this.showTopSimpleSearchButton = this.config.getSettings('app.showTopSimpleSearchButton');
    } catch ( e ) {
      this.showTopSimpleSearchButton = true;
    }

    try {
      this.showTopContentButton = this.config.getSettings('app.showTopContentButton');
    } catch ( e ) {
      this.showTopContentButton = true;
    }

    try {
      this.showTopAboutButton = this.config.getSettings('app.showTopAboutButton');
    } catch ( e ) {
      this.showTopAboutButton = true;
    }

    try {
      this.showTopMusicButton = this.config.getSettings('app.showTopMusicButton');
    } catch ( e ) {
      this.showTopMusicButton = true;
    }
    this.events.subscribe('title-logo:show', (show) => {
      this.storage.set('showLogo', show);
      this.getShowLogo();
    });
    this.getShowLogo();
  }

  ngOnDestroy() {
    this.events.unsubscribe('title-logo:show');
    this.events.unsubscribe('title-logo:setTitle');
    this.events.unsubscribe('title-logo:setSubTitle');
  }

  getShowLogo() {
    this.storage.get('showLogo').then((showLogo) => {
      this.showLogo = showLogo;
    });
  }

  help() {
    this.events.publish('topMenu:help');
  }

  searchApp() {
    const modal = this.modalController.create(SearchAppPage,
      {'data': true},
      { cssClass: 'foo' }
    );
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  public elasticSearch() {
    this.events.publish('topMenu:elasticSearch');
    this.storage.set('showLogo', false);
  }

  public front() {
    this.events.publish('topMenu:front');
    this.storage.set('showLogo', true);
  }

  public content() {
    this.events.publish('topMenu:content');
    this.storage.set('showLogo', true);
  }

  public about() {
    this.events.publish('topMenu:about');
    this.storage.set('showLogo', false);
  }

  public music() {
    this.events.publish('topMenu:music');
    this.storage.set('showLogo', false);
  }

  public toggleSplitPane() {
    this.hamburgerMenuClick.emit();
  }

  public showUserSettingsPopover(myEvent) {
    const popover = this.popoverCtrl.create(UserSettingsPopoverPage);
    popover.present({
      ev: myEvent
    });
  }
  private registerEventListeners() {
    this.events.subscribe('title-logo:setTitle', (title) => {
      this.title = title;
    });
    this.events.subscribe('title-logo:setSubTitle', (subTitle) => {
      this.subtitle = subTitle;
    });
  }
  private showReference(event) {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference', origin: 'top-menu'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }
}
