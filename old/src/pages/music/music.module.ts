import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MusicPage } from './music';
import { MdContentService } from '../../app/services/md/md-content.service';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { DigitalEditionListModule } from '../../components/digital-edition-list/digital-edition-list.module';
import { MarkdownModule } from 'angular2-markdown';
import { PipesModule } from '../../pipes/pipes.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MusicPage,
  ],
  imports: [
    IonicPageModule.forChild(MusicPage),
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
  ],
  entryComponents: [
    MusicPage
  ],
  providers: [
    MdContentService
  ]
})
export class MusicPageModule {}
