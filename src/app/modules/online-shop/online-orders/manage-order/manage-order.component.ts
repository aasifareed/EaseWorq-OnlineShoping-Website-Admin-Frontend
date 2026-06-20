import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { ConfirmationDialogService } from 'src/app/shared/services/confirmation-dialog.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

interface StatusOption {
  value: string;
  label: string;
  isEventDriven?: boolean;
  eventName?: string;
  eventDisplayName?: string;
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
  private static readonly STATUS_TIMELINE_PATH = '/OnlineShopSaleOrder/GetOnlineShopOrderStatusTimeline';

  @ViewChild('trackOrderModal') trackOrderModal!: TemplateRef<unknown>;

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
  shipmentHistoryRemarks = '';
  deliveryStatusText = '';
  showDeliveryStatusSuggestions = false;
  filteredDeliveryStatusSuggestions: string[] = [];
  deliveryStatusSuggestionIndex = -1;

  codPaidAmount: number | null = null;

  trackModalLoading = false;
  trackModalError = '';
  orderTimeline: any = null;
  private trackModalRef: NgbModalRef | null = null;
  private readonly modalOptions = {
    centered: true,
    scrollable: true,
    windowClass: 'manage-order-modal-90',
  };

  shipmentForm = {
    courierName: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingCharges: null as number | null,
    courierCost: null as number | null,
    shippedAt: '',
    remarks: '',
    claimStatus: null as number | null,
    claimAmountReceived: null as number | null,
    claimAccountId: null as string | null,
    claimAccountLabel: '' as string,
    cargoClaimTransactionReference: '' as string,
    cargoClaimReceivedAt: '' as string,
  };

  claimAccountOptions: { value: string; label: string }[] = [];
  claimStatusSelectValue: string | null = null;

  readonly claimStatusOptions = [
    { value: 1, label: 'Lost - Refund Pending' },
    { value: 2, label: 'Lost - Claim Filed' },
    { value: 3, label: 'Lost - Under Review' },
    { value: 4, label: 'Lost - Non-Refundable' },
    { value: 5, label: 'Claim Received' },
  ];

  readonly claimStatusSelectOptions = this.claimStatusOptions.map((option) => ({
    value: String(option.value),
    label: option.label,
  }));

  readonly claimReceivedStatusValue = 5;

  deliveryStatusSuggestions: string[] = [];

  private static readonly DeliveryStatusFallback: string[] = [
    'Not Started',
    'Local Pickup',
    'Pending Shipment',
    'Shipped',
    'Delivered',
    'Returned',
    'Booked',
    'In Process',
    'Cancelled',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restService: RestService,
    private toastr: ToastrService,
    private confirmationDialog: ConfirmationDialogService,
    private modalService: NgbModal,
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
    this.loadDeliveryStatusSuggestions();
    this.loadClaimAccounts();
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

  get requiresManualFulfillment(): boolean {
    const shipment = this.detail?.shipment ?? this.shipment;
    return !!(
      shipment?.requiresManualFulfillment ??
      shipment?.RequiresManualFulfillment
    )
      || shipment?.shippingFulfillmentStatus === 'manual_fulfillment_required'
      || shipment?.ShippingFulfillmentStatus === 'manual_fulfillment_required';
  }

  get manualStatusChangeDisabled(): boolean {
    return !this.isLoading && !!this.detail && !this.statusOptionsLoading && this.statusOptions.length === 0;
  }

  get selectedStatusOption(): StatusOption | undefined {
    if (!this.selectedStatusId) {
      return undefined;
    }
    return this.statusOptions.find((option) => option.value === this.selectedStatusId);
  }

  get selectedStatusRequiresRemarks(): boolean {
    const option = this.selectedStatusOption;
    return !!option?.isEventDriven
      && (option.eventName === 'CancelOnlineOrder'
        || option.eventName === 'OnlineSalesOrderReturned');
  }

  get selectedStatusRemarksLabel(): string {
    const option = this.selectedStatusOption;
    if (option?.eventName === 'OnlineSalesOrderReturned') {
      return 'Return reason';
    }
    if (option?.eventName === 'CancelOnlineOrder') {
      return 'Cancellation reason';
    }
    return 'Remarks';
  }

  get selectedStatusRemarksPlaceholder(): string {
    const option = this.selectedStatusOption;
    if (option?.eventName === 'OnlineSalesOrderReturned') {
      return 'Required — explain why this order is being returned';
    }
    if (option?.eventName === 'CancelOnlineOrder') {
      return 'Required — explain why this order is being cancelled';
    }
    return 'Optional note for order history';
  }

  get isCodRefundAction(): boolean {
    return this.isRefundAction && this.isCod;
  }

  get isRefundAction(): boolean {
    return this.selectedStatusOption?.eventName === 'OnlineSalesOrderRefunded';
  }

  get paidAmount(): number {
    return Number(this.detail?.paidAmount ?? this.detail?.PaidAmount ?? 0);
  }

  get showClaimAmountReceived(): boolean {
    return this.showCargoClaimEntry && Number(this.shipmentForm.claimStatus) === this.claimReceivedStatusValue;
  }

  get claimReceiptAlreadyRecorded(): boolean {
    return !!this.cargoClaimTransactionId;
  }

  get cargoClaimTransactionId(): string | null {
    return this.shipment?.cargoClaimTransactionId
      ?? this.shipment?.CargoClaimTransactionId
      ?? this.detail?.shipment?.cargoClaimTransactionId
      ?? this.detail?.shipment?.CargoClaimTransactionId
      ?? null;
  }

  get showClaimTrackingInfo(): boolean {
    const claimStatus = Number(
      this.shipmentForm.claimStatus
      ?? this.shipment?.claimStatus
      ?? this.shipment?.ClaimStatus
      ?? 0,
    );
    return claimStatus === this.claimReceivedStatusValue && this.claimReceiptAlreadyRecorded;
  }

  get showCargoClaimEntry(): boolean {
    return this.isShipmentLost && !this.claimReceiptAlreadyRecorded;
  }

  get showCargoClaimSection(): boolean {
    return this.showCargoClaimEntry || this.showClaimTrackingInfo;
  }

  get showClaimAccountSelection(): boolean {
    return this.showClaimAmountReceived && !this.claimReceiptAlreadyRecorded;
  }

  get selectedClaimAccountLabel(): string {
    if (this.shipmentForm.claimAccountLabel) {
      return this.shipmentForm.claimAccountLabel;
    }

    const accountId = this.shipmentForm.claimAccountId;
    if (!accountId) {
      return '—';
    }

    return this.claimAccountOptions.find((account) => account.value === accountId)?.label ?? '—';
  }

  get isShipmentLost(): boolean {
    return !!(this.detail?.isShipmentLost ?? this.detail?.IsShipmentLost);
  }

  get defaultRefundAmount(): number {
    return this.paidAmount > 0 ? this.paidAmount : 0;
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

  openTrackOrderModal(): void {
    if (!this.orderId) {
      return;
    }

    this.trackModalLoading = true;
    this.trackModalError = '';
    this.orderTimeline = null;
    this.trackModalRef = this.modalService.open(this.trackOrderModal, {
      ...this.modalOptions,
      windowClass: 'manage-order-modal-90 manage-order-track-modal',
    });

    const timelinePath =
      environment.urls?.OnlineShopSaleOrder_GetStatusTimeline
      || ManageOrderComponent.STATUS_TIMELINE_PATH;
    const url = `${timelinePath}?onlineShopSaleOrderId=${encodeURIComponent(this.orderId)}`;
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        this.orderTimeline = this.normalizeTimeline(response?.result ?? response);
        this.trackModalLoading = false;
      },
      error: (err) => {
        this.trackModalLoading = false;
        this.trackModalError = this.resolveErrorMessage(err, 'Could not load order status history.');
      },
    });
  }

  closeTrackModal(): void {
    this.trackModalRef?.close();
    this.trackModalRef = null;
  }

  get chronologicalTimelineItems(): any[] {
    const items = this.orderTimeline?.items ?? [];
    if (!items.length) {
      return [];
    }
    return [...items].reverse();
  }

  timelineStatusLabel(item: { orderStatusDisplayName?: string }): string {
    return item?.orderStatusDisplayName?.trim() || 'Update';
  }

  timelineMeta(item: {
    paymentStatusName?: string;
    oldPaymentStatusName?: string;
    deliveryStatus?: string;
    oldDeliveryStatus?: string;
  }): string[] {
    const parts: string[] = [];

    if (item.oldPaymentStatusName && item.paymentStatusName && item.oldPaymentStatusName !== item.paymentStatusName) {
      parts.push(`Payment: ${item.oldPaymentStatusName} → ${item.paymentStatusName}`);
    } else if (item.paymentStatusName) {
      parts.push(`Payment: ${item.paymentStatusName}`);
    }

    if (item.oldDeliveryStatus && item.deliveryStatus && item.oldDeliveryStatus !== item.deliveryStatus) {
      parts.push(`Delivery: ${item.oldDeliveryStatus} → ${item.deliveryStatus}`);
    } else if (item.deliveryStatus) {
      parts.push(`Delivery: ${item.deliveryStatus}`);
    }

    return parts;
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '—';
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
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

  deliveryStatusLabel(status: number | string | null | undefined): string {
    if (status === null || status === undefined || status === '') {
      return '—';
    }

    const text = String(status).trim();
    const numeric = Number(text);
    if (Number.isFinite(numeric) && numeric > 0) {
      const legacyLabels: Record<number, string> = {
        1: 'Not Started',
        2: 'Local Pickup',
        3: 'Pending Shipment',
        4: 'Shipped',
        5: 'Delivered',
        6: 'Returned',
        7: 'Booked',
        8: 'In Process',
        9: 'Cancelled',
      };
      return legacyLabels[numeric] ?? text;
    }

    return text;
  }

  onDeliveryStatusInput(): void {
    this.filterDeliveryStatusSuggestions();
    this.showDeliveryStatusSuggestions = this.filteredDeliveryStatusSuggestions.length > 0;
    this.deliveryStatusSuggestionIndex = -1;
  }

  onDeliveryStatusFocus(): void {
    this.filterDeliveryStatusSuggestions();
    this.showDeliveryStatusSuggestions = this.filteredDeliveryStatusSuggestions.length > 0;
    this.deliveryStatusSuggestionIndex = -1;
  }

  onDeliveryStatusBlur(): void {
    this.normalizeDeliveryStatusInput();
    window.setTimeout(() => {
      this.showDeliveryStatusSuggestions = false;
      this.deliveryStatusSuggestionIndex = -1;
    }, 150);
  }

  normalizeDeliveryStatusInput(): void {
    const typed = (this.deliveryStatusText ?? '').trim();
    if (!typed) {
      return;
    }

    const match = this.deliveryStatusSuggestions.find(
      (suggestion) => suggestion.localeCompare(typed, undefined, { sensitivity: 'accent' }) === 0,
    );

    if (match) {
      this.deliveryStatusText = match;
    }
  }

  onDeliveryStatusKeydown(event: KeyboardEvent): void {
    if (!this.showDeliveryStatusSuggestions || !this.filteredDeliveryStatusSuggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.deliveryStatusSuggestionIndex = Math.min(
        this.deliveryStatusSuggestionIndex + 1,
        this.filteredDeliveryStatusSuggestions.length - 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.deliveryStatusSuggestionIndex = Math.max(this.deliveryStatusSuggestionIndex - 1, 0);
      return;
    }

    if (event.key === 'Enter' && this.deliveryStatusSuggestionIndex >= 0) {
      event.preventDefault();
      this.selectDeliveryStatusSuggestion(
        this.filteredDeliveryStatusSuggestions[this.deliveryStatusSuggestionIndex],
      );
      return;
    }

    if (event.key === 'Escape') {
      this.showDeliveryStatusSuggestions = false;
      this.deliveryStatusSuggestionIndex = -1;
    }
  }

  selectDeliveryStatusSuggestion(value: string): void {
    this.deliveryStatusText = value;
    this.showDeliveryStatusSuggestions = false;
    this.deliveryStatusSuggestionIndex = -1;
  }

  private filterDeliveryStatusSuggestions(): void {
    const query = (this.deliveryStatusText ?? '').trim().toLowerCase();
    if (!query) {
      this.filteredDeliveryStatusSuggestions = [...this.deliveryStatusSuggestions];
      return;
    }

    this.filteredDeliveryStatusSuggestions = this.deliveryStatusSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(query),
    );
  }

  saveStatus(): void {
    if (!this.orderId || !this.selectedStatusId) {
      this.toastr.warning('Select a status to apply.', 'Status');
      return;
    }

    const selected = this.selectedStatusOption;
    const remarks = this.statusRemarks?.trim() || undefined;

    if (this.selectedStatusRequiresRemarks && !remarks) {
      const fieldLabel = this.selectedStatusRemarksLabel.toLowerCase();
      this.toastr.warning(`Enter a ${fieldLabel} before saving.`, 'Status');
      return;
    }

    if (this.isRefundAction && this.paidAmount <= 0) {
      this.toastr.warning('Refund not applicable for unpaid orders.', 'Refund');
      return;
    }

    const payload = {
      onlineShopSaleOrderId: this.orderId,
      orderStatusId: this.selectedStatusId,
      remarks,
    };

    if (selected?.isEventDriven) {
      const eventLabel = selected.eventDisplayName || selected.eventName || 'a configured action';
      const openConfirm = (accountOptions: { value: string; label: string }[] = []) => {
        this.confirmationDialog.confirm({
          title: 'Confirm status change',
          message: `This status change will trigger "${eventLabel}".`,
          detail: this.isCodRefundAction
            ? 'Select the account to debit for this cash on delivery refund.'
            : 'This action may update inventory, payments, or delivery tracking.',
          confirmText: 'Yes, continue',
          cancelText: 'Cancel',
          confirmButtonClass: 'btn-primary',
          icon: 'warning',
          showAccountSelect: this.isCodRefundAction,
          accountOptions,
          accountRequired: this.isCodRefundAction,
          accountLabel: 'Refund from account',
          showRefundAmount: this.isCodRefundAction,
          defaultRefundAmount: this.defaultRefundAmount,
          refundAmountLabel: 'Refund amount',
        }).then((result) => {
          if (!result.confirmed) {
            return;
          }
          this.submitStatusUpdate({
            ...payload,
            refundAccountId: result.refundAccountId,
            refundAmount: result.refundAmount,
          });
        });
      };

      if (this.isCodRefundAction) {
        this.loadRefundAccounts((accounts) => {
          if (!accounts.length) {
            this.toastr.warning('No active accounts found. Create an account before processing COD refunds.', 'Refund');
            return;
          }
          openConfirm(accounts);
        });
        return;
      }

      openConfirm();
      return;
    }

    this.submitStatusUpdate(payload);
  }

  private submitStatusUpdate(payload: {
    onlineShopSaleOrderId: string;
    orderStatusId: string;
    remarks?: string;
    refundAccountId?: string;
    refundAmount?: number;
  }): void {
    this.isSavingStatus = true;
    this.restService.put(environment.urls.OnlineShopSaleOrder_UpdateStatus, payload).subscribe({
      next: () => {
        this.isSavingStatus = false;
        this.toastr.success('Order status updated.', 'Success', { progressBar: true });
        this.statusRemarks = '';
        this.loadOrder();
      },
      error: (err) => {
        this.isSavingStatus = false;
        this.showError(err);
      },
    });
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

  onClaimStatusSelectChanged(value: string | null): void {
    this.claimStatusSelectValue = value;
    this.shipmentForm.claimStatus =
      value != null && value !== '' ? Number(value) : null;
    this.onClaimStatusChanged();
  }

  onClaimStatusChanged(): void {
    if (!this.showClaimAmountReceived) {
      this.shipmentForm.claimAmountReceived = null;
      this.shipmentForm.claimAccountId = null;
      this.shipmentForm.claimAccountLabel = '';
    }
  }

  saveShipment(): void {
    if (!this.orderId) {
      return;
    }

    this.normalizeDeliveryStatusInput();

    if (
      this.showClaimAmountReceived
      && (!this.shipmentForm.claimAmountReceived || Number(this.shipmentForm.claimAmountReceived) <= 0)
    ) {
      this.toastr.warning('Enter the claim amount received when status is Claim Received.', 'Shipment');
      return;
    }

    if (this.showClaimAccountSelection && !this.shipmentForm.claimAccountId) {
      this.toastr.warning('Select the account to receive the cargo claim amount.', 'Shipment');
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
      deliveryStatus: this.deliveryStatusText?.trim() || undefined,
      historyRemarks: this.shipmentHistoryRemarks?.trim() || undefined,
      adminNote: this.statusAdminNote?.trim() || undefined,
      claimStatus: this.shipmentForm.claimStatus ?? undefined,
      claimAmountReceived: this.showClaimAmountReceived
        ? Number(this.shipmentForm.claimAmountReceived)
        : undefined,
      refundAccountId: this.showClaimAccountSelection
        ? this.shipmentForm.claimAccountId
        : undefined,
    };

    this.isActionBusy = true;
    this.restService.post(environment.urls.OnlineShopSaleOrder_SaveShipment, payload).subscribe({
      next: () => {
        this.isActionBusy = false;
        this.toastr.success('Shipment saved.', 'Success', { progressBar: true });
        this.loadShipment();
        this.loadOrder();
        this.loadDeliveryStatusSuggestions();
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
        this.syncDeliveryStatusText();
        this.ensureCurrentDeliveryStatusInSuggestions();
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
    return 'No status transitions are configured for the current order status.';
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
        isEventDriven: !!(item.isEventDriven ?? item.IsEventDriven),
        eventName: item.eventName ?? item.EventName ?? undefined,
        eventDisplayName: item.eventDisplayName ?? item.EventDisplayName ?? undefined,
      }))
      .filter((option) => option.value && option.label);
  }

  private applyStatusOptions(options: StatusOption[], hint: string): void {
    this.statusOptions = [...options];
    this.statusOptionsHint = hint;
    this.selectedStatusId = null;
    this.statusOptionsLoading = false;
  }

  private loadDeliveryStatusSuggestions(): void {
    const path =
      environment.urls?.OnlineShopSaleOrder_GetDeliveryStatuses
      || '/OnlineShopSaleOrder/GetDeliveryStatusesForDropdown';
    this.restService.getWithoutLoader(path).subscribe({
      next: (response) => {
        const items = this.normalizeDeliveryStatusList(response?.result ?? response);
        this.deliveryStatusSuggestions = items;
        this.ensureCurrentDeliveryStatusInSuggestions();
        this.filterDeliveryStatusSuggestions();
      },
      error: () => {
        this.deliveryStatusSuggestions = [...ManageOrderComponent.DeliveryStatusFallback];
        this.ensureCurrentDeliveryStatusInSuggestions();
      },
    });
  }

  private normalizeDeliveryStatusList(response: any): string[] {
    let items = response;
    if (items && !Array.isArray(items) && Array.isArray(items.items)) {
      items = items.items;
    }

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => (typeof item === 'string' ? item : item?.statusName ?? item?.StatusName ?? ''))
      .map((value) => String(value).trim())
      .filter((value) => !!value)
      .sort((a, b) => a.localeCompare(b));
  }

  private ensureCurrentDeliveryStatusInSuggestions(): void {
    const current = (this.deliveryStatusText ?? '').trim();
    if (!current) {
      return;
    }

    const exists = this.deliveryStatusSuggestions.some(
      (suggestion) => suggestion.localeCompare(current, undefined, { sensitivity: 'accent' }) === 0,
    );

    if (!exists) {
      this.deliveryStatusSuggestions = [...this.deliveryStatusSuggestions, current].sort((a, b) =>
        a.localeCompare(b),
      );
    }
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
          claimStatus: this.shipment.claimStatus ?? this.shipment.ClaimStatus ?? null,
          claimAmountReceived: this.shipment.claimAmountReceived ?? this.shipment.ClaimAmountReceived ?? null,
          claimAccountId: this.shipment.cargoClaimAccountId ?? this.shipment.CargoClaimAccountId ?? null,
          claimAccountLabel: this.shipment.cargoClaimAccountName ?? this.shipment.CargoClaimAccountName ?? '',
          cargoClaimTransactionReference:
            this.shipment.cargoClaimTransactionReference ?? this.shipment.CargoClaimTransactionReference ?? '',
          cargoClaimReceivedAt: this.formatDisplayDateTime(
            this.shipment.cargoClaimReceivedAt ?? this.shipment.CargoClaimReceivedAt,
          ),
        };
        this.claimStatusSelectValue =
          this.shipmentForm.claimStatus != null ? String(this.shipmentForm.claimStatus) : null;
        this.syncDeliveryStatusText();
        this.ensureCurrentDeliveryStatusInSuggestions();
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
      paymentStatusName: raw.paymentStatusName ?? raw.PaymentStatusName,
      shippingMethod: raw.shippingMethod ?? raw.ShippingMethod,
      deliveryStatus: raw.deliveryStatus ?? raw.DeliveryStatus,
      isShipmentLost: !!(raw.isShipmentLost ?? raw.IsShipmentLost),
      orderStatusId: raw.orderStatusId ?? raw.OrderStatusId,
      orderStatusDisplayName: raw.orderStatusDisplayName ?? raw.OrderStatusDisplayName,
      orderStatusColorCode: raw.orderStatusColorCode ?? raw.OrderStatusColorCode,
      adminNote: raw.adminNote ?? raw.AdminNote,
      shipment: this.normalizeShipmentSummary(raw.shipment ?? raw.Shipment),
      products: (raw.products ?? raw.Products ?? []).map((p: any) => ({
        productName: p.productName ?? p.ProductName,
        productImageUrl: p.productImageUrl ?? p.ProductImageUrl,
        quantity: p.quantity ?? p.Quantity,
        unitPrice: p.unitPrice ?? p.UnitPrice,
        lineTotal: p.lineTotal ?? p.LineTotal,
      })),
      billingAddress: this.normalizeAddress(raw.billingAddress ?? raw.BillingAddress),
      shippingAddress: this.normalizeAddress(raw.shippingAddress ?? raw.ShippingAddress),
    };
  }

  private normalizeShipmentSummary(raw: any): any {
    if (!raw) {
      return null;
    }

    return {
      hasShipment: !!(raw.hasShipment ?? raw.HasShipment),
      trackingNumber: raw.trackingNumber ?? raw.TrackingNumber,
      courierName: raw.courierName ?? raw.CourierName,
      courierProvider: raw.courierProvider ?? raw.CourierProvider,
      deliveryStatus: raw.deliveryStatus ?? raw.DeliveryStatus,
      lastTrackingStatus: raw.lastTrackingStatus ?? raw.LastTrackingStatus,
      lastTrackingSyncAt: raw.lastTrackingSyncAt ?? raw.LastTrackingSyncAt,
      trackShipment: !!(raw.trackShipment ?? raw.TrackShipment),
      canResync: !!(raw.canResync ?? raw.CanResync),
      shippingFulfillmentStatus: raw.shippingFulfillmentStatus ?? raw.ShippingFulfillmentStatus,
      requiresManualFulfillment:
        !!(raw.requiresManualFulfillment ?? raw.RequiresManualFulfillment)
        || raw.shippingFulfillmentStatus === 'manual_fulfillment_required'
        || raw.ShippingFulfillmentStatus === 'manual_fulfillment_required',
    };
  }

  private normalizeTimeline(raw: any): any {
    if (!raw) {
      return null;
    }

    return {
      onlineOrderNumber: raw.onlineOrderNumber ?? raw.OnlineOrderNumber,
      currentOrderStatusDisplayName: raw.currentOrderStatusDisplayName ?? raw.CurrentOrderStatusDisplayName,
      currentOrderStatusColorCode: raw.currentOrderStatusColorCode ?? raw.CurrentOrderStatusColorCode,
      currentPaymentStatusName: raw.currentPaymentStatusName ?? raw.CurrentPaymentStatusName,
      currentDeliveryStatus: raw.currentDeliveryStatus ?? raw.CurrentDeliveryStatus,
      items: (raw.items ?? raw.Items ?? []).map((item: any) => ({
        changedAt: item.changedAt ?? item.ChangedAt,
        orderStatusDisplayName: item.orderStatusDisplayName ?? item.OrderStatusDisplayName,
        orderStatusColorCode: item.orderStatusColorCode ?? item.OrderStatusColorCode,
        paymentStatusName: item.paymentStatusName ?? item.PaymentStatusName,
        oldPaymentStatusName: item.oldPaymentStatusName ?? item.OldPaymentStatusName,
        deliveryStatus: item.deliveryStatus ?? item.DeliveryStatus,
        oldDeliveryStatus: item.oldDeliveryStatus ?? item.OldDeliveryStatus,
        remarks: item.remarks ?? item.Remarks,
      })),
    };
  }

  private resolveErrorMessage(err: any, fallback: string): string {
    return err?.error?.error?.message ?? err?.error?.message ?? err?.message ?? fallback;
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

  private syncDeliveryStatusText(): void {
    const shipmentStatus = this.normalizeDeliveryStatusText(
      this.shipment?.deliveryStatus ?? this.shipment?.DeliveryStatus,
    );
    const orderStatus = this.normalizeDeliveryStatusText(
      this.detail?.deliveryStatus ?? this.detail?.DeliveryStatus,
    );
    this.deliveryStatusText = shipmentStatus ?? orderStatus ?? '';
  }

  private normalizeDeliveryStatusText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const text = String(value).trim();
    const numeric = Number(text);
    if (Number.isFinite(numeric) && numeric > 0) {
      return this.deliveryStatusLabel(numeric);
    }

    return text;
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

  private formatDisplayDateTime(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleString();
  }

  private loadClaimAccounts(): void {
    this.loadRefundAccounts((accounts) => {
      this.claimAccountOptions = accounts;
    });
  }

  private loadRefundAccounts(
    onLoaded: (accounts: { value: string; label: string }[]) => void,
  ): void {
    this.restService.getWithoutLoader(environment.urls.OnlineShopSaleOrder_GetRefundAccounts).subscribe({
      next: (response) => {
        onLoaded(this.normalizeRefundAccounts(response));
      },
      error: () => {
        this.toastr.error('Unable to load refund accounts.', 'Error', { progressBar: true });
        onLoaded([]);
      },
    });
  }

  private normalizeRefundAccounts(response: any): { value: string; label: string }[] {
    let items = response?.result ?? response;
    if (items && !Array.isArray(items) && Array.isArray(items.items)) {
      items = items.items;
    }
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => ({
        value: String(item.id ?? item.Id ?? ''),
        label: String(
          item.displayName
          ?? item.DisplayName
          ?? item.accountName
          ?? item.AccountName
          ?? '',
        ),
      }))
      .filter((item) => item.value && item.label);
  }

  private showError(err: any): void {
    const message = err?.error?.error?.message ?? err?.message ?? 'Something went wrong.';
    this.toastr.error(message, 'Error', { progressBar: true });
  }
}
