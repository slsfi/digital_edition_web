import { OccurrencesPageModule } from '../occurrences/occurrences.module';
import { FilterPageModule } from '../filter/filter.module';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ElasticSearchPage } from './elastic-search';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PipesModule } from '../../pipes/pipes.module';
import { FilterPage } from '../filter/filter';
import { OccurrenceService } from '../../app/services/occurrence/occurence.service';
import { OccurrencesPage } from '../occurrences/occurrences';
import { ElasticSearchService } from '../../app/services/elastic-search/elastic-search.service';
import { MarkdownModule } from 'angular2-markdown';

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
    IonicPageModule.forChild(ElasticSearchPage),
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
      MarkdownModule
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
