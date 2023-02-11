import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingleEditionPage } from './single-edition';

const routes: Routes = [
  {
    path: ':id',
    component: SingleEditionPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SingleEditionRoutingModule {}
