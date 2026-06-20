import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsShellComponent } from './settings-shell.component';
import { OnlineShopSettingsStateService } from './services/online-shop-settings-state.service';
import { CourierProviderService } from './services/courier-provider.service';
import { PaymentProviderService } from './services/payment-provider.service';
import { CourierProvidersComponent } from './courier-providers/courier-providers.component';
import { CourierProviderModalComponent } from './courier-providers/courier-provider-modal.component';
import { PaymentProvidersComponent } from './payment-providers/payment-providers.component';
import { PaymentProviderModalComponent } from './payment-providers/payment-provider-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    SettingsRoutingModule,
  ],
  declarations: [
    SettingsShellComponent,
    CourierProvidersComponent,
    CourierProviderModalComponent,
    PaymentProvidersComponent,
    PaymentProviderModalComponent,
  ],
  providers: [OnlineShopSettingsStateService, CourierProviderService, PaymentProviderService],
})
export class SettingsModule {}
