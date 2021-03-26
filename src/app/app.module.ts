import { SearchAppPageModule } from './../pages/search-app/search-app.module';
import { IllustrationPageModule } from './../pages/illustration/illustration.module';
import { ErrorHandler, NgModule, Injectable } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HttpModule, Http } from '@angular/http';
import { BrowserModule, Title } from '@angular/platform-browser';

import { DigitalEditionsApp } from './app.component';



import { ReadPopoverPage } from '../pages/read-popover/read-popover';
import { CommentModalPage } from '../pages/comment-modal/comment-modal';
import { SemanticDataModalPage } from '../pages/semantic-data-modal/semantic-data-modal';
import { ReferenceDataModalPage } from '../pages/reference-data-modal/reference-data-modal';
import { FacsimileZoomModalPage } from '../pages/facsimile-zoom/facsimile-zoom';

import { ConfigLoader, ConfigModule } from '@ngx-config/core';
import { ConfigHttpLoader } from '@ngx-config/http-loader';
import { ComponentsModule } from '../components/components.module';
import { HtmlContentService } from './services/html/html-content.service';
import { TextService } from './services/texts/text.service';
import { TextCacheService } from './services/texts/text-cache.service';
import { LanguageService } from './services/languages/language.service';
import { ReadPopoverService } from './services/settings/read-popover.service';
import { CommentService } from './services/comments/comment.service';
import { CommentCacheService } from './services/comments/comment-cache.service';
import { SemanticDataService } from './services/semantic-data/semantic-data.service';
import { ReferenceDataService } from './services/reference-data/reference-data.service';
import { SearchDataService } from './services/search/search-data.service';
import { TooltipService } from './services/tooltips/tooltip.service';
import { TableOfContentsModule } from '../components/table-of-contents/table-of-contents.module';
import { DigitalEditionListModule } from '../components/digital-edition-list/digital-edition-list.module';
import { MdContentService } from './services/md/md-content.service';
import { MarkdownModule } from 'angular2-markdown';
import { PipesModule } from '../pipes/pipes.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { UserSettingsService } from './services/settings/user-settings.service';
import { UserSettingsPopoverPage } from '../pages/user-settings-popover/user-settings-popover';
import { IllustrationPage } from '../pages/illustration/illustration';
import { SearchAppPage } from '../pages/search-app/search-app';
import { SocialSharing } from '@ionic-native/social-sharing';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ShareButtonsModule } from 'ngx-sharebuttons';
import { GenericSettingsService } from './services/settings/generic-settings.service';
import { SongService } from './services/song/song.service';
import { SharePopoverPage } from '../pages/share-popover/share-popover';
import { SharePopoverPageModule } from '../pages/share-popover/share-popover.module';
import { PinchZoomModule } from 'ngx-pinch-zoom';
import { FacsimileZoomPageModule } from '../pages/facsimile-zoom/facsimile-zoom.module';
import { PersonSearchPageModule } from '../pages/person-search/person-search.module';
import { UserSettingsPopoverPageModule } from '../pages/user-settings-popover/user-settings-popover.module';
import { ReadPopoverPageModule } from '../pages/read-popover/read-popover.module';
import { TutorialService } from './services/tutorial/tutorial.service';
import * as Sentry from '@sentry/browser';
import { GalleryService } from './services/gallery/gallery.service';

Sentry.init({
  dsn: 'https://765ecffd6ada4d409b6d77802ca6289d@sentry.io/1229311'
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
    const eventId = Sentry.captureException(error.originalError || error);
  }
}


export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function createConfigLoader(http: HttpClient): ConfigLoader {
  return new ConfigHttpLoader(http, 'config.json');
}

@NgModule({
  declarations: [
    DigitalEditionsApp,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage
  ],
  imports: [
  BrowserModule,
    HttpModule,
    HttpClientModule,
    PinchZoomModule,
    ShareButtonsModule.forRoot(),
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    TableOfContentsModule,
    ConfigModule.forRoot({
      provide: ConfigLoader,
      useFactory: (createConfigLoader),
      deps: [HttpClient]
    }),
    IonicModule.forRoot(
      DigitalEditionsApp, {
      mode: 'md',
      backButtonText: '',
      tabsPlacement: 'bottom',
      links: [
        { component: DigitalEditionsApp, name: 'Home', segment: 'home' }
      ]
    }),
    ComponentsModule,
    DigitalEditionListModule,
    PipesModule,
    PersonSearchPageModule,
    FacsimileZoomPageModule,
    ReadPopoverPageModule,
    UserSettingsPopoverPageModule,
    IllustrationPageModule,
    SearchAppPageModule,
    SharePopoverPageModule
    // PdfViewerModule,
  ],
  providers: [
    HtmlContentService,
    MdContentService,
    TextService,
    TextCacheService,
    TranslateService,
    LanguageService,
    ReadPopoverService,
    Title,
    CommentService,
    CommentCacheService,
    SemanticDataService,
    ReferenceDataService,
    SearchDataService,
    TooltipService,
    UserSettingsService,
    SocialSharing,
    GenericSettingsService,
    SplashScreen,
    SongService,
    TutorialService,
    GalleryService,
    { provide: ErrorHandler, useClass: ErrorHandler }
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    DigitalEditionsApp,
    ReadPopoverPage,
    UserSettingsPopoverPage,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage,
    FacsimileZoomModalPage,
    IllustrationPage,
    SearchAppPage,
    SharePopoverPage
  ]
})
export class AppModule { }
