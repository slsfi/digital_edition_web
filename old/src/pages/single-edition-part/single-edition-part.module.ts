import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SingleEditionPagePart } from './single-edition-part';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentsModule } from '../../components/components.module';
import { TableOfContentsModule } from '../../components/table-of-contents/table-of-contents.module';

@NgModule({
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    declarations: [
        SingleEditionPagePart
    ],
    imports: [
      IonicPageModule.forChild(SingleEditionPagePart),
      TableOfContentsModule,
      ComponentsModule
    ],
    entryComponents: [
        SingleEditionPagePart
    ]
  })
  export class SingleEditionPagePartModule {}
