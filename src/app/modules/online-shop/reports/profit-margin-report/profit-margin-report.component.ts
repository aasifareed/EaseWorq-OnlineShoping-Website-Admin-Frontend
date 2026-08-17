import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { Page } from 'src/app/shared/models/page';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import {
  ProfitMarginReportRow,
  ProfitMarginReportSummary,
  ReportFilterState,
  ReportProductOption,
} from '../models/report.models';
import { ReportsService } from '../services/reports.service';
import { ProductsService } from '../../products/services/products.service';

interface FilterOption {
  value: number | null;
  label: string;
}

@Component({
  selector: 'app-profit-margin-report',
  templateUrl: './profit-margin-report.component.html',
  styleUrls: ['./profit-margin-report.component.scss', '../report-filter-panel.scss'],
})
export class ProfitMarginReportComponent implements OnInit, OnDestroy {
  ColumnMode = ColumnMode;
  rows: ProfitMarginReportRow[] = [];
  gridHeight = '100%';
  loadingIndicator = false;
  page = new Page();
  sorting = 'Profit desc';
  selectedStoreId: string | null = null;
  productOptions: ReportProductOption[] = [];

  filter: ReportFilterState = {
    paymentMethod: null,
    shippingMethod: null,
    externalProductId: null,
    brandName: '',
    categoryName: '',
  };

  summary: ProfitMarginReportSummary = this.emptySummary();
  netProfit = 0;

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
    private productsService: ProductsService,
    public customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
  ) {
    this.page.pageNumber = 0;
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.calculatePageSize();
    this.loadProductOptions();
    this.selectedStoreSubscription = this.customUserStoreService.selectedStore$.subscribe((value) => {
      this.selectedStoreId = this.resolveStoreId(value);
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
    this.setDefaultDateRange();
    this.filter = {
      paymentMethod: null,
      shippingMethod: null,
      externalProductId: null,
      brandName: '',
      categoryName: '',
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
      Product: row.productName,
      SKU: row.productSku,
      Brand: row.brandName,
      Category: row.categoryName,
      Quantity: row.quantity,
      Revenue: row.revenue,
      Cost: row.cost,
      Profit: row.profit,
      'Margin %': row.margin,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Margin');
    XLSX.writeFile(workbook, `online-shop-profit-margin-report-${Date.now()}.xlsx`);
  }

  formatMoney(value: number): string {
    return `${this.globalDataService.getCurrencySymbol()} ${Number(value || 0).toFixed(2)}`;
  }

  private loadData(): void {
    this.loadingIndicator = true;
    this.reportsService
      .getProfitMarginReport(this.selectedStoreId, this.filter, {
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        sorting: this.sorting,
      })
      .subscribe({
        next: (response) => {
          const result = response?.result ?? response;
          const items = (result?.items ?? result?.Items ?? []) as Record<string, unknown>[];
          this.page.totalElements = Number(result?.totalCount ?? result?.TotalCount ?? 0);
          this.rows = items.map((item) => this.reportsService.mapProfitMarginRow(item));
          if (items.length) {
            this.summary = this.reportsService.mapProfitMarginSummary(items[0]);
            this.netProfit = this.summary.profitSum + this.summary.shippingProfitSum;
          } else {
            this.summary = this.emptySummary();
            this.netProfit = 0;
          }
          this.loadingIndicator = false;
        },
        error: () => {
          this.rows = [];
          this.summary = this.emptySummary();
          this.netProfit = 0;
          this.loadingIndicator = false;
        },
      });
  }

  private loadProductOptions(): void {
    this.productsService.getProducts({ skipCount: 0, maxResultCount: 500, sorting: 'ProductName asc' }).subscribe({
      next: ({ items }) => {
        this.productOptions = items.map((item) => ({
          value: item.productId,
          label: item.productName,
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

  private emptySummary(): ProfitMarginReportSummary {
    return {
      quantitySum: 0,
      revenueSum: 0,
      costSum: 0,
      profitSum: 0,
      shippingChargesSum: 0,
      courierCostSum: 0,
      shippingProfitSum: 0,
    };
  }
}
