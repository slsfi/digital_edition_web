import { NgModule } from '@angular/core';
import { EditionsPage } from './editions';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { EditionsPageRoutingModule } from './editions-routing.module';
import { IonicModule } from '@ionic/angular';
import { MarkdownModule } from 'ngx-markdown';
import { ComponentsModule } from 'src/app/components/components.module';
import { DigitalEditionListModule } from 'src/app/components/digital-edition-list/digital-edition-list.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    EditionsPage
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    MarkdownModule.forRoot(),
    ComponentsModule,
    DigitalEditionListModule,
    EditionsPageRoutingModule
  ],
  entryComponents: [
    EditionsPage
  ],
  providers: [

  ]
})
export class EditionsPageModule { }
