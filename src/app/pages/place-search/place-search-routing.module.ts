import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlaceSearchPage } from './place-search';

const routes: Routes = [
  {
    path: '',
    component: PlaceSearchPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlaceSearchRoutingModule {}
