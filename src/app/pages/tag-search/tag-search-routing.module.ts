import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TagSearchPage } from './tag-search';

const routes: Routes = [
  {
    path: '',
    component: TagSearchPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TagSearchRoutingModule {}
