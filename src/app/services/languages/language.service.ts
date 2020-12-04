import { Events } from 'ionic-angular';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';
import { LangChangeEvent, TranslateService/*, TranslatePipe*/ } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';


@Injectable()
export class LanguageService {

  private _language: string;
  private _langChangeEnabled: false;

  constructor(public translate: TranslateService,
              public storage: Storage,
              private config: ConfigService,
              private events: Events) {
    translate.addLangs(this.config.getSettings('i18n.languages'));
    translate.setDefaultLang(this.config.getSettings('i18n.locale'));

    this._langChangeEnabled = this.config.getSettings('i18n.enableLanguageChanges');

    this.getLanguage().subscribe((lang: string) => {
      this.setLanguage(lang);
      this.storage.set('language', translate.currentLang);
      this._language = translate.currentLang;
    });

    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.storage.set('language', translate.currentLang);
      this._language = translate.currentLang;
    });
  }

  public getLanguage(): Observable<string> {
    const translate = this.translate;
    const storage = this.storage;
    const _language = this._language;
    return Observable.create(function (subscriber) {
      if (!this._langChangeEnabled) {
        subscriber.next(translate.getDefaultLang());
        subscriber.complete();
        return;
      }

      if (_language) {
        subscriber.next(_language);
        subscriber.complete();
        return;
      }

      storage.get('language').then((lang) => {
        if (lang) {
          subscriber.next(lang);
          subscriber.complete();
        } else {
          const browserLang = translate.getBrowserLang();
          subscriber.next(browserLang.match(/sv|fi/) ? browserLang : translate.getDefaultLang())
          subscriber.complete();
        }
      }).catch(() => {
          this.lang = this.config.getSettings('i18n.locale');
          subscriber.next(this.lang);
        subscriber.complete();
      });
    }.bind(this));
  }

  public setLanguage(lang: string) {
    this.translate.use(lang).subscribe(
      res => {
        this.events.publish('language:change');
        this.events.publish('language-static:change');
        },
        err => console.error(err)
    );
  }

  public get(text: string) {
    return this.translate.get(text);
  }

  get language(): string {
    return this._language;
  }

  set language(lang: string) {
    // validate that it is in supported languages...
    this.setLanguage(lang);
  }

  get languages(): Array<string> {
    return this.translate.getLangs();
  }
}
