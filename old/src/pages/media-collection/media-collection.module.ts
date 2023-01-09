import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { MediaCollectionPage } from './media-collection';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MediaCollectionPage,
  ],
 imports: [
    IonicPageModule.forChild(MediaCollectionPage),
    PipesModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
    ComponentsModule,
    MarkdownModule
  ],
})
export class MediaCollectionPageModule {}
