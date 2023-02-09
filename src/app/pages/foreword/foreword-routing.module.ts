import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForewordPage } from './foreword';

const routes: Routes = [
  {
    path: ':collectionID',
    component: ForewordPage,
  },
  {
    path: '',
    component: ForewordPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForewordPageRoutingModule {}
