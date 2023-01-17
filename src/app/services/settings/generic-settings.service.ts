import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';

@Injectable()
export class GenericSettingsService {

  constructor(
    private config: ConfigService,
  ) {
  }

  appName() {
    return this.config.getSettings('app.machineName');
  }

  /**
   * This method is used to check if an item should be displayed in a project.
   * Settings can be found in config.json
   * @param settingPath - path for json object key
   */
  show(settingPath: any) {
    try {
      return this.config.getSettings('show.' + settingPath);
    } catch (e) {
      return null;
    }
  }

  /**
   * This can be used to hide back button on certain pages.
   * Example: <ion-navbar hideBackButton="genericSettingsService.hideTopMenuBackButton('TopMenu')">
   * @param settingPath - path for json object key
   */
  hideTopMenuBackButton(settingPath: any) {
    try {
      return this.config.getSettings(`HideBackButton.${settingPath}`);
    } catch (e) {
      return false;
    }
  }

}
