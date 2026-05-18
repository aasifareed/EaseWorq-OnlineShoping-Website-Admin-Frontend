import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  SHIPPING_CHARGE_TYPES,
  SHIPPING_RULE_TYPES,
  ShippingRule,
} from '../models/shipping.models';

@Component({
  selector: 'app-shipping-rule-modal',
  templateUrl: './shipping-rule-modal.component.html',
  styles: [
    `
      .shipping-rule-form .form-group label {
        display: block;
        margin-bottom: 0.35rem;
      }
    `,
  ],
})
export class ShippingRuleModalComponent implements OnInit {
  @Input() countryId: string;
  @Input() rule: ShippingRule | null = null;

  form: FormGroup;
  submitted = false;
  isLoading = false;
  title = 'Add Shipping Rule';

  ruleTypes = SHIPPING_RULE_TYPES;
  shippingTypes = SHIPPING_CHARGE_TYPES;

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    if (this.rule) {
      this.title = 'Edit Shipping Rule';
      this.patchForm(this.rule);
    }

    this.form.get('shippingType').valueChanges.subscribe((type) => {
      this.updateAmountValidators(type);
    });
  }

  get f() {
    return this.form.controls;
  }

  get showAmount(): boolean {
    const type = this.form.get('shippingType')?.value;
    return type === 'fixed' || type === 'percentage';
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value;
    const payload = {
      id: value.id || null,
      onlineShopShippingCountryId: this.countryId,
      name: value.name,
      ruleType: value.ruleType,
      min: Number(value.min),
      max: Number(value.max),
      shippingType: value.shippingType,
      amount: value.shippingType === 'free' ? 0 : Number(value.amount || 0),
      isActive: true,
    };

    this.isLoading = true;
    this.restService
      .postWithOutSpinner(environment.urls.Shipping_CreateOrUpdateRule, payload)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant(this.rule ? 'Rule updated.' : 'Rule added.'),
            this.translate.instant('toaster_Heading_Success'),
            { progressBar: true },
          );
          this.activeModal.close(true);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  close(): void {
    this.activeModal.dismiss();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      ruleType: ['', Validators.required],
      min: [0, Validators.required],
      max: [0, Validators.required],
      shippingType: ['fixed', Validators.required],
      amount: [0, Validators.required],
    });
  }

  private patchForm(rule: ShippingRule): void {
    this.form.patchValue({
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      min: rule.min,
      max: rule.max,
      shippingType: rule.shippingType,
      amount: rule.amount,
    });
    this.updateAmountValidators(rule.shippingType);
  }

  private updateAmountValidators(shippingType: string): void {
    const amountControl = this.form.get('amount');
    if (shippingType === 'free') {
      amountControl.clearValidators();
      amountControl.setValue(0);
    } else {
      amountControl.setValidators([Validators.required]);
    }
    amountControl.updateValueAndValidity();
  }
}
