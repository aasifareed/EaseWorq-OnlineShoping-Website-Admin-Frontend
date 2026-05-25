import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  OrderDetailModalComponent,
  OrderListRow,
} from '../online-orders/order-detail-modal/order-detail-modal.component';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

export interface OrderBoardStatusGroup {
  id: string;
  propertyName: string;
  displayName: string;
  color: string;
  orderNumber: number;
}

export interface OrderBoardCard extends OrderListRow {
  propertyName: string;
  date?: string | Date;
  storeId?: string;
  paymentMethodName?: string;
  shippingMethod?: number;
  shippingMethodName?: string;
  shippingReceiverName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingTownCity?: string;
  shippingStateCounty?: string;
  shippingPostalCode?: string;
  ageDays: number;
}

interface FilterOption {
  value: number | null;
  label: string;
}

@Component({
  selector: 'app-order-board',
  templateUrl: './order-board.component.html',
  styleUrls: ['./order-board.component.scss'],
})
export class OrderBoardComponent implements OnInit, OnDestroy {
  showFilter = true;
  isLoading = false;
  searchControl = new FormControl('');

  filter: {
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    statusId?: string | null;
    paymentMethod?: number | null;
    shippingMethod?: number | null;
  } = { statusId: null, paymentMethod: null, shippingMethod: null };

  readonly paymentMethodOptions: FilterOption[] = [
    { value: null, label: 'All Payment Methods' },
    { value: 1, label: 'Cash on Delivery' },
    { value: 2, label: 'PayFast' },
  ];

  readonly shippingMethodOptions: FilterOption[] = [
    { value: null, label: 'All Shipping Methods' },
    { value: 1, label: 'Local Pickup' },
    { value: 2, label: 'Shipping' },
  ];

  statusGroups: OrderBoardStatusGroup[] = [];
  ordersByStatus: Record<string, OrderBoardCard[]> = {};
  private allOrders: OrderBoardCard[] = [];
  private selectedStoreSubscription: Subscription;
  private cardClickTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private restService: RestService,
    private router: Router,
    private modalService: NgbModal,
    public customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
  ) {}

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.selectedStoreSubscription = this.customUserStoreService.selectedStore$.subscribe((value) => {
      if (value == null || (Array.isArray(value) && value.length === 0)) {
        this.loadBoard(this.customUserStoreService.getDefaultStoreId());
      } else {
        this.loadBoard(value);
      }
    });

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      this.filter.keyword = value || undefined;
      this.loadOrders(this.customUserStoreService.selectedUserStore);
    });
  }

  ngOnDestroy(): void {
    if (this.cardClickTimer) {
      clearTimeout(this.cardClickTimer);
    }
    this.selectedStoreSubscription?.unsubscribe();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  search(): void {
    this.loadBoard(this.customUserStoreService.selectedUserStore);
  }

  resetSearch(): void {
    this.searchControl.setValue(null, { emitEvent: false });
    this.filter.keyword = undefined;
    this.filter.statusId = null;
    this.filter.paymentMethod = null;
    this.filter.shippingMethod = null;
    this.setDefaultDateRange();
    this.loadBoard(this.customUserStoreService.selectedUserStore);
  }

  filterByStatus(statusId: string | null): void {
    this.filter.statusId = statusId;
    this.applyGrouping();
  }

  getTotalCount(): number {
    return this.allOrders.length;
  }

  getStatusCount(statusGroup: OrderBoardStatusGroup): number {
    return this.allOrders.filter((o) => o.orderStatusId === statusGroup.id).length;
  }

  getRowOrderCount(statusGroup: OrderBoardStatusGroup): number {
    return this.getOrdersForStatus(statusGroup.propertyName).length;
  }

  getOrdersForStatus(propertyName: string): OrderBoardCard[] {
    return this.ordersByStatus[propertyName] ?? [];
  }

  isBoardEmpty(): boolean {
    return this.getFilteredOrders().length === 0;
  }

  getDaysSince(dateValue: string | Date): number {
    if (!dateValue) {
      return 0;
    }
    const orderDate = new Date(dateValue);
    const now = new Date();
    const diff = now.getTime() - orderDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  getPaymentLabel(card: OrderBoardCard): string {
    if (card.paymentMethod === 1) {
      return 'Cash on Delivery';
    }
    if (card.paymentMethod === 2) {
      return 'PayFast';
    }
    return card.paymentMethodName || 'Payment';
  }

  getShippingMethodLabel(card: OrderBoardCard): string {
    if (card.shippingMethod === 1) {
      return 'Local Pickup';
    }
    if (card.shippingMethod === 2) {
      return 'Shipping';
    }
    return card.shippingMethodName || '—';
  }

  getShippingAddressSummary(card: OrderBoardCard): string {
    const line = [card.shippingAddress, card.shippingTownCity, card.shippingStateCounty, card.shippingPostalCode]
      .filter((part) => !!part && String(part).trim())
      .join(', ');
    return line || '—';
  }

  openManageOrder(card: OrderBoardCard, event?: MouseEvent): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (this.cardClickTimer) {
      clearTimeout(this.cardClickTimer);
      this.cardClickTimer = null;
    }
    this.router.navigate(['/online-shop/orders/manage', card.id]);
  }

  openOrder(card: OrderBoardCard): void {
    if (this.cardClickTimer) {
      clearTimeout(this.cardClickTimer);
    }
    this.cardClickTimer = setTimeout(() => {
      this.cardClickTimer = null;
      this.openOrderModal(card);
    }, 250);
  }

  private openOrderModal(card: OrderBoardCard): void {
    const modalRef = this.modalService.open(OrderDetailModalComponent, {
      size: 'lg',
      backdrop: 'static',
      scrollable: false,
      centered: true,
      keyboard: false,
      windowClass: 'orderDetailModal',
    });

    const row: OrderListRow = { ...card };
    modalRef.componentInstance.orderRow = row;
  }

  private setDefaultDateRange(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.filter.toDate = this.toDateInputValue(to);
    this.filter.fromDate = this.toDateInputValue(from);
  }

  private toDateInputValue(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private loadBoard(storeId: string | string[]): void {
    const resolvedStoreId = this.resolveStoreId(storeId);
    if (!resolvedStoreId) {
      this.statusGroups = [];
      this.ordersByStatus = {};
      this.allOrders = [];
      return;
    }

    this.isLoading = true;
    this.restService
      .get(`${environment.urls.GetAllStatuses}?maxResultCount=500&skipCount=0`)
      .subscribe({
        next: (response) => {
          const items = response?.result?.items ?? [];
          this.statusGroups = items
            .map((s: any) => ({
              id: String(s.id ?? s.Id),
              propertyName: String(s.statusName ?? s.StatusName ?? s.displayName ?? s.DisplayName),
              displayName: String(s.displayName ?? s.DisplayName ?? s.statusName ?? s.StatusName),
              color: s.colorCode ?? s.ColorCode ?? '#6c757d',
              orderNumber: Number(s.orderNumber ?? s.OrderNumber ?? 0),
            }))
            .sort((a, b) => a.orderNumber - b.orderNumber);

          this.loadOrders(storeId);
        },
        error: () => {
          this.isLoading = false;
          this.statusGroups = [];
          this.loadOrders(storeId);
        },
      });
  }

  private loadOrders(storeId: string | string[]): void {
    const resolvedStoreId = this.resolveStoreId(storeId);
    if (!resolvedStoreId) {
      this.isLoading = false;
      return;
    }

    let url = `${environment.urls.OnlineShopSaleOrder_GetAll}?storeId=${encodeURIComponent(resolvedStoreId)}&skipCount=0&maxResultCount=1000`;
    if (this.filter.keyword) {
      url += `&keyword=${encodeURIComponent(this.filter.keyword)}`;
    }
    if (this.filter.paymentMethod != null) {
      url += `&paymentMethod=${this.filter.paymentMethod}`;
    }
    if (this.filter.shippingMethod != null) {
      url += `&shippingMethod=${this.filter.shippingMethod}`;
    }

    this.restService.get(url).subscribe({
      next: (response) => {
        const items = response?.result?.items ?? [];
        this.allOrders = items.map((item: any) => this.mapToCard(item));
        this.applyClientDateFilter();
        this.applyGrouping();
        this.isLoading = false;
      },
      error: () => {
        this.allOrders = [];
        this.ordersByStatus = {};
        this.isLoading = false;
      },
    });
  }

  private mapToCard(item: any): OrderBoardCard {
    const statusGroup = this.statusGroups.find(
      (g) => g.id === String(item.orderStatusId ?? item.OrderStatusId),
    );
    const propertyName =
      statusGroup?.propertyName ??
      String(item.orderStatusName ?? item.OrderStatusName ?? 'Unknown');

    const totalAmount = Number(item.totalAmount ?? 0);
    const paidAmount = Number(item.paidAmount ?? 0);
    const orderDate = item.orderDate ?? item.OrderDate;

    return {
      id: String(item.id ?? item.Id),
      orderNumber: item.onlineOrderNumber ?? item.OnlineOrderNumber,
      storeId: item.storeId ?? item.StoreId,
      storeName: this.getStoreName(item.storeId ?? item.StoreId),
      customerName: item.customerName ?? item.CustomerName,
      phone: item.phone ?? item.Phone,
      orderStatusId: String(item.orderStatusId ?? item.OrderStatusId ?? ''),
      orderStatusDisplayName:
        item.orderStatusDisplayName ??
        item.OrderStatusDisplayName ??
        item.orderStatusName ??
        item.OrderStatusName,
      orderStatusColorCode: item.orderStatusColorCode ?? item.OrderStatusColorCode,
      paymentMethod: item.paymentMethod ?? item.PaymentMethod,
      paymentStatus: item.paymentStatus ?? item.PaymentStatus,
      deliveryStatus: item.deliveryStatus ?? item.DeliveryStatus,
      totalAmount,
      totalPaidAmount: paidAmount,
      remainingAmount: Math.max(0, totalAmount - paidAmount),
      date: orderDate,
      propertyName,
      paymentMethodName:
        item.paymentMethodName ??
        item.PaymentMethodName ??
        (item.paymentMethod === 1 || item.PaymentMethod === 1
          ? 'Cash on Delivery'
          : item.paymentMethod === 2 || item.PaymentMethod === 2
            ? 'PayFast'
            : ''),
      shippingMethod: item.shippingMethod ?? item.ShippingMethod,
      shippingMethodName: item.shippingMethodName ?? item.ShippingMethodName,
      shippingReceiverName: item.shippingReceiverName ?? item.ShippingReceiverName,
      shippingPhone: item.shippingPhone ?? item.ShippingPhone ?? item.phone ?? item.Phone,
      shippingAddress: item.shippingAddress ?? item.ShippingAddress,
      shippingTownCity: item.shippingTownCity ?? item.ShippingTownCity,
      shippingStateCounty: item.shippingStateCounty ?? item.ShippingStateCounty,
      shippingPostalCode: item.shippingPostalCode ?? item.ShippingPostalCode,
      ageDays: this.getDaysSince(orderDate),
    };
  }

  private applyClientDateFilter(): void {
    if (!this.filter.fromDate && !this.filter.toDate) {
      return;
    }
    const from = this.filter.fromDate ? new Date(this.filter.fromDate) : null;
    const to = this.filter.toDate ? new Date(this.filter.toDate) : null;
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    this.allOrders = this.allOrders.filter((order) => {
      if (!order.date) {
        return true;
      }
      const d = new Date(order.date);
      if (from && d < from) {
        return false;
      }
      if (to && d > to) {
        return false;
      }
      return true;
    });
  }

  private getFilteredOrders(): OrderBoardCard[] {
    if (!this.filter.statusId) {
      return this.allOrders;
    }
    return this.allOrders.filter((o) => o.orderStatusId === this.filter.statusId);
  }

  private applyGrouping(): void {
    const orders = this.getFilteredOrders();
    const grouped: Record<string, OrderBoardCard[]> = {};

    this.statusGroups.forEach((g) => {
      grouped[g.propertyName] = [];
    });
    grouped['Unknown'] = [];

    orders.forEach((order) => {
      const key = order.propertyName || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
      );
    });

    this.ordersByStatus = grouped;
  }

  private getStoreName(storeId: string): string {
    const store = this.customUserStoreService.customeStores?.find(
      (s) => String(s.value) === String(storeId),
    );
    return store?.label ?? '';
  }

  private resolveStoreId(storeId: string | string[]): string | null {
    if (Array.isArray(storeId)) {
      return storeId.length ? String(storeId[0]) : null;
    }
    return storeId ? String(storeId) : null;
  }
}
