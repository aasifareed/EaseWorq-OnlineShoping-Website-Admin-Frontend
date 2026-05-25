import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderBoardComponent } from './order-board.component';

const routes: Routes = [
  { path: '', component: OrderBoardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderBoardRoutingModule {}
