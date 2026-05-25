import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

interface StatusOption {
  value: string;
  label: string;
}

interface OrderProductRow {
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss'],
})
export class ManageOrderComponent implements OnInit {
  orderId: string | null = null;
  activeTabId = 1;
  isLoading = true;
  isSavingStatus = false;
  isActionBusy = false;

  detail: any = null;
  shipment: any = null;

  statusOptions: StatusOption[] = [];
  statusOptionsLoading = false;
  statusOptionsHint = '';
  selectedStatusId: string | null = null;
  statusRemarks = '';
  statusAdminNote = '';

  codPaidAmount: number | null = null;
  cancelReason = '';

  shipmentForm = {
    courierName: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingCharges: null as number | null,
    courierCost: null as number | null,
    shippedAt: '',
    remarks: '',
  };

  deliveryStatuses = [
    { value: 1, label: 'Not Started' },
    { value: 2, label: 'Local Pickup' },
    { value: 3, label: 'Pending Shipment' },
    { value: 4, label: 'Shipped' },
    { value: 5, label: 'Delivered' },
    { value: 6, label: 'Returned' },
    { value: 7, label: 'Booked' },
    { value: 8, label: 'In Process' },
    { value: 9, label: 'Cancelled' },
  ];
  selectedDeliveryStatus: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restService: RestService,
    private toastr: ToastrService,
    public globalDataService: GlobalDataService,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (!this.orderId) {
      this.toastr.error('Order id is missing.', 'Error');
      this.goBack();
      return;
    }
    this.loadOrder();
  }

  get orderNumber(): string {
    return this.detail?.onlineOrderNumber ?? this.detail?.OnlineOrderNumber ?? '—';
  }

  get statusDisplayName(): string {
    return (
      this.detail?.orderStatusDisplayName ??
      this.detail?.OrderStatusDisplayName ??
      '—'
    );
  }

  get statusColor(): string {
    return this.detail?.orderStatusColorCode ?? this.detail?.OrderStatusColorCode ?? '#6c757d';
  }

  get isCod(): boolean {
    const method = Number(this.detail?.paymentMethod ?? this.detail?.PaymentMethod ?? 0);
    return method === 1;
  }

  /** True when no manual transitions are available (remaining changes must use action buttons / events). */
  get manualStatusChangeDisabled(): boolean {
    return !this.isLoading && !!this.detail && !this.statusOptionsLoading && this.statusOptions.length === 0;
  }

  get products(): OrderProductRow[] {
    const list = this.detail?.products ?? this.detail?.Products ?? [];
    return list.map((p: any) => ({
      productName: p.productName ?? p.ProductName ?? 'Product',
      productImageUrl: p.productImageUrl ?? p.ProductImageUrl,
      quantity: Number(p.quantity ?? p.Quantity ?? 0),
      unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? 0),
      lineTotal: Number(p.lineTotal ?? p.LineTotal ?? 0),
    }));
  }

  get productsSubtotal(): number {
    return this.products.reduce((sum, p) => sum + p.lineTotal, 0);
  }

  onProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrap = img.parentElement;
    if (wrap) {
      wrap.classList.add('product-thumb-wrap--broken');
    }
  }

  get billingAddress(): any {
    return this.detail?.billingAddress ?? this.detail?.BillingAddress;
  }

  get shippingAddress(): any {
    return this.detail?.shippingAddress ?? this.detail?.ShippingAddress;
  }

  goBack(): void {
    this.router.navigate(['/online-shop/order-board']);
  }

  goToTab(tabId: number): void {
    this.activeTabId = tabId;
  }

  formatMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${this.globalDataService.getCurrencySymbol()}${Number(value).toFixed(2)}`;
  }

  display(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  paymentStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      1: 'Pending',
      2: 'Paid',
      3: 'Partially Paid',
      4: 'Over Paid',
      5: 'Failed',
      6: 'Cancelled',
      7: 'Refunded',
      8: 'Partially Refunded',
    };
    return labels[status] ?? 'Unknown';
  }

  deliveryStatusLabel(status: number): string {
    const match = this.deliveryStatuses.find((d) => d.value === status);
    return match?.label ?? 'Unknown';
  }

  saveStatus(): void {
    if (!this.orderId || !this.selectedStatusId) {
      this.toastr.warning('Select a status to apply.', 'Status');
      return;
    }

    const payload = {
      onlineShopSaleOrderId: this.orderId,
      orderStatusId: this.selectedStatusId,
      deliveryStatus: this.selectedDeliveryStatus ?? undefined,
      adminNote: this.statusAdminNote?.trim() || undefined,
      remarks: this.statusRemarks?.trim() || undefined,
    };

    this.isSavingStatus = true;
    this.restService.post(environment.urls.OnlineShopSaleOrder_UpdateStatus, payload).subscribe({
      next: () => {
        this.isSavingStatus = false;
        this.toastr.success('Order status updated.', 'Success', { progressBar: true });
        this.loadOrder();
      },
      error: (err) => {
        this.isSavingStatus = false;
        this.showError(err);
      },
    });
  }

  confirmCod(): void {
    if (!this.orderId) {
      return;
    }
    this.runAction(
      `${environment.urls.OnlineShopSaleOrder_ConfirmCod}?onlineShopSaleOrderId=${this.orderId}`,
      null,
      'Cash on delivery order confirmed.',
    );
  }

  markCodPaid(): void {
    if (!this.orderId) {
      return;
    }
    const amount = Number(this.codPaidAmount);
    if (!amount || amount <= 0) {
      this.toastr.warning('Enter a valid paid amount.', 'Payment');
      return;
    }
    this.runAction(
      `${environment.urls.OnlineShopSaleOrder_MarkCodPaid}?onlineShopSaleOrderId=${this.orderId}&paidAmount=${amount}`,
      null,
      'Payment recorded.',
    );
  }

  cancelOrder(): void {
    if (!this.orderId) {
      return;
    }
    const reason = this.cancelReason?.trim();
    if (!reason) {
      this.toastr.warning('Enter a cancellation reason.', 'Cancel');
      return;
    }
    this.runAction(
      `${environment.urls.OnlineShopSaleOrder_Cancel}?onlineShopSaleOrderId=${this.orderId}&reason=${encodeURIComponent(reason)}`,
      null,
      'Order cancelled.',
    );
  }

  saveShipment(): void {
    if (!this.orderId) {
      return;
    }
    const payload = {
      onlineShopSaleOrderId: this.orderId,
      courierName: this.shipmentForm.courierName?.trim() || undefined,
      trackingNumber: this.shipmentForm.trackingNumber?.trim() || undefined,
      trackingUrl: this.shipmentForm.trackingUrl?.trim() || undefined,
      shippingCharges: Number(this.shipmentForm.shippingCharges ?? 0),
      courierCost: this.shipmentForm.courierCost ?? undefined,
      shippedAt: this.shipmentForm.shippedAt ? new Date(this.shipmentForm.shippedAt).toISOString() : undefined,
      remarks: this.shipmentForm.remarks?.trim() || undefined,
    };

    this.isActionBusy = true;
    this.restService.post(environment.urls.OnlineShopSaleOrder_SaveShipment, payload).subscribe({
      next: () => {
        this.isActionBusy = false;
        this.toastr.success('Shipment saved.', 'Success', { progressBar: true });
        this.loadShipment();
        this.loadOrder();
      },
      error: (err) => {
        this.isActionBusy = false;
        this.showError(err);
      },
    });
  }

  markDelivered(): void {
    if (!this.orderId) {
      return;
    }
    const payload = {
      onlineShopSaleOrderId: this.orderId,
      remarks: this.shipmentForm.remarks?.trim() || undefined,
    };
    this.isActionBusy = true;
    this.restService.post(environment.urls.OnlineShopSaleOrder_MarkDelivered, payload).subscribe({
      next: () => {
        this.isActionBusy = false;
        this.toastr.success('Shipment marked as delivered.', 'Success', { progressBar: true });
        this.loadShipment();
        this.loadOrder();
      },
      error: (err) => {
        this.isActionBusy = false;
        this.showError(err);
      },
    });
  }

  private runAction(url: string, body: any, successMessage: string): void {
    this.isActionBusy = true;
    this.restService.post(url, body).subscribe({
      next: () => {
        this.isActionBusy = false;
        this.toastr.success(successMessage, 'Success', { progressBar: true });
        this.loadOrder();
      },
      error: (err) => {
        this.isActionBusy = false;
        this.showError(err);
      },
    });
  }

  private loadOrder(): void {
    this.isLoading = true;
    const detailUrl = `${environment.urls.OnlineShopSaleOrder_GetDetail}?onlineShopSaleOrderId=${this.orderId}`;

    this.restService.get(detailUrl).subscribe({
      next: (response) => {
        this.detail = this.normalizeDetail(response?.result ?? response);
        this.statusAdminNote = this.detail?.adminNote ?? '';
        this.selectedDeliveryStatus = Number(
          this.detail?.deliveryStatus ?? this.detail?.DeliveryStatus ?? 0,
        ) || null;
        this.codPaidAmount = Number(
          this.detail?.remainingAmount ?? this.detail?.RemainingAmount ?? 0,
        ) || null;
        this.isLoading = false;
        this.loadStatusOptions();
        this.loadShipment();
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err);
      },
    });
  }

  private loadStatusOptions(): void {
    if (!this.orderId) {
      return;
    }

    this.statusOptionsLoading = true;
    this.statusOptionsHint = '';
    const currentStatusId = String(this.detail?.orderStatusId ?? '');

    const url = `${environment.urls.OnlineShopSaleOrder_GetNextStatuses}?onlineShopSaleOrderId=${this.orderId}`;
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        const options = this.normalizeStatusOptions(response);
        this.applyStatusOptions(options, this.buildStatusOptionsHint(options.length));
      },
      error: () => {
        this.applyStatusOptions([], 'Unable to load statuses.');
      },
    });
  }

  private buildStatusOptionsHint(optionCount: number): string {
    if (optionCount > 0) {
      return '';
    }
    return 'No manual status changes are available. Use the action buttons on the tabs below (for example Confirm COD, Cancel order, or Mark delivered) so the configured status events run correctly.';
  }

  private normalizeStatusOptions(response: any): StatusOption[] {
    let items = response?.result ?? response;
    if (items && !Array.isArray(items) && Array.isArray(items.items)) {
      items = items.items;
    }
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => ({
        value: String(item.id ?? item.Id ?? item.value ?? item.Value ?? ''),
        label: String(
          item.displayName ?? item.DisplayName ?? item.label ?? item.Label ?? '',
        ),
      }))
      .filter((option) => option.value && option.label);
  }

  private applyStatusOptions(options: StatusOption[], hint: string): void {
    this.statusOptions = [...options];
    this.statusOptionsHint = hint;
    this.selectedStatusId = null;
    this.statusOptionsLoading = false;
  }

  private loadShipment(): void {
    if (!this.orderId) {
      return;
    }
    const url = `${environment.urls.OnlineShopSaleOrder_GetShipment}?onlineShopSaleOrderId=${this.orderId}`;
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        this.shipment = response?.result ?? response;
        if (!this.shipment) {
          return;
        }
        this.shipmentForm = {
          courierName: this.shipment.courierName ?? this.shipment.CourierName ?? '',
          trackingNumber: this.shipment.trackingNumber ?? this.shipment.TrackingNumber ?? '',
          trackingUrl: this.shipment.trackingUrl ?? this.shipment.TrackingUrl ?? '',
          shippingCharges: this.shipment.shippingCharges ?? this.shipment.ShippingCharges ?? null,
          courierCost: this.shipment.courierCost ?? this.shipment.CourierCost ?? null,
          shippedAt: this.toDateInput(this.shipment.shippedAt ?? this.shipment.ShippedAt),
          remarks: this.shipment.remarks ?? this.shipment.Remarks ?? '',
        };
      },
      error: () => {
        this.shipment = null;
      },
    });
  }

  private normalizeDetail(raw: any): any {
    if (!raw) {
      return null;
    }
    return {
      onlineShopSaleOrderId: raw.onlineShopSaleOrderId ?? raw.OnlineShopSaleOrderId,
      onlineOrderNumber: raw.onlineOrderNumber ?? raw.OnlineOrderNumber,
      orderDate: raw.orderDate ?? raw.OrderDate,
      subTotalAmount: raw.subTotalAmount ?? raw.SubTotalAmount,
      shippingCharges: raw.shippingCharges ?? raw.ShippingCharges,
      taxAmount: raw.taxAmount ?? raw.TaxAmount,
      discountAmount: raw.discountAmount ?? raw.DiscountAmount,
      totalAmount: raw.totalAmount ?? raw.TotalAmount,
      paidAmount: raw.paidAmount ?? raw.PaidAmount,
      remainingAmount: raw.remainingAmount ?? raw.RemainingAmount,
      shippingMethodName: raw.shippingMethodName ?? raw.ShippingMethodName,
      paymentMethod: raw.paymentMethod ?? raw.PaymentMethod,
      paymentMethodName: raw.paymentMethodName ?? raw.PaymentMethodName,
      paymentStatus: raw.paymentStatus ?? raw.PaymentStatus,
      deliveryStatus: raw.deliveryStatus ?? raw.DeliveryStatus,
      orderStatusId: raw.orderStatusId ?? raw.OrderStatusId,
      orderStatusDisplayName: raw.orderStatusDisplayName ?? raw.OrderStatusDisplayName,
      orderStatusColorCode: raw.orderStatusColorCode ?? raw.OrderStatusColorCode,
      adminNote: raw.adminNote ?? raw.AdminNote,
      products: raw.products ?? raw.Products ?? [],
      billingAddress: this.normalizeAddress(raw.billingAddress ?? raw.BillingAddress),
      shippingAddress: this.normalizeAddress(raw.shippingAddress ?? raw.ShippingAddress),
    };
  }

  private normalizeAddress(addr: any): any {
    if (!addr) {
      return null;
    }
    return {
      customerName: addr.customerName ?? addr.CustomerName,
      phone: addr.phone ?? addr.Phone,
      emailAddress: addr.emailAddress ?? addr.EmailAddress,
      address: addr.address ?? addr.Address,
      townCity: addr.townCity ?? addr.TownCity,
      stateCounty: addr.stateCounty ?? addr.StateCounty,
      postalCode: addr.postalCode ?? addr.PostalCode,
    };
  }

  private toDateInput(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString().slice(0, 16);
  }

  private showError(err: any): void {
    const message = err?.error?.error?.message ?? err?.message ?? 'Something went wrong.';
    this.toastr.error(message, 'Error', { progressBar: true });
  }
}
