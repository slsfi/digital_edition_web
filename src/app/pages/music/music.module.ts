import { NgModule } from '@angular/core';
import { MusicPage } from './music';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { DigitalEditionListModule } from 'src/app/components/digital-edition-list/digital-edition-list.module';
import { MarkdownModule } from 'ngx-markdown';
import { PipesModule } from 'src/pipes/pipes.module';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { MusicRoutingModule } from './music-routing.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MusicPage,
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
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
    MusicRoutingModule,
  ],
  entryComponents: [
    MusicPage
  ],
  providers: [
    MdContentService
  ]
})
export class MusicPageModule {}
