import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

export interface OrderListRow {
  id: string;
  orderNumber: string;
  storeId?: string;
  storeName?: string;
  customerName?: string;
  phone?: string;
  orderStatusId?: string;
  orderStatusDisplayName?: string;
  orderStatusColorCode?: string;
  paymentMethod?: number;
  paymentStatus?: number;
  deliveryStatus?: number;
  totalAmount?: number;
  totalPaidAmount?: number;
  remainingAmount?: number;
}

@Component({
  selector: 'app-order-detail-modal',
  templateUrl: './order-detail-modal.component.html',
  styleUrls: ['./order-detail-modal.component.css'],
})
export class OrderDetailModalComponent implements OnInit {
  @Input() orderRow: OrderListRow;

  isLoading = true;
  detail: any = null;

  constructor(
    private restService: RestService,
    private toastr: ToastrService,
    private router: Router,
    public globalDataService: GlobalDataService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.loadDetail();
  }

  get productsSummary(): string {
    const products = this.detail?.products ?? [];
    if (!products.length) {
      return '—';
    }
    const symbol = this.globalDataService.getCurrencySymbol();
    return products
      .map(
        (p: any) =>
          `${p.productName || 'Product'} · Qty ${p.quantity ?? 0} · ${symbol}${Number(p.lineTotal ?? 0).toFixed(2)}`,
      )
      .join('\n');
  }

  display(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  formatMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${this.globalDataService.getCurrencySymbol()}${Number(value).toFixed(2)}`;
  }

  get paymentStatusLabel(): string {
    const status = Number(this.orderRow?.paymentStatus ?? 0);
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

  get deliveryStatusLabel(): string {
    const status = Number(this.orderRow?.deliveryStatus ?? 0);
    const labels: Record<number, string> = {
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
    return labels[status] ?? 'Unknown';
  }

  manageOrder(): void {
    if (!this.orderRow?.id) {
      return;
    }
    this.activeModal.dismiss();
    this.router.navigate(['/online-shop/orders/manage', this.orderRow.id]);
  }

  close(): void {
    this.activeModal.dismiss();
  }

  private loadDetail(): void {
    this.isLoading = true;
    const detailUrl = `${environment.urls.OnlineShopSaleOrder_GetDetail}?onlineShopSaleOrderId=${this.orderRow.id}`;

    this.restService.getWithoutLoader(detailUrl).subscribe({
      next: (response) => {
        this.detail = this.normalizeDetail(response?.result ?? response);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err);
      },
    });
  }

  private normalizeDetail(raw: any): any {
    if (!raw) {
      return null;
    }
    return {
      orderDate: raw.orderDate ?? raw.OrderDate,
      totalAmount: raw.totalAmount ?? raw.TotalAmount,
      shippingMethodName: raw.shippingMethodName ?? raw.ShippingMethodName,
      paymentMethodName: raw.paymentMethodName ?? raw.PaymentMethodName,
      products: (raw.products ?? raw.Products ?? []).map((p: any) => ({
        productName: p.productName ?? p.ProductName,
        quantity: p.quantity ?? p.Quantity,
        lineTotal: p.lineTotal ?? p.LineTotal,
      })),
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

  private showError(err: any): void {
    const message = err?.error?.error?.message ?? err?.message ?? 'Something went wrong.';
    this.toastr.error(message, 'Error', { progressBar: true });
  }
}
