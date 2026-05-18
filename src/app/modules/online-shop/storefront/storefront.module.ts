import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { StorefrontRoutingModule } from './storefront-routing.module';
import { MenuShellComponent } from './menu/menu-shell.component';
import { HeaderMenuStateService } from './menu/services/header-menu-state.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    StorefrontRoutingModule,
  ],
  declarations: [MenuShellComponent],
  providers: [HeaderMenuStateService],
})
export class StorefrontModule {}
