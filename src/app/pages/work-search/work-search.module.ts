import { NgModule } from '@angular/core';
import { WorkSearchPage } from './work-search';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { WorkSearchPageRoutingModule } from './work-search-routing.module';
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
    WorkSearchPage,
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
      WorkSearchPageRoutingModule
  ],
  providers: [
    SemanticDataService
  ]
})
export class WorkearchPageModule {}
