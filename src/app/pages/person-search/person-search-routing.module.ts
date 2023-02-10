import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonSearchPage } from './person-search';

const routes: Routes = [
  {
    path: '',
    component: PersonSearchPage,
  },
  {
    path: ':type',
    component: PersonSearchPage,
  },
  {
    path: ':type/:subtype',
    component: PersonSearchPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonSearchRoutingModule {}
