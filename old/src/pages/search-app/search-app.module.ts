import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchAppPage } from './search-app';
import { ComponentsModule, createTranslateLoader } from '../../components/components.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@NgModule({
  declarations: [
    SearchAppPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchAppPage),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ComponentsModule
  ],
})
export class SearchAppPageModule {}
