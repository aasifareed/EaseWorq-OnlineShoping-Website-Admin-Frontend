import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SelectModule } from 'ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { SaleOrdersReportComponent } from './sale-orders-report/sale-orders-report.component';
import { ProfitMarginReportComponent } from './profit-margin-report/profit-margin-report.component';
import { ReportsService } from './services/reports.service';
import { ProductsService } from '../products/services/products.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    SelectModule,
    SharedModule,
    SharedDirectivesModule,
    ReportsRoutingModule,
  ],
  declarations: [ReportsComponent, SaleOrdersReportComponent, ProfitMarginReportComponent],
  providers: [ReportsService, ProductsService],
})
export class ReportsModule {}
