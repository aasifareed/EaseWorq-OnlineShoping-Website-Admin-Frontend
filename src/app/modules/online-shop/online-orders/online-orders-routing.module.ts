import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OnlineOrdersComponent } from './online-orders.component';
import { CompletedOrderListComponent } from './online-order-for-completed/completed-order-list/completed-order-list.component';
import { ConfirmedOrderListComponent } from './online-order-list-for-confirmed/confirmed-order-list/confirmed-order-list.component';
import { DeliveredOrderListComponent } from './online-order-list-for-delivered/delivered-order-list/delivered-order-list.component';
import { PendingOrderListComponent } from './online-order-list-for-pending/pending-order-list/pending-order-list.component';
import { ShippedOrderListComponent } from './online-order-list-for-shipped/shipped-order-list/shipped-order-list.component';

const routes: Routes = [
  { path: '', component: OnlineOrdersComponent },
  { path: 'completed', component: CompletedOrderListComponent },
  { path: 'confirmed', component: ConfirmedOrderListComponent },
  { path: 'delivered', component: DeliveredOrderListComponent },
  { path: 'pending', component: PendingOrderListComponent },
  { path: 'shipped', component: ShippedOrderListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnlineOrdersRoutingModule { }
