import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PdfPage } from './pdf';

const routes: Routes = [
  {
    path: 'pdf/:facsimileId',
    component: PdfPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PdfRoutingModule {}
