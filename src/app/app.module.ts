import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import * as Sentry from '@sentry/browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicStorageModule } from '@ionic/storage-angular';

import { DigitalEditionsApp } from './app.component';
import { EventsService } from './services/events/events.service';
import { HtmlContentService } from './services/html/html-content.service';
import { MdContentService } from './services/md/md-content.service';
import { TextService } from './services/texts/text.service';
import { TextCacheService } from './services/texts/text-cache.service';
import { LanguageService } from './services/languages/language.service';
import { ReadPopoverService } from './services/settings/read-popover.service';
import { CommentService } from './services/comments/comment.service';
import { CommentCacheService } from './services/comments/comment-cache.service';
import { CommonFunctionsService } from './services/common-functions/common-functions.service';
import { SemanticDataService } from './services/semantic-data/semantic-data.service';
import { ReferenceDataService } from './services/reference-data/reference-data.service';
import { UserSettingsService } from './services/settings/user-settings.service';
import { GenericSettingsService } from './services/settings/generic-settings.service';
import { AnalyticsService } from './services/analytics/analytics.service';
import { MetadataService } from './services/metadata/metadata.service';
import { GalleryService } from './services/gallery/gallery.service';
import { SongService } from './services/song/song.service';
import { TooltipService } from './services/tooltips/tooltip.service';
import { SearchDataService } from './services/search/search-data.service';
import { CommonModule } from '@angular/common';
import { PipesModule } from 'src/pipes/pipes.module';
import { DigitalEditionListModule } from './components/digital-edition-list/digital-edition-list.module';
import { ComponentsModule } from './components/components.module';
import { MarkdownModule } from 'ngx-markdown';
import { MathJaxModule } from './components/math-jax/math-jax.module';
import { ConfigLoader } from './services/config/core/config.loader';
import { ConfigHttpLoader } from './services/config/http-loader/http-loader';
import { ConfigModule } from './services/config/core/config.module';
import { CommentModalPage } from './modals/comment-modal/comment-modal';
import { SemanticDataModalPage } from './modals/semantic-data-modal/semantic-data-modal';
import { ReferenceDataModalPage } from './modals/reference-data-modal/reference-data-modal';
import { DownloadTextsModalPage } from './modals/download-texts-modal/download-texts-modal';
import { SharePopoverPageModule } from './modals/share-popover/share-popover.module';
import { FacsimileZoomPageModule } from './modals/facsimile-zoom/facsimile-zoom.module';
import { FacsimileZoomModalPage } from './modals/facsimile-zoom/facsimile-zoom';
import { SharePopoverPage } from './modals/share-popover/share-popover';
import { IllustrationPageModule } from './modals/illustration/illustration.module';
import { IllustrationPage } from './modals/illustration/illustration';
import { SearchAppPageModule } from 'src/pages/search-app/search-app.module';
import { UserSettingsPopoverPageModule } from 'src/pages/user-settings-popover/user-settings-popover.module';
import { PersonSearchPageModule } from './pages/person-search/person-search.module';
import { ReadPopoverPageModule } from './modals/read-popover/read-popover.module';
import { SearchAppPage } from 'src/pages/search-app/search-app';
import { ReadPopoverPage } from './modals/read-popover/read-popover';
import { UserSettingsPopoverPage } from 'src/pages/user-settings-popover/user-settings-popover';

Sentry.init({
  dsn: 'https://765ecffd6ada4d409b6d77802ca6289d@sentry.io/1229311'
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error: any) {
    const eventId = Sentry.captureException(error.originalError || error);
  }
}

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function createConfigLoader(http: HttpClient): ConfigLoader {
  return new ConfigHttpLoader(http, 'config.json');
  // return new ConfigHttpLoader(http, 'assets/config.json');
}

@NgModule({
  declarations: [
    DigitalEditionsApp,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage,
    DownloadTextsModalPage,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    IonicModule.forRoot(
      {
        mode: 'md',
        backButtonText: '',
      }
    ),
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ConfigModule.forRoot({
      provide: ConfigLoader,
      useFactory: (createConfigLoader),
      deps: [HttpClient]
    }),
    IonicStorageModule.forRoot(),
    SharePopoverPageModule,
    SearchAppPageModule,
    CommonModule,
    UserSettingsPopoverPageModule,
    ComponentsModule,
    PipesModule,
    DigitalEditionListModule,
    PersonSearchPageModule,
    FacsimileZoomPageModule,
    ReadPopoverPageModule,
    IllustrationPageModule,
    MathJaxModule,
    MarkdownModule.forRoot({ loader: HttpClient }),
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
    CommonFunctionsService,
    SemanticDataService,
    ReferenceDataService,
    SearchDataService,
    TooltipService,
    UserSettingsService,
    GenericSettingsService,
    SongService,
    GalleryService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AnalyticsService,
    MetadataService,
    EventsService,
  ],
  bootstrap: [DigitalEditionsApp],
  entryComponents: [
    DigitalEditionsApp,
    ReadPopoverPage,
    UserSettingsPopoverPage,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage,
    FacsimileZoomModalPage,
    DownloadTextsModalPage,
    IllustrationPage,
    SearchAppPage,
    SharePopoverPage,
  ]
})
export class AppModule {}
