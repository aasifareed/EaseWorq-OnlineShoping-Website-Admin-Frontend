import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { PaymentProviderCodeEnum, PaymentProviderListItem } from '../models/provider.models';
import { PaymentProviderService } from '../services/payment-provider.service';
import { PaymentProviderModalComponent } from './payment-provider-modal.component';

type ToggleField = 'active' | 'api';

@Component({
  selector: 'app-payment-providers',
  templateUrl: './payment-providers.component.html',
  styleUrls: ['./payment-providers.component.css'],
})
export class PaymentProvidersComponent implements OnInit {
  ColumnMode = ColumnMode;
  providers: PaymentProviderListItem[] = [];
  loading = false;
  private readonly toggling = new Map<string, ToggleField>();

  constructor(
    private paymentService: PaymentProviderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.getAll().subscribe({
      next: (rows) => {
        this.providers = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load payment providers'));
      },
    });
  }

  openAddPaymentMethod(): void {
    this.openModal();
  }

  openEdit(item: PaymentProviderListItem): void {
    this.openModal(item.id);
  }

  onActiveToggle(item: PaymentProviderListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = input.checked;
    const previous = item.isActive;

    this.setToggling(item.id, 'active');
    this.paymentService.enableDisable(item.id, next).subscribe({
      next: () => {
        item.isActive = next;
        this.clearToggling(item.id);
        this.toastr.success(
          next
            ? this.translate.instant('Payment provider enabled')
            : this.translate.instant('Payment provider disabled'),
        );
      },
      error: (err) => {
        input.checked = previous;
        this.clearToggling(item.id);
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to update payment provider');
        this.toastr.error(message);
      },
    });
  }

  onApiToggle(item: PaymentProviderListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = input.checked;
    const previous = item.isApiEnabled;

    this.setToggling(item.id, 'api');
    this.paymentService.updateApiEnabled(item.id, next).subscribe({
      next: () => {
        item.isApiEnabled = next;
        this.clearToggling(item.id);
        this.toastr.success(
          next
            ? this.translate.instant('API enabled for payment provider')
            : this.translate.instant('API disabled for payment provider'),
        );
      },
      error: (err) => {
        input.checked = previous;
        this.clearToggling(item.id);
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to update payment provider');
        this.toastr.error(message);
      },
    });
  }

  setDefault(item: PaymentProviderListItem): void {
    this.paymentService.setDefault(item.id).subscribe({
      next: () => {
        this.toastr.success(this.translate.instant('Default payment provider updated'));
        this.load();
      },
      error: (err) => {
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to set default provider');
        this.toastr.error(message);
      },
    });
  }

  delete(item: PaymentProviderListItem): void {
    if (!confirm(this.translate.instant('Delete this payment provider configuration?'))) {
      return;
    }

    this.paymentService.delete(item.id).subscribe({
      next: () => {
        this.toastr.success(this.translate.instant('Payment provider deleted'));
        this.load();
      },
      error: (err) => {
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to delete payment provider');
        this.toastr.error(message);
      },
    });
  }

  isCod(item: PaymentProviderListItem): boolean {
    return this.normalizeCode(item.providerCode) === PaymentProviderCodeEnum.COD;
  }

  isGoPayFast(item: PaymentProviderListItem): boolean {
    return this.normalizeCode(item.providerCode) === PaymentProviderCodeEnum.GoPayFast;
  }

  merchantDisplay(item: PaymentProviderListItem): string {
    if (this.isCod(item)) {
      return '—';
    }
    return item.merchantIdMasked || '—';
  }

  isToggling(id: string, field: ToggleField): boolean {
    return this.toggling.get(id) === field;
  }

  existingProviderCodes(): string[] {
    return this.providers.map((p) => this.normalizeCode(p.providerCode));
  }

  private normalizeCode(code: string): string {
    const upper = String(code || '').toUpperCase();
    if (upper === 'COD') {
      return PaymentProviderCodeEnum.COD;
    }
    if (upper === 'GOPAYFAST') {
      return PaymentProviderCodeEnum.GoPayFast;
    }
    return code;
  }

  private setToggling(id: string, field: ToggleField): void {
    this.toggling.set(id, field);
  }

  private clearToggling(id: string): void {
    this.toggling.delete(id);
  }

  private openModal(providerId?: string): void {
    const modalRef = this.modalService.open(PaymentProviderModalComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    modalRef.componentInstance.providerId = providerId;
    modalRef.componentInstance.existingProviderCodes = this.existingProviderCodes();
    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.load();
        }
      },
      () => undefined,
    );
  }
}
