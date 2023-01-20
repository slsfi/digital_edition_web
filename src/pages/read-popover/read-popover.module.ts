import { NgModule } from '@angular/core';
import { ReadPopoverPage } from './read-popover';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        ReadPopoverPage
    ],
    imports: [
        IonicModule.forRoot(),
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
