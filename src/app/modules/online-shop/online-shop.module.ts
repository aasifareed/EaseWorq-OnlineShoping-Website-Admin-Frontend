import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnlineShopComponent } from './online-shop.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { OnlineShopRoutingModule } from './online-shop.routing';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SharedPipesModule } from 'src/app/shared/pipes/shared-pipes.module';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    SharedPipesModule,
    OnlineShopRoutingModule,
  ],
  declarations: [OnlineShopComponent],
})
export class OnlineShopModule {}
