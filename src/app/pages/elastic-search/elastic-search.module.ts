import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { ElasticSearchPage } from './elastic-search';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicModule } from '@ionic/angular';
import { MarkdownModule } from 'ngx-markdown';
import { OccurrenceService } from 'src/app/services/occurrence/occurence.service';
import { ComponentsModule } from 'src/app/components/components.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { ElasticSearchService } from 'src/app/services/elastic-search/elastic-search.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElasticSearchPageRoutingModule } from './elastic-search-routing.module';
import { FilterPageModule } from 'src/pages/filter/filter.module';
import { OccurrencesPageModule } from 'src/app/modals/occurrences/occurrences.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  schemas: [
    NO_ERRORS_SCHEMA
  ],
  declarations: [
    ElasticSearchPage
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
      FilterPageModule,
      OccurrencesPageModule,
      MarkdownModule,
      ElasticSearchPageRoutingModule
  ],
  providers: [
    ElasticSearchService,
    OccurrenceService
  ],
  entryComponents: [
    ElasticSearchPage
  ]
})
export class ElasticSearchPageModule {}
