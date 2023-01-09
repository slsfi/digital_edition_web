import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { SingleEditionPage } from './single-edition';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { HttpClient } from '@angular/common/http';
import { MdContentService } from '../../app/services/md/md-content.service';
import { MarkdownModule } from 'angular2-markdown';
import { PdfService } from '../../app/services/pdf/pdf.service';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    declarations: [
        SingleEditionPage
    ],
    imports: [
      IonicPageModule.forChild(SingleEditionPage),
      TableOfContentsModule,
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
    providers: [
        TableOfContentsService,
        MdContentService,
        PdfService
    ],
    entryComponents: [
        SingleEditionPage
    ]
  })
  export class SingleEditionPageModule {}
