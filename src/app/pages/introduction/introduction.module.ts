import { NgModule } from '@angular/core';
import { IntroductionPage } from './introduction';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { IntroductionRoutingModule } from './introduction-routing.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    IntroductionPage,
  ],
  imports: [
    IonicModule,
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
    IntroductionRoutingModule,
  ],
})
export class IntroductionPageModule {}
