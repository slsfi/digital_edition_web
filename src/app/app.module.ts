import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    TranslateService
  ],
  bootstrap: [DigitalEditionsApp],
})
export class AppModule {}
