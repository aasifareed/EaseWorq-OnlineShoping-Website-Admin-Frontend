import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { ShippingRoutingModule } from './shipping-routing.module';
import { ShippingComponent } from './shipping.component';
import { SelectCountryModalComponent } from './select-country-modal/select-country-modal.component';
import { ShippingRuleModalComponent } from './shipping-rule-modal/shipping-rule-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    NgMultiSelectDropDownModule.forRoot(),
    ShippingRoutingModule,
  ],
  declarations: [
    ShippingComponent,
    SelectCountryModalComponent,
    ShippingRuleModalComponent,
  ],
})
export class ShippingModule {}
