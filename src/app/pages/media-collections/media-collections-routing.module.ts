import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MediaCollectionsPage } from './media-collections';

const routes: Routes = [
  {
    path: '',
    component: MediaCollectionsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MediaCollectionsRoutingModule {}
