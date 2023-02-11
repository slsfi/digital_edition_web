import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OccurrencesResultPage } from './occurrences-result';

const routes: Routes = [
  {
    path: ':objectType/:id',
    component: OccurrencesResultPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OccurrencesResultRoutingModule {}
