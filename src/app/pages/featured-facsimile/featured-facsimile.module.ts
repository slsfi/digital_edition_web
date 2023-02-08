import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { FeaturedFacsimilePageRoutingModule } from './feature-facsimile-routing.module';
import { IonicModule } from '@ionic/angular';
import { FeaturedFacsimilePage } from './featured-facsimile';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { FacsimileService } from 'src/app/services/facsimile/facsimile.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    FeaturedFacsimilePage,
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TableOfContentsModule,
    PipesModule,
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
        }
      }),
      ComponentsModule,
      FeaturedFacsimilePageRoutingModule
  ],
  providers: [
    FacsimileService
  ]
})
export class FeaturedFacsimilePageModule {}
