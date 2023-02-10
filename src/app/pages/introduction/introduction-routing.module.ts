import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IntroductionPage } from './introduction';

const routes: Routes = [
  {
    path: ':collectionID',
    component: IntroductionPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntroductionRoutingModule {}
