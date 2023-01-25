import { NgModule } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { TableOfContentsList } from './table-of-contents.component';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    schemas: [
        NO_ERRORS_SCHEMA
    ],

    declarations: [
      TableOfContentsList
    ],
    imports: [
        IonicModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            }
        })
    ],
    entryComponents: [
        TableOfContentsList
    ],
    providers: [
        TableOfContentsService
      ],
    exports: [
        TableOfContentsList
    ],
  })
  export class TableOfContentsModule {}
