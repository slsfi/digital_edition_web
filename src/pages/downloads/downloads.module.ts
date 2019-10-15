import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DownloadsPage } from './downloads';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    DownloadsPage,
  ],
  imports: [
    IonicPageModule.forChild(DownloadsPage),
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule
  ],
})
export class DownloadsPageModule {}
