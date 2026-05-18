import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsShellComponent } from './settings-shell.component';
import { OnlineShopSettingsStateService } from './services/online-shop-settings-state.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    SettingsRoutingModule,
  ],
  declarations: [SettingsShellComponent],
  providers: [OnlineShopSettingsStateService],
})
export class SettingsModule {}
