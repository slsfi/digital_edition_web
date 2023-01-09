import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FacsimileZoomModalPage } from './facsimile-zoom';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ClickOutsideModule } from 'ng4-click-outside';
import { PinchZoomModule } from 'ngx-pinch-zoom';


export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
      FacsimileZoomModalPage
    ],
    imports: [
        IonicPageModule.forChild(FacsimileZoomModalPage),
        PinchZoomModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          })
    ],
    entryComponents: [
      FacsimileZoomModalPage
    ],
    providers: [
        // FacsimileServce perhaps..
    ]
  })
  export class FacsimileZoomPageModule {}
