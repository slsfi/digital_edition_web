import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharePopoverPage } from './share-popover';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    SharePopoverPage,
  ],
  imports: [
    IonicPageModule.forChild(SharePopoverPage),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
})
export class SharePopoverPageModule {}
