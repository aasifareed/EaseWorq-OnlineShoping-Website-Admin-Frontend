import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { OrderStatusRoutingModule } from './order-status-routing.module';
import { StatusComponent } from './status.component';
import { StatusListComponent } from './status-list/status-list.component';
import { StatusEventListComponent } from './status-event-list/status-event-list.component';
import { AddUpdateStatusComponent } from './add-update-status/add-update-status.component';
import { CreateEditStatusEventComponent } from './create-edit-status-event/create-edit-status-event.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    NgbModule,
    NgxDatatableModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    NgMultiSelectDropDownModule.forRoot(),
    OrderStatusRoutingModule,
  ],
  declarations: [
    StatusComponent,
    StatusListComponent,
    StatusEventListComponent,
    AddUpdateStatusComponent,
    CreateEditStatusEventComponent,
  ],
})
export class OrderStatusModule {}
