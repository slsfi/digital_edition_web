import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';
import { ComponentsModule } from '../../components/components.module';
import { DigitalEditionListModule } from '../../components/digital-edition-list/digital-edition-list.module';
import { MdContentService } from '../../app/services/md/md-content.service';
import { MarkdownModule } from 'angular2-markdown';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      HomePage,
    ],
    imports: [
      IonicPageModule.forChild(HomePage),
      ComponentsModule,
      DigitalEditionListModule,
      MarkdownModule.forRoot(),
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
    entryComponents: [
      HomePage
    ],
    providers: [
      MdContentService
    ]
  })
  export class HomePageModule {}
