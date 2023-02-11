import { NgModule } from '@angular/core';
import { SingleEditionPagePart } from './single-edition-part';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableOfContentsModule } from 'src/app/components/table-of-contents/table-of-contents.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { SingleEditionPartRoutingModule } from './single-edition-part-routing.module';

@NgModule({
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    declarations: [
        SingleEditionPagePart
    ],
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        TableOfContentsModule,
        ComponentsModule,
        SingleEditionPartRoutingModule
    ],
    entryComponents: [
        SingleEditionPagePart
    ]
  })
  export class SingleEditionPagePartModule {}
