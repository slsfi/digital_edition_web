import { EpubPage } from './epub';
import { NgModule } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { EpubComponent } from 'src/app/components/epub/epub';
import { IonicModule, NavParams } from '@ionic/angular';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpubPageRoutingModule } from './epub-routing.module';

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
      IonicModule,
      CommonModule,
      FormsModule,
      TableOfContentsModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule,
      EpubPageRoutingModule
    ],
    providers: [
      TableOfContentsService,
      NavParams
    ],
    entryComponents: [
      EpubPage
    ]
  })
  export class EpubModule {}
