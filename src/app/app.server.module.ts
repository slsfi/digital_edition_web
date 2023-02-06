import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';

import { AppModule } from './app.module';

// Tell Ionic components how to render on the server
import { IonicServerModule } from '@ionic/angular-server';
import { DigitalEditionsApp } from './app.component';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { translateServerLoaderFactory } from './loaders/translate-server.loader';
import { TransferState } from '@angular/platform-browser';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    IonicServerModule,
    ServerTransferStateModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateServerLoaderFactory,
        deps: [TransferState]
      }
    }),
  ],
  bootstrap: [DigitalEditionsApp],
  // providers: [
  //   TranslateService
  // ]
})
export class AppServerModule {}
