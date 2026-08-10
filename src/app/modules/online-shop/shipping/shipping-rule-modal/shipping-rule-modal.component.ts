import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ShippingChargeTypeEnum } from 'src/app/shared/enum/online-shop-discount.enum';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  SHIPPING_CHARGE_TYPES,
  SHIPPING_RULE_TYPES,
  ShippingRule,
} from '../models/shipping.models';
import { isWeightRule, ruleLimitUnit } from '../utils/shipping-rule-format.util';

@Component({
  selector: 'app-shipping-rule-modal',
  templateUrl: './shipping-rule-modal.component.html',
  styleUrls: ['./shipping-rule-modal.component.css'],
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
    private globalDataService: GlobalDataService,
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

    this.form.get('noUpperLimit').valueChanges.subscribe((checked) => {
      this.updateMaxState(!!checked);
    });
  }

  get f() {
    return this.form.controls;
  }

  get showAmount(): boolean {
    return this.isFixedCharge || this.isPercentageCharge;
  }

  get isFixedCharge(): boolean {
    return this.form?.get('shippingType')?.value === ShippingChargeTypeEnum.Fixed;
  }

  get isPercentageCharge(): boolean {
    return this.form?.get('shippingType')?.value === ShippingChargeTypeEnum.Percentage;
  }

  /** Free waives the whole charge, so there is no amount to enter. */
  get isFreeCharge(): boolean {
    return this.form?.get('shippingType')?.value === ShippingChargeTypeEnum.Free;
  }

  get noUpperLimit(): boolean {
    return !!this.form?.get('noUpperLimit')?.value;
  }

  /** A rule bands either on what the customer spends or on what the parcel weighs. */
  get isWeightRule(): boolean {
    return isWeightRule(this.form?.get('ruleType')?.value);
  }

  /** The unit the Minimum/Maximum pair is measured in. */
  get limitUnitLabel(): string {
    return ruleLimitUnit(this.form?.get('ruleType')?.value, this.currencySymbol);
  }

  /** Decimals only make sense on a weight band; a currency threshold is a whole rupee figure. */
  get limitStep(): string {
    return this.isWeightRule ? '0.001' : '1';
  }

  get currencySymbol(): string {
    return this.globalDataService.getCurrencySymbol();
  }

  get rangeInvalid(): boolean {
    if (this.noUpperLimit) {
      return false;
    }
    const min = Number(this.form.get('min')?.value ?? 0);
    const max = Number(this.form.get('max')?.value ?? 0);
    return Number.isFinite(min) && Number.isFinite(max) && min > max;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid || this.rangeInvalid) {
      return;
    }

    const value = this.form.value;
    const payload = {
      id: value.id || null,
      onlineShopShippingCountryId: this.countryId,
      name: value.name,
      ruleType: value.ruleType,
      min: Number(value.min),
      // null tells the API this is an open-ended "and above" rule.
      max: value.noUpperLimit ? null : Number(value.max),
      shippingType: value.shippingType,
      amount:
        value.shippingType === ShippingChargeTypeEnum.Free ? 0 : Number(value.amount || 0),
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
      noUpperLimit: [false],
      shippingType: [ShippingChargeTypeEnum.Fixed, Validators.required],
      amount: [0, Validators.required],
    });
  }

  private patchForm(rule: ShippingRule): void {
    const openEnded = rule.max === null || rule.max === undefined;
    this.form.patchValue({
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      min: rule.min,
      max: openEnded ? null : rule.max,
      noUpperLimit: openEnded,
      shippingType: rule.shippingType,
      amount: rule.amount,
    });
    this.updateAmountValidators(rule.shippingType);
    this.updateMaxState(openEnded);
  }

  private updateMaxState(noUpperLimit: boolean): void {
    const maxControl = this.form.get('max');
    if (noUpperLimit) {
      maxControl.clearValidators();
      maxControl.setValue(null, { emitEvent: false });
      maxControl.disable({ emitEvent: false });
    } else {
      maxControl.setValidators([Validators.required]);
      maxControl.enable({ emitEvent: false });
    }
    maxControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateAmountValidators(shippingType: string): void {
    const amountControl = this.form.get('amount');
    if (shippingType === ShippingChargeTypeEnum.Free) {
      amountControl.clearValidators();
      amountControl.setValue(0);
    } else {
      amountControl.setValidators([Validators.required]);
    }
    amountControl.updateValueAndValidity();
  }
}
