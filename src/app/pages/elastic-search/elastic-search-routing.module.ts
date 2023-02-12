import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ElasticSearchPage } from './elastic-search';

const routes: Routes = [
  {
    path: ':query',
    component: ElasticSearchPage,
  },
  {
    path: '',
    component: ElasticSearchPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ElasticSearchPageRoutingModule {}
