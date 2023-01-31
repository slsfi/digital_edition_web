import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService/*, TranslatePipe*/ } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventsService } from '../events/events.service';
import { ConfigService } from '../config/core/config.service';
import { StorageService } from '../storage/storage.service';


@Injectable()
export class LanguageService {

  private _language: string | null = null;
  private _langChangeEnabled: boolean;
  private languageSubject: BehaviorSubject<string>;

  constructor(
    public translate: TranslateService,
    public storage: StorageService,
    private config: ConfigService,
    private events: EventsService
  ) {
    translate.addLangs(this.config.getSettings('i18n.languages') as Array<string>);
    translate.setDefaultLang(this.config.getSettings('i18n.locale') as string);

    this._langChangeEnabled = this.config.getSettings('i18n.enableLanguageChanges') as boolean;

    this.languageSubject = new BehaviorSubject<string>(translate.currentLang);

    this.getLanguage().subscribe((lang: string) => {
      // console.log('initializing language service, lang:', lang);
      this.setLanguage(lang);
      this.storage.set('language', translate.currentLang);
      this._language = translate.currentLang;
    });

    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      const prevLang = this._language;
      this.storage.set('language', translate.currentLang);
      this._language = translate.currentLang;
      if (this._language !== undefined && prevLang !== this._language) {
        this.updateLanguageSubject(this._language);
      }
    });
  }

  public getLanguage(): Observable<string> {
    const translate = this.translate;
    const storage = this.storage;
    const _language = this._language;
    const that = this as any;
    return Observable.create(function (subscriber: any) {
      if (!that._langChangeEnabled) {
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
          const availableLanguages: string[] = that.config.getSettings('i18n.languages');
          subscriber.next(browserLang?.match(availableLanguages.join('|')) ? browserLang : translate.getDefaultLang())
          subscriber.complete();
        }
      }).catch(() => {
          that.lang = that.config.getSettings('i18n.locale');
          subscriber.next(that.lang);
          subscriber.complete();
      });
    }.bind(this));
  }

  public setLanguage(lang: string) {
    this.translate.use(lang).subscribe(
      res => {
        this.events.publishLanguageStaticChange();
        },
        err => console.error(err)
    );
  }

  public get(text: string) {
    return this.translate.get(text);
  }

  get language(): string {
    return this._language as string;
  }

  set language(lang: string) {
    // validate that it is in supported languages...
    this.setLanguage(lang);
  }

  get languages(): Array<string> {
    return this.translate.getLangs();
  }

  updateLanguageSubject(newLanguage: string) {
    this.languageSubject.next(newLanguage);
  }

  languageSubjectChange(): Observable<string> {
    return this.languageSubject.asObservable();
  }
}
