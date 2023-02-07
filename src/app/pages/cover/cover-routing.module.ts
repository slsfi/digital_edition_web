import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoverPage } from './cover';

const routes: Routes = [
  {
    path: '',
    component: CoverPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoverPageRoutingModule {}
