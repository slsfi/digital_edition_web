import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TabsPage } from './tabs';
import { LanguageService } from '../../app/services/languages/language.service';
// import { TableOfContentsModule } from '../../app/table-of-contents/table-of-contents.module';
// import { NO_ERRORS_SCHEMA } from '@angular/core';


@NgModule({
     declarations: [
        TabsPage
    ],
    imports: [
      IonicPageModule.forChild(TabsPage),

    ],
    entryComponents: [
        TabsPage
    ],
    providers: [
        LanguageService
    ]
  })
  export class TabsPageModule {}
