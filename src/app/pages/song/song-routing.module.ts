import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SongPage } from './song';

const routes: Routes = [
  {
    path: ':song_number/:filter_songs_by',
    component: SongPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SongRoutingModule {}
