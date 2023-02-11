import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TitlePage } from './title';

const routes: Routes = [
  {
    path: ':collectionID',
    component: TitlePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TitlePageRoutingModule {}
