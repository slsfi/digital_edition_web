import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MediaCollectionPage } from './media-collection';

const routes: Routes = [
  {
    path: ':mediaCollectionId/:id/:type',
    component: MediaCollectionPage,
  },
  {
    path: ':mediaCollectionId',
    component: MediaCollectionPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MediaCollectionRoutingModule {}
