import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

export interface ProductCustomerCouponResult {
  id: string;
  code: string;
  type: string;
  amount: number;
  productId: string;
  productName: string;
  endDate?: string | null;
  message?: string | null;
}

@Component({
  selector: 'app-product-customer-coupon-modal',
  templateUrl: './product-customer-coupon-modal.component.html',
  styleUrls: ['./product-customer-coupon-modal.component.css'],
})
export class ProductCustomerCouponModalComponent implements OnInit {
  @Input() productId = '';
  @Input() productName = '';
  @Input() sellPrice: number | null = null;

  form: FormGroup;
  submitting = false;
  generated: ProductCustomerCouponResult | null = null;
  copied = false;

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      type: ['fixed', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      validDays: [7, [Validators.required, Validators.min(0), Validators.max(365)]],
    });
  }

  get isGenerated(): boolean {
    return !!this.generated?.code;
  }

  get discountSummary(): string {
    if (!this.generated) {
      return '';
    }
    const amount = Number(this.generated.amount) || 0;
    if ((this.generated.type || '').toLowerCase() === 'percentage') {
      return `${amount}% off`;
    }
    return `Rs ${amount.toLocaleString()} off`;
  }

  generate(): void {
    if (this.form.invalid || this.submitting || !this.productId) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const type = String(value.type || 'fixed').toLowerCase();
    const amount = Number(value.amount);
    if (type === 'percentage' && amount > 100) {
      this.toastr.error(this.translate.instant('Percentage discount cannot exceed 100.'));
      return;
    }

    this.submitting = true;
    const url =
      environment.urls.Coupon_GenerateSingleUseProduct ||
      '/OnlineShopCoupon/GenerateSingleUseProductCoupon';

    this.restService
      .postWithOutSpinner(url, {
        ProductId: this.productId,
        ProductName: this.productName || null,
        Type: type,
        Amount: amount,
        ValidDays: Number(value.validDays),
      })
      .subscribe({
        next: (response) => {
          this.submitting = false;
          const row = (response?.result ?? response) as Record<string, unknown>;
          this.generated = {
            id: String(row.id ?? row.Id ?? ''),
            code: String(row.code ?? row.Code ?? ''),
            type: String(row.type ?? row.Type ?? type),
            amount: Number(row.amount ?? row.Amount ?? amount),
            productId: String(row.productId ?? row.ProductId ?? this.productId),
            productName: String(row.productName ?? row.ProductName ?? this.productName),
            endDate:
              row.endDate != null
                ? String(row.endDate)
                : row.EndDate != null
                  ? String(row.EndDate)
                  : null,
            message:
              row.message != null
                ? String(row.message)
                : row.Message != null
                  ? String(row.Message)
                  : null,
          };
          this.toastr.success(
            this.translate.instant('Coupon created. Copy the code and send it to your customer.'),
          );
        },
        error: (err) => {
          this.submitting = false;
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Could not create the coupon. Please try again.');
          this.toastr.error(message);
        },
      });
  }

  async copyCode(): Promise<void> {
    const code = this.generated?.code;
    if (!code) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.copied = true;
      this.toastr.success(this.translate.instant('Coupon code copied'));
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch {
      this.toastr.error(this.translate.instant('Could not copy the code. Select it manually.'));
    }
  }

  done(): void {
    this.activeModal.close(this.generated);
  }
}
