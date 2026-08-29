import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProductsService } from '../../products/services/products.service';
import { CouponFormModalComponent } from './coupon-form-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgMultiSelectDropDownModule,
    SharedModule,
    TranslateModule,
  ],
  declarations: [CouponFormModalComponent],
  exports: [CouponFormModalComponent],
  entryComponents: [CouponFormModalComponent],
  providers: [ProductsService],
})
export class CouponFormModalModule {}
