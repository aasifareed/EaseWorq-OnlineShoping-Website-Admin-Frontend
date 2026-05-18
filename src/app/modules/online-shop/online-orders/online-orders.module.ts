import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TagInputModule } from 'ngx-chips';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { SelectModule } from 'ng-select';

import { NgxEchartsModule } from 'ngx-echarts';
import { CalendarModule } from 'primeng/calendar';
import { EditorModule } from 'primeng/editor';
// import { NgxScannerQrcodeModule, LOAD_WASM } from 'ngx-scanner-qrcode';
import { SharedPipesModule } from 'src/app/shared/pipes/shared-pipes.module';
import { RouterModule } from '@angular/router';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';

import { OnlineOrdersComponent } from './online-orders.component';
import { CompletedOrderListComponent } from './online-order-for-completed/completed-order-list/completed-order-list.component';
import { ConfirmedOrderListComponent } from './online-order-list-for-confirmed/confirmed-order-list/confirmed-order-list.component';
import { DeliveredOrderListComponent } from './online-order-list-for-delivered/delivered-order-list/delivered-order-list.component';
import { PendingOrderListComponent } from './online-order-list-for-pending/pending-order-list/pending-order-list.component';
import { ShippedOrderListComponent } from './online-order-list-for-shipped/shipped-order-list/shipped-order-list.component';
import { OnlineOrdersRoutingModule } from './online-orders-routing.module';
import { WhatsAppListComponent } from './whatsapp/whatsapp-list/whatsapp-list.component';
import { WhatsAppChatboxComponent } from './whatsapp/whatsapp-chatbox/whatsapp-chatbox.component';

@NgModule({

    imports: [
             CommonModule,
             FormsModule,
             RouterModule,
             ReactiveFormsModule,
             NgxPaginationModule,
             TagInputModule,
             NgbModule,
             NgxDatatableModule,
             SharedModule,
             SelectModule,
             SharedDirectivesModule,
             NgMultiSelectDropDownModule.forRoot(),
             SharedComponentsModule,
             EditorModule,
             CalendarModule,
             OnlineOrdersRoutingModule,
      ],
  declarations: [
    OnlineOrdersComponent,
    CompletedOrderListComponent,
    ConfirmedOrderListComponent,
    DeliveredOrderListComponent,
    PendingOrderListComponent,
    ShippedOrderListComponent,
    WhatsAppListComponent,
    WhatsAppChatboxComponent
  ],

})
export class OnlineOrdersModule { }
