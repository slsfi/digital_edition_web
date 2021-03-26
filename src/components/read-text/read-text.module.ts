import { mathjax } from './../../assets/MathJax-src-3.1.2/ts/mathjax';
import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { ReadTextComponent } from './read-text';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { MathJaxDirective } from '../../directives/math-jax/math-jax';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '../../assets/i18n/', '.json');
}

@NgModule({
  declarations: [ReadTextComponent, MathJaxDirective],
  imports: [
    IonicModule,
    IonicStorageModule.forRoot(),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  exports: [ReadTextComponent, MathJaxDirective]
})
export class ReadTextModule {}
