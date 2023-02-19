import { NgModule } from '@angular/core';
import { ReadPage } from './read';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ReadRoutingModule } from './read-routing.module';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommentsModule } from 'src/app/components/comments/comments.module';
import { MathJaxModule } from 'src/app/components/math-jax/math-jax.module';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { ReadTextModule } from 'src/app/components/read-text/read-text.module';
import { FacsimilesModule } from 'src/app/components/facsimiles/facsimiles.module';
import { ManuscriptsModule } from 'src/app/components/manuscripts/manuscripts.module';
import { PublicationCacheService } from 'src/app/services/cache/publication-cache.service';
import { LegendModule } from 'src/app/components/legend/legend.module';
import { DragScrollModule } from 'src/directives/ngx-drag-scroll/public-api';
import { VariationsModule } from 'src/app/components/variations/variations.module';
import { IntroductionModule } from 'src/app/components/introduction/introduction.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      ReadPage
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
      ReadTextModule,
      CommentsModule,
      FacsimilesModule,
      ManuscriptsModule,
      VariationsModule,
      IntroductionModule,
      DragScrollModule,
      MathJaxModule,
      LegendModule,
      ReadRoutingModule
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
