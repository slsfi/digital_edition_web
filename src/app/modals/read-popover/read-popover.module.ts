import { NgModule } from '@angular/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { ReadPopoverPage } from './read-popover';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        ReadPopoverPage
    ],
    imports: [
        IonicModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          }),
          CommonModule,
          FormsModule,
    ],
    entryComponents: [
        ReadPopoverPage
    ],
    providers: [
        ReadPopoverService
    ]
  })
  export class ReadPopoverPageModule {}
