import { ErrorHandler, NgModule } from '@angular/core';
import { IonicPageModule, IonicErrorHandler } from 'ionic-angular';
import { PdfPage } from './pdf';
import { PdfService } from '../../app/services/pdf/pdf.service';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    PdfPage
  ],
  imports: [
    IonicPageModule.forChild(PdfPage),
    ComponentsModule
  ],
  entryComponents: [
    PdfPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    PdfService
  ]
})
export class PdfPageModule {}
