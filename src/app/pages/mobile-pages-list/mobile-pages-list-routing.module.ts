import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobilePagesListPage } from './mobile-pages-list';

const routes: Routes = [
  {
    path: '',
    component: MobilePagesListPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobilePagesListRoutingModule {}
