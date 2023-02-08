import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeaturedFacsimilePage } from './featured-facsimile';

const routes: Routes = [
  {
    path: 'facsimiles',
    component: FeaturedFacsimilePage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeaturedFacsimilePageRoutingModule {}
