import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharePopoverPage } from './share-popover';

@NgModule({
  declarations: [
    SharePopoverPage,
  ],
  imports: [
    IonicPageModule.forChild(SharePopoverPage),
  ],
})
export class SharePopoverPageModule {}
