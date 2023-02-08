import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EpubPage } from './epub';

const routes: Routes = [
  {
    path: ':selectedFile',
    component: EpubPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EpubPageRoutingModule {}
