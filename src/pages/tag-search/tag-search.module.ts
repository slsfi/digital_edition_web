import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TagSearchPage } from './tag-search';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    TagSearchPage,
  ],
  imports: [
    IonicPageModule.forChild(TagSearchPage),
    TableOfContentsModule,
    PipesModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule
  ],
  providers: [
    SemanticDataService
  ]
})
export class TagearchPageModule {}
