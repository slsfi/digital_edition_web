import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReadPopoverPage } from './read-popover';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ReadPopoverService, Fontsize } from '../../app/services/settings/read-popover.service';
import { HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        ReadPopoverPage
    ],
    imports: [
        IonicPageModule.forChild(ReadPopoverPage),
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          }),
    ],
    entryComponents: [
        ReadPopoverPage
    ],
    providers: [
        ReadPopoverService
    ]
  })
  export class ReadPopoverPageModule {}
