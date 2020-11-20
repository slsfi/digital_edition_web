import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoverPage } from './cover';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { HttpClient } from '@angular/common/http';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    CoverPage,
  ],
  imports: [
    IonicPageModule.forChild(CoverPage),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ComponentsModule,
    MarkdownModule.forRoot(),
  ],
})
export class CoverPageModule {}
