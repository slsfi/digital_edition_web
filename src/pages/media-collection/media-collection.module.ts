import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MediaCollectionPage } from './media-collection';

@NgModule({
  declarations: [
    MediaCollectionPage,
  ],
  imports: [
    IonicPageModule.forChild(MediaCollectionPage),
  ],
})
export class MediaCollectionPageModule {}
