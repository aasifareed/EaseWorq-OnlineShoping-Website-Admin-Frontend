import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { Page } from 'src/app/shared/models/page';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { OrderListRow } from '../order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit, OnDestroy {
  ColumnMode = ColumnMode;
  filteredData: any[] = [];
  searchControl: FormControl = new FormControl();
  gridHeight = '100%';
  loadingIndicator = true;
  filter: Record<string, any> = {};
  page = new Page();
  totalAmountSum = 0;
  paidAmountSum = 0;
  remaningAmountSum = 0;

  private selectedStoreSubscription: Subscription;

  constructor(
    private restService: RestService,
    public _customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
    private el: ElementRef,
    private renderer: Renderer2,
    private router: Router,
  ) {
    this.page.pageNumber = 0;
  }

  ngOnInit(): void {
    this.selectedStoreSubscription = this._customUserStoreService.selectedStore$.subscribe((value) => {
      if (value == null || value.length === 0) {
        this.calculatePageSize(this._customUserStoreService.getDefaultStoreId());
      } else {
        this.calculatePageSize(value);
      }
    });

    this.searchControl.valueChanges.pipe(debounceTime(200)).subscribe((value) => {
      this.page.pageNumber = 0;
      this.filter.keyword = value;
      this.getData(this._customUserStoreService.selectedUserStore);
    });
  }

  ngOnDestroy(): void {
    this.selectedStoreSubscription?.unsubscribe();
  }

  resetSearch(): void {
    this.searchControl.setValue(null);
    delete this.filter.keyword;
    this.page.pageNumber = 0;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  search(): void {
    this.page.pageNumber = 0;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  setPage(pageInfo: { offset: number }): void {
    this.page.pageNumber = pageInfo.offset;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  onSort(event: { sorts: { prop: string; dir: string }[] }): void {
    this.page.pageNumber = 0;
    this.filter.sorting = event.sorts[0].prop + ' ' + event.sorts[0].dir;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  setFilterURL(): string {
    let path = '';
    Object.keys(this.filter).forEach((key) => {
      if (this.filter[key] !== undefined && this.filter[key] !== null && this.filter[key] !== '') {
        path = path ? path + '&' : '?';
        path = path + key + '=' + encodeURIComponent(this.filter[key]);
      }
    });
    return path;
  }

  getData(storeId: string | string[]): void {
    const resolvedStoreId = this.resolveStoreId(storeId);
    if (!resolvedStoreId) {
      this.filteredData = [];
      this.loadingIndicator = false;
      return;
    }

    this.loadingIndicator = true;
    this.filter.maxResultCount = this.page.size;
    this.filter.skipCount = this.page.pageNumber * this.page.size;
    this.filter.storeId = resolvedStoreId;

    const url = this.setFilterURL();

    this.restService.get(`${environment.urls.OnlineShopSaleOrder_GetAll + url}`).subscribe(
      (response) => {
        this.totalAmountSum = 0;
        this.paidAmountSum = 0;
        this.remaningAmountSum = 0;

        if (response?.result?.items) {
          const data = response.result.items.map((item: any) => this.mapOrderRow(item));
          this.filteredData = [...data];

          this.totalAmountSum = data.reduce((sum: number, row: any) => sum + (row.totalAmount || 0), 0);
          this.paidAmountSum = data.reduce((sum: number, row: any) => sum + (row.totalPaidAmount || 0), 0);
          this.remaningAmountSum = data.reduce((sum: number, row: any) => sum + (row.remainingAmount || 0), 0);

          this.page.totalElements = response.result.totalCount;
          this.page.totalPages = Math.ceil(response.result.totalCount / this.page.size) || 0;
        } else {
          this.filteredData = [];
          this.page.totalElements = 0;
          this.page.totalPages = 0;
        }

        this.loadingIndicator = false;
      },
      () => {
        this.loadingIndicator = false;
        this.filteredData = [];
      }
    );
  }

  private mapOrderRow(item: any): any {
    const totalAmount = Number(item.totalAmount ?? 0);
    const paidAmount = Number(item.paidAmount ?? 0);
    return {
      id: item.id,
      orderNumber: item.onlineOrderNumber,
      storeId: item.storeId,
      storeName: this.getStoreName(item.storeId),
      customerName: item.customerName,
      orderStatusId: item.orderStatusId,
      orderStatusDisplayName: item.orderStatusDisplayName || item.orderStatusName,
      orderStatusColorCode: item.orderStatusColorCode,
      paymentMethod: item.paymentMethod,
      totalAmount,
      totalPaidAmount: paidAmount,
      remainingAmount: Math.max(0, totalAmount - paidAmount),
      date: item.orderDate,
      phone: item.phone,
      paymentStatus: item.paymentStatus,
      deliveryStatus: item.deliveryStatus
    };
  }

  private resolveStoreId(storeId: string | string[]): string | null {
    if (Array.isArray(storeId)) {
      return storeId.length ? String(storeId[0]) : null;
    }
    return storeId ? String(storeId) : null;
  }

  editOrder(row: OrderListRow): void {
    this.router.navigate(['/online-shop/orders/manage', row.id]);
  }

  getStoreName(storeId: string): string {
    const store = this._customUserStoreService.customeStores?.find(
      (s) => String(s.value) === String(storeId)
    );
    return store?.label ?? '';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculatePageSize(this._customUserStoreService.selectedUserStore);
  }

  calculatePageSize(storeId: string | string[]): void {
    const rowHeight = 40;
    const headerFooterHeight = 135;
    let availableHeight = window.innerHeight - headerFooterHeight;

    const mainHeaderElement = this.renderer.selectRootElement('.main-header', true);
    const mainHeaderElementHeight = mainHeaderElement ? mainHeaderElement.offsetHeight : 0;
    availableHeight -= mainHeaderElementHeight;

    const tabElement = this.renderer.selectRootElement('.tabs__links', true);
    const tabElementHeight = tabElement ? tabElement.offsetHeight : 0;
    availableHeight -= tabElementHeight;

    const gridAboveHeightElement = this.el.nativeElement.querySelector('.gridAboveHeightInSaleOrderHistory');
    const gridAboveHeightElementHeight = gridAboveHeightElement ? gridAboveHeightElement.offsetHeight : 0;
    availableHeight -= gridAboveHeightElementHeight;

    this.page.size = Math.floor(availableHeight / rowHeight);
    if (this.page.size <= 0) {
      this.page.size = 10;
    }
    this.getData(storeId);
  }
}
