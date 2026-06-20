import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import {
  PAYMENT_PROVIDER_OPTIONS,
  PaymentProviderCodeEnum,
  PaymentProviderEdit,
} from '../models/provider.models';
import { PaymentProviderService } from '../services/payment-provider.service';

@Component({
  selector: 'app-payment-provider-modal',
  templateUrl: './payment-provider-modal.component.html',
})
export class PaymentProviderModalComponent implements OnInit {
  @Input() providerId?: string;
  @Input() existingProviderCodes: string[] = [];

  form: FormGroup;
  loading = false;
  saving = false;
  title = 'Add Payment Method';
  isEditMode = false;
  duplicateBlocked = false;
  securedKeyPlaceholder = '';

  readonly paymentMethodOptions = PAYMENT_PROVIDER_OPTIONS;
  readonly environmentOptions = ['UAT', 'Live'];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentProviderService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.providerId;
    this.form = this.fb.group({
      id: [null],
      paymentMethod: ['', Validators.required],
      providerName: ['', Validators.required],
      providerCode: [{ value: '', disabled: true }, Validators.required],
      environment: ['UAT'],
      baseUrl: [''],
      tokenApiUrl: [''],
      formUrl: [''],
      merchantId: [''],
      securedKey: [''],
      publicBaseUrl: [''],
      isActive: [true],
      isApiEnabled: [true],
      isDefault: [false],
      sortOrder: [null],
      collectShippingChargesInAdvanceForCod: [false],
    });

    if (this.isEditMode) {
      this.title = 'Edit Payment Method';
      this.form.get('paymentMethod')?.disable();
      this.loadExisting(this.providerId);
    } else {
      this.form.get('paymentMethod')?.valueChanges.subscribe((code) => this.onPaymentMethodChange(code));
    }

    this.form.get('providerCode')?.valueChanges.subscribe(() => this.updateValidators());
    this.form.get('isActive')?.valueChanges.subscribe(() => this.updateValidators());
    this.form.get('isApiEnabled')?.valueChanges.subscribe(() => this.updateValidators());
  }

  get isCod(): boolean {
    return this.currentProviderCode() === PaymentProviderCodeEnum.COD;
  }

  get isGoPayFast(): boolean {
    return this.currentProviderCode() === PaymentProviderCodeEnum.GoPayFast;
  }

  save(): void {
    if (this.duplicateBlocked) {
      this.toastr.warning(
        this.translate.instant('This payment method already exists. Please edit the existing record.'),
      );
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const value: PaymentProviderEdit = {
      id: raw.id || undefined,
      providerName: String(raw.providerName || '').trim(),
      providerCode: this.currentProviderCode(),
      environment: raw.environment?.trim(),
      baseUrl: raw.baseUrl?.trim(),
      tokenApiUrl: raw.tokenApiUrl?.trim(),
      formUrl: raw.formUrl?.trim(),
      merchantId: raw.merchantId?.trim(),
      publicBaseUrl: raw.publicBaseUrl?.trim(),
      isActive: !!raw.isActive,
      isApiEnabled: this.isCod ? false : !!raw.isApiEnabled,
      isDefault: !!raw.isDefault,
      sortOrder: raw.sortOrder,
      collectShippingChargesInAdvanceForCod: !!raw.collectShippingChargesInAdvanceForCod,
    };

    const securedKey = String(raw.securedKey || '').trim();
    if (securedKey) {
      value.securedKey = securedKey;
    }

    this.saving = true;
    this.paymentService.save(value).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('Payment provider saved'));
        this.activeModal.close(true);
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to save payment provider');
        this.toastr.error(message);
      },
    });
  }

  private loadExisting(id: string): void {
    this.loading = true;
    this.paymentService.getForEdit(id).subscribe({
      next: (data) => {
        this.loading = false;
        const code = this.normalizeCode(data.providerCode);
        this.securedKeyPlaceholder = data.securedKey ? '****' : '';
        this.form.patchValue({
          id: data.id,
          paymentMethod: code,
          providerName: data.providerName,
          providerCode: data.providerCode,
          environment: data.environment || 'UAT',
          baseUrl: data.baseUrl || '',
          tokenApiUrl: data.tokenApiUrl || '',
          formUrl: data.formUrl || '',
          merchantId: data.merchantId || '',
          securedKey: '',
          publicBaseUrl: data.publicBaseUrl || '',
          isActive: data.isActive,
          isApiEnabled: data.isApiEnabled,
          isDefault: data.isDefault,
          sortOrder: data.sortOrder,
          collectShippingChargesInAdvanceForCod: data.collectShippingChargesInAdvanceForCod,
        });
        this.updateValidators();
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load payment provider'));
        this.activeModal.dismiss();
      },
    });
  }

  private onPaymentMethodChange(code: PaymentProviderCodeEnum | string): void {
    if (!code) {
      return;
    }

    const normalized = this.normalizeCode(code);
    const option = this.paymentMethodOptions.find((o) => o.code === normalized);
    if (!option) {
      return;
    }

    this.duplicateBlocked = this.existingProviderCodes.some(
      (existing) => this.normalizeCode(existing) === normalized,
    );

    if (this.duplicateBlocked) {
      this.toastr.warning(
        this.translate.instant('This payment method already exists. Please edit the existing record.'),
      );
    }

    this.form.patchValue(
      {
        providerName: option.defaultName,
        providerCode: option.code,
        environment: normalized === PaymentProviderCodeEnum.GoPayFast ? 'UAT' : null,
        isApiEnabled: normalized === PaymentProviderCodeEnum.GoPayFast,
        isDefault: normalized === PaymentProviderCodeEnum.GoPayFast,
        collectShippingChargesInAdvanceForCod: false,
      },
      { emitEvent: false },
    );
    this.updateValidators();
  }

  private currentProviderCode(): string {
    const fromPaymentMethod = this.form.get('paymentMethod')?.value;
    if (fromPaymentMethod) {
      return this.normalizeCode(fromPaymentMethod);
    }
    return this.normalizeCode(this.form.get('providerCode')?.value || '');
  }

  isOptionDisabled(code: PaymentProviderCodeEnum): boolean {
    return this.existingProviderCodes.some(
      (existing) => this.normalizeCode(existing) === code,
    );
  }

  optionLabel(opt: { code: PaymentProviderCodeEnum; label: string }): string {
    if (!this.isEditMode && this.isOptionDisabled(opt.code)) {
      return `${opt.label} (${this.translate.instant('Already configured')})`;
    }
    return opt.label;
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

  private updateValidators(): void {
    const goPayFastActive =
      this.isGoPayFast && !!this.form.get('isActive')?.value && !!this.form.get('isApiEnabled')?.value;
    const isNewGoPayFast = this.isGoPayFast && !this.isEditMode;

    const requiredFields = ['merchantId', 'tokenApiUrl', 'formUrl', 'publicBaseUrl'];
    requiredFields.forEach((name) => {
      const ctrl = this.form.get(name);
      if (!ctrl) {
        return;
      }
      if (goPayFastActive) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    const securedKeyCtrl = this.form.get('securedKey');
    if (securedKeyCtrl) {
      if (goPayFastActive && (isNewGoPayFast || !this.securedKeyPlaceholder)) {
        securedKeyCtrl.setValidators([Validators.required]);
      } else {
        securedKeyCtrl.clearValidators();
      }
      securedKeyCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }
}
