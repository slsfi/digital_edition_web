import { NgModule } from '@angular/core';
import { PlaceSearchPage } from './place-search';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { PlaceSearchRoutingModule } from './place-search-routing.module';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { MarkdownModule } from 'ngx-markdown';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    PlaceSearchPage,
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
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
      MarkdownModule,
      PlaceSearchRoutingModule
  ],
  providers: [
    SemanticDataService
  ]
})
export class PlaceSearchPageModule {}
