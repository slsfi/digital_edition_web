import { NgModule } from '@angular/core';

import { DigitalEditionList } from './digital-edition-list.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicModule } from '@ionic/angular';
import { PipesModule } from 'src/pipes/pipes.module';
import { DigitalEditionListService } from 'src/app/services/toc/digital-edition-list.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [DigitalEditionList],
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
  ],
  exports: [DigitalEditionList],
  providers: [DigitalEditionListService]
})
export class DigitalEditionListModule {}
