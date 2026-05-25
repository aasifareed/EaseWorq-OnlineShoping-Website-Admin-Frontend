import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SelectModule } from 'ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { ManageOrderComponent } from './manage-order.component';
import { ManageOrderRoutingModule } from './manage-order-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    SelectModule,
    SharedModule,
    ManageOrderRoutingModule,
  ],
  declarations: [ManageOrderComponent],
})
export class ManageOrderModule {}
