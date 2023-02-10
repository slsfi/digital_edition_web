import { NgModule } from '@angular/core';
import { UserSettingsPopoverPage } from './user-settings-popover';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        UserSettingsPopoverPage
    ],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          }),
    ],
    entryComponents: [
        UserSettingsPopoverPage
    ],
    providers: [
        UserSettingsService
    ]
  })
  export class UserSettingsPopoverPageModule {}
