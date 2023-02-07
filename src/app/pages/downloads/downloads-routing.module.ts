import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadsPage } from './downloads';

const routes: Routes = [
  {
    path: '',
    component: DownloadsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadsPageRoutingModule {}
