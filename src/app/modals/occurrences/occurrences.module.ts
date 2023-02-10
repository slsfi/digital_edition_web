import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { OccurrencesPage } from './occurrences';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { ComponentsModule } from 'src/app/components/components.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    OccurrencesPage,
  ],
  imports: [
    IonicModule,
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
      CommonModule,
      FormsModule,
  ],
})
export class OccurrencesPageModule {}
