import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IllustrationPage } from './illustration';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    IllustrationPage,
  ],
  imports: [
    IonicPageModule.forChild(IllustrationPage),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [
    IllustrationPage
  ]
})
export class IllustrationPageModule {}
