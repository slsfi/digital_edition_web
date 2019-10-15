import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { TableOfContentsList } from './table-of-contents.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { HttpClient } from '@angular/common/http';

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
