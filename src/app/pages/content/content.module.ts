import { NgModule } from '@angular/core';
import { ContentPage } from './content';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ContentPageRoutingModule } from './content-routing.module';
import { MarkdownModule } from 'ngx-markdown';
import { ComponentsModule } from 'src/app/components/components.module';
import { HtmlContentService } from 'src/app/services/html/html-content.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { IonicModule, NavParams } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      ContentPage
    ],
    imports: [
      CommonModule,
      IonicModule,
      FormsModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule,
      MarkdownModule.forRoot(),
      ContentPageRoutingModule,
    ],
    entryComponents: [
      ContentPage
    ],
    providers: [
        HtmlContentService,
        MdContentService,
        NavParams
    ]
  })
  export class ContentPageModule {}
