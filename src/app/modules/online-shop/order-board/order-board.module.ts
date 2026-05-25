import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SelectModule } from 'ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderSharedModule } from '../online-orders/order-shared.module';
import { OrderBoardComponent } from './order-board.component';
import { OrderBoardRoutingModule } from './order-board-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SelectModule,
    SharedModule,
    OrderSharedModule,
    OrderBoardRoutingModule,
  ],
  declarations: [OrderBoardComponent],
})
export class OrderBoardModule {}
