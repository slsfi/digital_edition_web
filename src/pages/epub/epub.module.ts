import { EpubPage } from './epub';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { HttpClient } from '@angular/common/http';
import { EpubComponent } from '../../components/epub/epub';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    declarations: [
        EpubPage,
        EpubComponent
    ],
    imports: [
      IonicPageModule.forChild(EpubPage),
      TableOfContentsModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule
    ],
    providers: [
        TableOfContentsService
    ],
    entryComponents: [
      EpubPage
    ]
  })
  export class EpubModule {}
