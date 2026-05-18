import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { COUPON_TYPES, CouponDetail } from '../models/coupon.models';

@Component({
  selector: 'app-coupon-form-modal',
  templateUrl: './coupon-form-modal.component.html',
  styleUrls: ['./coupon-form-modal.component.css'],
})
export class CouponFormModalComponent implements OnInit {
  @Input() couponId: string | null = null;

  form: FormGroup;
  submitted = false;
  isLoading = false;
  title = 'Add Coupon';
  activeSection = 'general';

  couponTypes = COUPON_TYPES;
  sections = [
    { id: 'general', label: 'General', icon: 'fa-cog' },
    { id: 'restriction', label: 'Restriction', icon: 'fa-ban' },
    { id: 'usage', label: 'Usage', icon: 'fa-pie-chart' },
  ];

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupValueChanges();

    if (this.couponId) {
      this.title = 'Edit Coupon';
      this.loadCoupon(this.couponId);
    }
  }

  get f() {
    return this.form.controls;
  }

  get showAmount(): boolean {
    return this.f.type.value && this.f.type.value !== 'free_shipping';
  }

  get showExpiryDates(): boolean {
    return !!this.f.isExpired.value;
  }

  get showUsageLimits(): boolean {
    return !this.f.isUnlimited.value;
  }

  setSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.focusInvalidSection();
      return;
    }

    const payload = this.buildPayload();
    this.isLoading = true;

    this.restService.postWithOutSpinner(environment.urls.Coupon_CreateOrUpdate, payload).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant(this.couponId ? 'Coupon updated.' : 'Coupon created.'),
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
      title: ['', Validators.required],
      description: ['', Validators.required],
      code: ['', Validators.required],
      type: ['', Validators.required],
      amount: [null],
      isExpired: [false],
      startDate: [null],
      endDate: [null],
      isFirstOrder: [false],
      isActive: [true],
      isApplyAll: [true],
      minSpend: [0, [Validators.required, Validators.min(0)]],
      maxSpend: [null],
      isUnlimited: [false],
      usagePerCoupon: [null],
      usagePerCustomer: [null],
    });
  }

  private setupValueChanges(): void {
    this.f.type.valueChanges.subscribe((type) => {
      const amount = this.f.amount;
      if (type === 'free_shipping') {
        amount.clearValidators();
        amount.setValue(null);
      } else {
        amount.setValidators([Validators.required, Validators.min(0)]);
      }
      amount.updateValueAndValidity();
    });

    this.f.isExpired.valueChanges.subscribe((hasExpiry) => {
      const start = this.f.startDate;
      const end = this.f.endDate;
      if (hasExpiry) {
        start.setValidators([Validators.required]);
        end.setValidators([Validators.required]);
      } else {
        start.clearValidators();
        end.clearValidators();
        start.setValue(null);
        end.setValue(null);
      }
      start.updateValueAndValidity();
      end.updateValueAndValidity();
    });

    this.f.isUnlimited.valueChanges.subscribe((unlimited) => {
      if (unlimited) {
        this.f.usagePerCoupon.setValue(null);
        this.f.usagePerCustomer.setValue(null);
      }
    });
  }

  private loadCoupon(id: string): void {
    this.isLoading = true;
    this.restService.getWithoutLoader(`${environment.urls.Coupon_GetForEdit}?id=${id}`).subscribe({
      next: (res) => {
        const c = this.mapDetail(res.result);
        this.form.patchValue({
          id: c.id,
          title: c.title,
          description: c.description,
          code: c.code,
          type: c.type,
          amount: c.amount,
          isExpired: c.isExpired,
          startDate: c.startDate ? c.startDate.substring(0, 10) : null,
          endDate: c.endDate ? c.endDate.substring(0, 10) : null,
          isFirstOrder: c.isFirstOrder,
          isActive: c.isActive,
          isApplyAll: c.isApplyAll,
          minSpend: c.minSpend,
          maxSpend: c.maxSpend,
          isUnlimited: c.isUnlimited,
          usagePerCoupon: c.usagePerCoupon,
          usagePerCustomer: c.usagePerCustomer,
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private buildPayload(): Record<string, unknown> {
    const v = this.form.value;
    return {
      id: v.id || null,
      title: v.title,
      description: v.description,
      code: v.code,
      type: v.type,
      amount: v.type === 'free_shipping' ? null : Number(v.amount),
      minSpend: Number(v.minSpend || 0),
      maxSpend: v.maxSpend != null && v.maxSpend !== '' ? Number(v.maxSpend) : null,
      isUnlimited: !!v.isUnlimited,
      usagePerCoupon: v.isUnlimited ? null : v.usagePerCoupon,
      usagePerCustomer: v.isUnlimited ? null : v.usagePerCustomer,
      isExpired: !!v.isExpired,
      startDate: v.isExpired && v.startDate ? v.startDate : null,
      endDate: v.isExpired && v.endDate ? v.endDate : null,
      isApplyAll: !!v.isApplyAll,
      isFirstOrder: !!v.isFirstOrder,
      isActive: !!v.isActive,
      includeProductIds: null,
      excludeProductIds: null,
    };
  }

  private focusInvalidSection(): void {
    const controls = this.form.controls;
    const generalFields = ['title', 'description', 'code', 'type', 'amount', 'startDate', 'endDate'];
    const restrictionFields = ['minSpend'];
    const usageFields = ['usagePerCoupon', 'usagePerCustomer'];

    for (const key of generalFields) {
      if (controls[key]?.invalid) {
        this.activeSection = 'general';
        return;
      }
    }
    for (const key of restrictionFields) {
      if (controls[key]?.invalid) {
        this.activeSection = 'restriction';
        return;
      }
    }
    for (const key of usageFields) {
      if (controls[key]?.invalid) {
        this.activeSection = 'usage';
      }
    }
  }

  private mapDetail(data: any): CouponDetail {
    return {
      id: data.id ?? data.Id,
      title: data.title ?? data.Title,
      description: data.description ?? data.Description,
      code: data.code ?? data.Code,
      type: data.type ?? data.Type,
      amount: data.amount ?? data.Amount,
      minSpend: data.minSpend ?? data.MinSpend ?? 0,
      maxSpend: data.maxSpend ?? data.MaxSpend,
      isUnlimited: data.isUnlimited ?? data.IsUnlimited,
      usagePerCoupon: data.usagePerCoupon ?? data.UsagePerCoupon,
      usagePerCustomer: data.usagePerCustomer ?? data.UsagePerCustomer,
      isExpired: data.isExpired ?? data.IsExpired,
      startDate: data.startDate ?? data.StartDate,
      endDate: data.endDate ?? data.EndDate,
      isApplyAll: data.isApplyAll ?? data.IsApplyAll,
      isFirstOrder: data.isFirstOrder ?? data.IsFirstOrder,
      isActive: data.isActive ?? data.IsActive,
    };
  }
}
