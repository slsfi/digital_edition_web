import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImageGalleryPage } from './image-gallery';

const routes: Routes = [
  {
    path: ':galleryPage',
    component: ImageGalleryPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImageGalleryRoutingModule {}
