import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkSearchPage } from './work-search';

const routes: Routes = [
  {
    path: '',
    component: WorkSearchPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkSearchPageRoutingModule {}
