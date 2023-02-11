import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingleEditionPagePart } from './single-edition-part';

const routes: Routes = [
  {
    path: ':collectionID',
    component: SingleEditionPagePart,
  },
  {
    path: ':collectionID/:id',
    component: SingleEditionPagePart,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SingleEditionPartRoutingModule {}
