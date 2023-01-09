import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EditionsPage } from './editions';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { DigitalEditionListModule } from '../../components/digital-edition-list/digital-edition-list.module';
import { HttpClient } from '@angular/common/http';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    EditionsPage
  ],
  imports: [
    IonicPageModule.forChild(EditionsPage),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    MarkdownModule.forRoot(),
    ComponentsModule,
    DigitalEditionListModule
  ],
  entryComponents: [
    EditionsPage
  ],
  providers: [

  ]
})
export class EditionsPageModule { }
