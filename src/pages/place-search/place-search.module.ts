import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PlaceSearchPage } from './place-search';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    PlaceSearchPage,
  ],
  imports: [
    IonicPageModule.forChild(PlaceSearchPage),
    TableOfContentsModule,
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
  providers: [
    SemanticDataService
  ]
})
export class PlaceSearchPageModule {}
