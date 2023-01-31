import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UserSettingsService {

  private _splitPaneOpen = false;
  private _splitPanePossible = true;
  private _mode?: string;
  private _language?: string;

  constructor(
    private platform: Platform,
    private storage: StorageService,
  ) {

    this.detectPlatform();
    // this.detectSplitPane();
  }

  detectPlatform() {
    this.storage.get('mode').then((mode) => {
      // mode is either desktop or mobile
      if (mode) {
        this._mode = mode;
      } else {
        if (this.platform.is('desktop') || this.platform.is('tablet')) {
          this._mode = 'desktop';
        } else {
          this._mode = 'mobile';
        }
      }
    });
  }

  setAuto() {
    this._mode = 'auto';
    this.storage.set('mode', 'auto');
  }

  isAuto() {
    return this._mode === 'auto';
  }

  setMobile() {
    this._mode = 'mobile';
    this.storage.set('mode', 'mobile');
  }

  isMobile() {
    if (this._mode === 'auto') {
      return this.platform.is('mobile')
    } else {
      return this._mode === 'mobile';
    }
  }

  setDesktop() {
    this._mode = 'desktop';
    this.storage.set('mode', 'desktop');
  }

  isTablet() {
    return this.platform.is('tablet');
  }

  isDesktop() {
    if (this._mode === 'auto') {
      return this.platform.is('desktop') || this.platform.is('tablet');
    } else {
      return this._mode === 'desktop';
    }
  }

  setReadFocus() {
    this._mode = 'read';
    this.storage.set('mode', 'read');
  }

  isReadFocus() {
    return this._mode === 'read';
  }

  set mode(mode: string) {
    switch (mode) {
      case 'mobile':
        this.setMobile();
        break;
      case 'desktop':
        this.setDesktop();
        break;
      case 'read':
        this.setReadFocus();
        break;
      case 'auto':
        this.setAuto();
        break;
    }
  }

  get mode(): string {
    return this._mode as string
  }

  get splitPaneOpen(): boolean {
    if (this.splitPanePossible) {
        return this._splitPaneOpen;
    } else {
      return false;
    }
  }


  set splitPaneOpen(maybe: boolean) {
    this._splitPaneOpen = maybe;
    // console.log(this._splitPaneOpen);
    this.storage.set('splitPane', maybe);
  }

  set splitPanePossible(maybe: boolean) {
    this._splitPanePossible = maybe;
  }

  get splitPanePossible(): boolean {
    return this._splitPanePossible;
  }

  temporarilyHideSplitPane() {
    this._splitPaneOpen = false;
  }

}
