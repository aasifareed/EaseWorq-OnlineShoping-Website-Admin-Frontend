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
import { OrderListComponent } from './order-list/order-list.component';
import { OrderSharedModule } from './order-shared.module';
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
             OrderSharedModule,
      ],
  declarations: [
    OnlineOrdersComponent,
    OrderListComponent,
    WhatsAppListComponent,
    WhatsAppChatboxComponent
  ],

})
export class OnlineOrdersModule { }
