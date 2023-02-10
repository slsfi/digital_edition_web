import { NgModule } from '@angular/core';
import { SearchAppPage } from './search-app';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule, createTranslateLoader } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SearchAppPage,
  ],
  imports: [
    IonicModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ComponentsModule,
    CommonModule,
    FormsModule,
  ],
})
export class SearchAppPageModule {}
