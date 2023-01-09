import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MobilePagesListPage } from './mobile-pages-list';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MobilePagesListPage
  ],
  imports: [
    IonicPageModule.forChild(MobilePagesListPage),
    HttpClientModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule
  ],
})
export class MobilePagesListPageModule {}
