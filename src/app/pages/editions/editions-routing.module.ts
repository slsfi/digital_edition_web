import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditionsPage } from './editions';

const routes: Routes = [
  {
    path: '',
    component: EditionsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditionsPageRoutingModule {}
