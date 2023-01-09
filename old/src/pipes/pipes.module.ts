import { NgModule } from '@angular/core';
import { OrderByPipe } from './order-by/order-by';
import { SearchPipe } from './search/search';
import { SortPipe } from './sort/sort';
@NgModule({
declarations: [OrderByPipe,
    SearchPipe,
    SortPipe],
imports: [],
exports: [OrderByPipe,
    SearchPipe,
    SortPipe]
})
export class PipesModule {}
