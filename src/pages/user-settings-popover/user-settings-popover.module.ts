import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UserSettingsPopoverPage } from './user-settings-popover';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        UserSettingsPopoverPage
    ],
    imports: [
    IonicPageModule.forChild(UserSettingsPopoverPage),

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
