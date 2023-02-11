import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { PdfPage } from './pdf';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PdfRoutingModule } from './pdf-routing.module';

@NgModule({
  declarations: [
    PdfPage
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ComponentsModule,
    NgxExtendedPdfViewerModule,
    PdfRoutingModule,
  ],
  entryComponents: [
    PdfPage
  ],
  providers: [
    PdfService
  ]
})
export class PdfPageModule {}
