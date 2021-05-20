import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MediaCollectionsPage } from './media-collections';
import { HttpClient } from '@angular/common/http';
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
    MediaCollectionsPage,
  ],
  imports: [
    IonicPageModule.forChild(MediaCollectionsPage),
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
export class MediaCollectionsPageModule {}
