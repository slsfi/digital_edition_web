import { NgModule } from '@angular/core';
import { AboutPage } from './about';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { RouterModule } from '@angular/router';
import { AboutPageRoutingModule } from './about-routing.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      AboutPage
    ],
    imports: [
      IonicModule,
      HttpClientModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule,
      AboutPageRoutingModule,
    ],
    entryComponents: [
      AboutPage
    ],
    providers: [
    ],
  })
  export class AboutPageModule {}
