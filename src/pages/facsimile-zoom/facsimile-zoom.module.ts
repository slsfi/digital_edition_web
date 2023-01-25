import { NgModule } from '@angular/core';
import { FacsimileZoomModalPage } from './facsimile-zoom';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { PinchZoomModule } from 'src/app/components/pinch-zoom/pinch-zoom.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      FacsimileZoomModalPage
    ],
    imports: [
        IonicModule,
        PinchZoomModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          }),
        CommonModule,
        FormsModule,
    ],
    entryComponents: [
      FacsimileZoomModalPage
    ],
    providers: [
        // FacsimileServce perhaps..
    ]
  })
  export class FacsimileZoomPageModule {}
