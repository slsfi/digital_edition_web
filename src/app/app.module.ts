import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import * as Sentry from '@sentry/browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { DigitalEditionsApp } from './app.component';
import { CommentModalPage } from 'src/pages/comment-modal/comment-modal';
import { SemanticDataModalPage } from 'src/pages/semantic-data-modal/semantic-data-modal';
import { ReferenceDataModalPage } from 'src/pages/reference-data-modal/reference-data-modal';
import { EventsService } from './services/events/events.service';
import { DownloadTextsModalPage } from 'src/pages/download-texts-modal/download-texts-modal';
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
import { SharePopoverPage } from 'src/pages/share-popover/share-popover';
import { SharePopoverPageModule } from 'src/pages/share-popover/share-popover.module';
import { SearchAppPage } from 'src/pages/search-app/search-app';
import { SearchAppPageModule } from 'src/pages/search-app/search-app.module';
import { CommonModule } from '@angular/common';
import { UserSettingsPopoverPageModule } from 'src/pages/user-settings-popover/user-settings-popover.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DigitalEditionListModule } from './components/digital-edition-list/digital-edition-list.module';
import { ComponentsModule } from './components/components.module';
import { ReadPopoverPage } from 'src/pages/read-popover/read-popover';
import { ReadPopoverPageModule } from 'src/pages/read-popover/read-popover.module';

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

// TODO Config loader

@NgModule({
  declarations: [
    DigitalEditionsApp,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage,
    DownloadTextsModalPage,
  ],
  // TODO imports are missing many things
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
    SharePopoverPageModule,
    SearchAppPageModule,
    CommonModule,
    UserSettingsPopoverPageModule,
    ComponentsModule,
    PipesModule,
    DigitalEditionListModule,
    // PersonSearchPageModule
    // FacsimileZoomPageModule
    ReadPopoverPageModule,
    // UserSettingsPopoverPageModule
    // IllustrationPageModule
    // SearchAppPageModule
    // SharePopoverPageModule
    // MathJaxModule
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
    // UserSettingsPopoverPage,
    CommentModalPage,
    SemanticDataModalPage,
    ReferenceDataModalPage,
    // FacsimileZoomModalPage,
    DownloadTextsModalPage,
    // IllustrationPage,
    SearchAppPage,
    SharePopoverPage,
  ]
})
export class AppModule {}
