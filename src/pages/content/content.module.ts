import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ContentPage } from './content';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { HtmlContentService } from '../../app/services/html/html-content.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { MarkdownModule } from 'angular2-markdown';
import { HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      ContentPage
    ],
    imports: [
      IonicPageModule.forChild(ContentPage),
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
    entryComponents: [
      ContentPage
    ],
    providers: [
        HtmlContentService,
        MdContentService
    ]
  })
  export class ContentPageModule {}
