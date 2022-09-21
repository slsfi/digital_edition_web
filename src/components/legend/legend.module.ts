import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { LegendComponent } from './legend';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/', '.json');
}

@NgModule({
  declarations: [LegendComponent],
  imports: [
    IonicModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    MarkdownModule
  ],
  exports: [LegendComponent]
})
export class LegendModule {}
