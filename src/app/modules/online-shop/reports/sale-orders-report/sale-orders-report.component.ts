import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { Page } from 'src/app/shared/models/page';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  ReportFilterState,
  ReportStatusOption,
  SaleOrdersReportRow,
  SaleOrdersReportSummary,
} from '../models/report.models';
import { ReportsService } from '../services/reports.service';

interface FilterOption {
  value: number | null;
  label: string;
}

@Component({
  selector: 'app-sale-orders-report',
  templateUrl: './sale-orders-report.component.html',
  styleUrls: ['./sale-orders-report.component.scss', '../report-filter-panel.scss'],
})
export class SaleOrdersReportComponent implements OnInit, OnDestroy {
  ColumnMode = ColumnMode;
  rows: SaleOrdersReportRow[] = [];
  searchControl = new FormControl('');
  gridHeight = '100%';
  loadingIndicator = false;
  page = new Page();
  sorting = 'OrderDate desc';
  statusOptions: ReportStatusOption[] = [];
  selectedStoreId: string | null = null;

  filter: ReportFilterState = {
    paymentMethod: null,
    shippingMethod: null,
    orderStatusId: null,
  };

  summary: SaleOrdersReportSummary = this.emptySummary();

  readonly paymentMethodOptions: FilterOption[] = [
    { value: null, label: 'All Payment Methods' },
    { value: 1, label: 'Cash on Delivery' },
    { value: 2, label: 'GoPayFast' },
  ];

  readonly shippingMethodOptions: FilterOption[] = [
    { value: null, label: 'All Shipping Methods' },
    { value: 1, label: 'Local Pickup' },
    { value: 2, label: 'Shipping' },
  ];

  private selectedStoreSubscription: Subscription;

  constructor(
    private reportsService: ReportsService,
    private restService: RestService,
    public customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
  ) {
    this.page.pageNumber = 0;
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.calculatePageSize();
    this.loadStatusOptions();
    this.selectedStoreSubscription = this.customUserStoreService.selectedStore$.subscribe((value) => {
      this.selectedStoreId = this.resolveStoreId(value);
      this.page.pageNumber = 0;
      this.loadData();
    });
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      this.filter.keyword = value || undefined;
      this.page.pageNumber = 0;
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.selectedStoreSubscription?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    const previousSize = this.page.size;
    this.calculatePageSize();
    if (previousSize !== this.page.size) {
      this.page.pageNumber = 0;
      this.loadData();
    }
  }

  search(): void {
    this.page.pageNumber = 0;
    this.loadData();
  }

  resetSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.setDefaultDateRange();
    this.filter = {
      paymentMethod: null,
      shippingMethod: null,
      orderStatusId: null,
    };
    this.page.pageNumber = 0;
    this.loadData();
  }

  setPage(event: { offset: number }): void {
    this.page.pageNumber = event.offset;
    this.loadData();
  }

  exportExcel(): void {
    if (!this.rows.length) {
      return;
    }

    const sheetRows = this.rows.map((row) => ({
      'Order #': row.orderNumber,
      Customer: row.customerName,
      Date: row.orderDate,
      Payment: row.paymentMethodName,
      Shipping: row.shippingMethodName,
      Status: row.orderStatusName,
      'Sub Total': row.originalSubTotalAmount,
      'Product Discount': row.productDiscountAmount,
      'Order Discount': row.orderDiscountAmount,
      Merchandise: row.netMerchandiseAmount,
      Tax: row.taxAmount,
      'Shipping Charged': row.shippingCharges,
      'Courier Cost': row.courierCost,
      'Shipping Profit': row.shippingProfit,
      Total: row.totalAmount,
      Paid: row.paidAmount,
      Remaining: row.remainingAmount,
      'Product Cost': row.productCost,
      'Product Profit': row.productProfit,
      'Gross Profit': row.grossProfit,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sale Report');
    XLSX.writeFile(workbook, `online-shop-sale-report-${Date.now()}.xlsx`);
  }

  formatMoney(value: number): string {
    return `${this.globalDataService.getCurrencySymbol()} ${Number(value || 0).toFixed(2)}`;
  }

  private loadData(): void {
    this.loadingIndicator = true;
    this.reportsService
      .getSaleOrdersReport(this.selectedStoreId, this.filter, {
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        sorting: this.sorting,
      })
      .subscribe({
        next: (response) => {
          const result = response?.result ?? response;
          const items = (result?.items ?? result?.Items ?? []) as Record<string, unknown>[];
          this.page.totalElements = Number(result?.totalCount ?? result?.TotalCount ?? 0);
          this.rows = items.map((item) => this.reportsService.mapSaleOrderRow(item));
          if (items.length) {
            this.summary = this.reportsService.mapSaleOrderSummary(items[0]);
          } else {
            this.summary = this.emptySummary();
          }
          this.loadingIndicator = false;
        },
        error: () => {
          this.rows = [];
          this.summary = this.emptySummary();
          this.loadingIndicator = false;
        },
      });
  }

  private loadStatusOptions(): void {
    this.restService.getWithoutLoader(environment.urls.GetStatusDropdown).subscribe({
      next: (response) => {
        const items = response?.result ?? response ?? [];
        this.statusOptions = (items as Record<string, unknown>[]).map((item) => ({
          value: String(item.id ?? item.Id ?? ''),
          label: String(item.displayName ?? item.DisplayName ?? item.statusName ?? item.StatusName ?? ''),
        }));
      },
    });
  }

  private setDefaultDateRange(): void {
    const today = this.globalDataService.getTodayFormatedDate();
    this.filter.fromDate = today;
    this.filter.toDate = today;
  }

  private calculatePageSize(): void {
    const rowHeight = 40;
    const headerFooterHeight = 420;
    const availableHeight = window.innerHeight - headerFooterHeight;
    this.page.size = Math.max(Math.floor(availableHeight / rowHeight), 5);
  }

  private resolveStoreId(value: unknown): string | null {
    if (value == null) {
      return this.customUserStoreService.getDefaultStoreId();
    }
    if (Array.isArray(value)) {
      return value.length ? String(value[0]) : this.customUserStoreService.getDefaultStoreId();
    }
    return String(value);
  }

  private emptySummary(): SaleOrdersReportSummary {
    return {
      originalSubTotalAmountSum: 0,
      productDiscountAmountSum: 0,
      subTotalAmountSum: 0,
      orderDiscountAmountSum: 0,
      netMerchandiseAmountSum: 0,
      taxAmountSum: 0,
      originalShippingAmountSum: 0,
      shippingDiscountAmountSum: 0,
      shippingChargesSum: 0,
      courierCostSum: 0,
      shippingProfitSum: 0,
      totalAmountSum: 0,
      paidAmountSum: 0,
      remainingAmountSum: 0,
      productCostSum: 0,
      productProfitSum: 0,
      grossProfitSum: 0,
    };
  }
}
