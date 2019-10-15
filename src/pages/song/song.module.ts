import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SongPage } from './song';
import { SongService } from '../../app/services/song/song.service';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    SongPage,
  ],
  imports: [
    IonicPageModule.forChild(SongPage),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ComponentsModule
  ],
  providers: [
    SongService
  ],
})
export class SongPageModule {}
