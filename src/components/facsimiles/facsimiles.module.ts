import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { FacsimilesComponent } from './facsimiles';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { FacsimileService } from '../../app/services/facsimile/facsimile.service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/', '.json');
}

@NgModule({
  declarations: [FacsimilesComponent],
  imports: [
    IonicModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  exports: [FacsimilesComponent],
  providers: [
    FacsimileService
  ]
})
export class FacsimilesModule {}
