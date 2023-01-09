import { MathJaxModule } from './../../components/math-jax/math-jax.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReadPage } from './read';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ComponentsModule } from '../../components/components.module';
import { CommentsModule } from '../../components/comments/comments.module';
import { FacsimilesModule } from '../../components/facsimiles/facsimiles.module';
import { ManuscriptsModule } from '../../components/manuscripts/manuscripts.module';
import { ReadTextModule } from '../../components/read-text/read-text.module';
import { VariationsModule } from '../../components/variations/variations.module';
import { HttpClient } from '@angular/common/http';
import { DragScrollModule } from 'ngx-drag-scroll';
import { IonicStorageModule } from '@ionic/storage';
import { PublicationCacheService } from '../../app/services/cache/publication-cache.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { IntroductionModule } from '../../components/introduction/introduction.module';
import { LegendModule } from '../../components/legend/legend.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      ReadPage
    ],
    imports: [
      IonicStorageModule.forRoot(),
      IonicPageModule.forChild(ReadPage),
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule,
      ReadTextModule,
      CommentsModule,
      FacsimilesModule,
      ManuscriptsModule,
      VariationsModule,
      IntroductionModule,
      DragScrollModule,
      MathJaxModule,
      LegendModule
    ],
    entryComponents: [
      ReadPage,
    ],
    providers: [
      PublicationCacheService,
      TableOfContentsService
    ]
  })
  export class ReadPageModule {}
