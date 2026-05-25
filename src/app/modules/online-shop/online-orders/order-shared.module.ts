import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderDetailModalComponent } from './order-detail-modal/order-detail-modal.component';

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, NgbModule, SharedModule],
  declarations: [OrderDetailModalComponent],
  exports: [OrderDetailModalComponent],
  entryComponents: [OrderDetailModalComponent],
})
export class OrderSharedModule {}
