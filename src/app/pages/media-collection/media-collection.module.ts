import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MediaCollectionPage } from './media-collection';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PipesModule } from 'src/pipes/pipes.module';
import { MarkdownModule } from 'ngx-markdown';
import { ComponentsModule } from 'src/app/components/components.module';
import { MediaCollectionRoutingModule } from './media-collection-routing.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MediaCollectionPage,
  ],
 imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    PipesModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
    ComponentsModule,
    MarkdownModule,
    MediaCollectionRoutingModule
  ],
})
export class MediaCollectionPageModule {}
