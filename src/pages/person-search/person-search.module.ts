import { FilterPageModule } from './../filter/filter.module';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonSearchPage } from './person-search';
import { PipesModule } from 'src/pipes/pipes.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';
import { OccurrenceService } from 'src/app/services/occurrence/occurence.service';
import { FilterPage } from '../filter/filter';
import { OccurrencesPage } from '../occurrences/occurrences';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { OccurrencesPageModule } from '../occurrences/occurrences.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  schemas: [
    NO_ERRORS_SCHEMA
  ],
  declarations: [
    PersonSearchPage
  ],
  imports: [
    IonicModule,
    TableOfContentsModule,
    PipesModule,
    CommonModule,
    FormsModule,
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
  ],
  providers: [
    SemanticDataService,
    OccurrenceService
  ],
  entryComponents: [
    FilterPage,
    OccurrencesPage
  ]
})
export class PersonSearchPageModule {}
