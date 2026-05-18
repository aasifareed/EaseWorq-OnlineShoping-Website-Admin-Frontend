import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StatusComponent } from './status.component';
import { StatusListComponent } from './status-list/status-list.component';
import { StatusEventListComponent } from './status-event-list/status-event-list.component';

const routes: Routes = [
  {
    path: '',
    component: StatusComponent,
    children: [
      { path: '', component: StatusListComponent },
      { path: 'events', component: StatusEventListComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderStatusRoutingModule {}
