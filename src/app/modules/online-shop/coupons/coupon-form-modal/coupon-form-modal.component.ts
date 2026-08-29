import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ToastrService } from 'ngx-toastr';
import {
  CouponTypeEnum,
  DiscountScopeEnum,
} from 'src/app/shared/enum/online-shop-discount.enum';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { ProductsService } from '../../products/services/products.service';
import {
  COUPON_SCOPES,
  COUPON_TYPES,
  CouponDetail,
  CouponProductOption,
} from '../models/coupon.models';

/** The picker loads the catalogue in one page; the dropdown then filters client-side. */
const PRODUCT_OPTION_PAGE_SIZE = 500;

@Component({
  selector: 'app-coupon-form-modal',
  templateUrl: './coupon-form-modal.component.html',
  styleUrls: ['./coupon-form-modal.component.css'],
})
export class CouponFormModalComponent implements OnInit {
  @Input() couponId: string | null = null;
  /** When opened from the products grid, pre-select this catalog product. */
  @Input() prefillProductId: string | null = null;
  @Input() prefillProductLabel: string | null = null;
  /** Single-use defaults suited for sharing a code with one customer. */
  @Input() customerOfferMode = false;

  form: FormGroup;
  submitted = false;
  isLoading = false;
  title = 'Add Coupon';
  activeSection = 'general';

  couponTypes = COUPON_TYPES;
  couponScopes = COUPON_SCOPES;
  sections = [
    { id: 'general', label: 'General', icon: 'fa-cog' },
    { id: 'restriction', label: 'Restriction', icon: 'fa-ban' },
    { id: 'usage', label: 'Usage', icon: 'fa-pie-chart' },
  ];

  productOptions: CouponProductOption[] = [];
  productsLoading = false;
  productDropdownSettings: IDropdownSettings = {};

  /** Ids from the saved coupon, held until the product list arrives so selections can be rehydrated. */
  private pendingIncludeIds: string[] = [];
  private pendingExcludeIds: string[] = [];
  private productsLoaded = false;

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupValueChanges();
    this.buildProductDropdownSettings();

    if (this.prefillProductId) {
      this.pendingIncludeIds = [this.prefillProductId];
    }

    if (this.customerOfferMode) {
      this.applyCustomerOfferDefaults();
    }

    this.loadProductOptions();

    if (this.couponId) {
      this.title = 'Edit Coupon';
      this.loadCoupon(this.couponId);
    } else if (this.customerOfferMode) {
      this.title = 'Customer coupon';
    }
  }

  get f() {
    return this.form.controls;
  }

  get showAmount(): boolean {
    return this.f.type.value && !this.isFreeShipping;
  }

  get isFreeShipping(): boolean {
    return this.f.type.value === CouponTypeEnum.FreeShipping;
  }

  get isPercentage(): boolean {
    return this.f.type.value === CouponTypeEnum.Percentage;
  }

  get showExpiryDates(): boolean {
    return !!this.f.isExpired.value;
  }

  get showUsageLimits(): boolean {
    return !this.f.isUnlimited.value;
  }

  /**
   * Product targeting is only read for a product-scoped coupon: pricing consults the include and
   * exclude lists behind a scope check, so on a whole-order or free-shipping coupon they change
   * nothing. Hidden rather than ignored, so the form cannot suggest a restriction that will not hold.
   */
  get isProductScoped(): boolean {
    return this.showScope && this.f.scope.value === DiscountScopeEnum.Product;
  }

  get includeProductsInvalid(): boolean {
    return this.submitted && this.isProductScoped && this.f.includeProducts.invalid;
  }

  /** Free shipping always reduces the delivery charge, so there is no scope to choose. */
  get showScope(): boolean {
    return !this.isFreeShipping;
  }

  /** A cap bounds a computed reduction, which only a percentage produces. */
  get showMaxDiscount(): boolean {
    return this.isPercentage;
  }

  get scopeHint(): string {
    if (!this.showScope) {
      return 'A free-shipping coupon always reduces the delivery charge.';
    }
    return COUPON_SCOPES.find((s) => s.value === this.f.scope.value)?.hint ?? '';
  }

  /**
   * The band follows the scope: a product coupon is unlocked by spend on the products it targets, while
   * every other scope is unlocked by the cart as a whole. Worth saying, because "minimum spend" reads
   * either way.
   */
  get spendBandHint(): string {
    return this.isProductScoped
      ? 'Spend needed on the products above, not on the whole cart.'
      : 'Order value needed to unlock the coupon.';
  }

  /** An inverted band matches nothing, so the coupon would be dead on arrival. */
  get spendBandInverted(): boolean {
    const min = this.toNumber(this.f.minSpend.value);
    const max = this.toNumber(this.f.maxSpend.value);
    return min != null && max != null && max < min;
  }

  setSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid || this.spendBandInverted) {
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
      includeProducts: [[]],
      excludeProducts: [[]],
      // Both gates are optional: blank means the coupon has no floor or ceiling on cart value.
      minSpend: [null, Validators.min(0)],
      maxSpend: [null, Validators.min(0)],
      isUnlimited: [false],
      usagePerCoupon: [null],
      usagePerCustomer: [null],
      scope: [DiscountScopeEnum.Order],
      maxDiscountAmount: [null],
    });
  }

  private buildProductDropdownSettings(): void {
    this.productDropdownSettings = {
      singleSelection: false,
      idField: 'id',
      textField: 'label',
      selectAllText: this.translate.instant('Select All'),
      unSelectAllText: this.translate.instant('UnSelect All'),
      itemsShowLimit: 3,
      allowSearchFilter: true,
      closeDropDownOnSelection: false,
      maxHeight: 220,
    };
  }

  private loadProductOptions(): void {
    this.productsLoading = true;
    this.productsService
      .getProducts({ skipCount: 0, maxResultCount: PRODUCT_OPTION_PAGE_SIZE })
      .subscribe({
        next: ({ items }) => {
          // The admin list is inventory-level, so one POS product can appear on several rows.
          const byId = new Map<string, CouponProductOption>();
          for (const p of items || []) {
            // Mirror the storefront's `productId ?? id` fallback so saved ids match what the cart sends.
            const id = String(p.productId || p.id || '');
            if (!id || byId.has(id)) {
              continue;
            }
            byId.set(id, { id, label: p.productName || p.productIdTag || id });
          }
          this.productOptions = Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
          this.productsLoading = false;
          this.productsLoaded = true;
          this.applyPendingProductSelection();
        },
        error: () => {
          this.productsLoading = false;
          this.productsLoaded = true;
          this.applyPendingProductSelection();
          this.toastr.error(
            this.translate.instant('Could not load products.'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  /**
   * Runs once both the coupon and the product list have arrived. Ids that are no longer in the
   * catalogue are kept as raw-id options so editing a coupon never silently drops its targeting.
   */
  private applyPendingProductSelection(): void {
    if (!this.productsLoaded) {
      return;
    }

    this.form.patchValue({
      includeProducts: this.toProductOptions(this.pendingIncludeIds),
      excludeProducts: this.toProductOptions(this.pendingExcludeIds),
    });
  }

  private toProductOptions(ids: string[]): CouponProductOption[] {
    return (ids || []).map((id) => {
      const found = this.productOptions.find((option) => option.id === id);
      if (found) {
        return found;
      }
      if (id === this.prefillProductId && this.prefillProductLabel?.trim()) {
        return { id, label: this.prefillProductLabel.trim() };
      }
      return { id, label: id };
    });
  }

  private applyCustomerOfferDefaults(): void {
    const label = this.prefillProductLabel?.trim() || this.translate.instant('product');
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 7);

    this.form.patchValue({
      title: this.translate.instant('Customer offer – {{product}}', { product: label }),
      description: this.translate.instant(
        'Special offer for {{product}}. Share the coupon code with your customer.',
        { product: label },
      ),
      code: this.generateOfferCode(),
      type: CouponTypeEnum.Fixed,
      scope: DiscountScopeEnum.Product,
      isUnlimited: false,
      usagePerCoupon: 1,
      usagePerCustomer: 1,
      isExpired: true,
      startDate: this.formatDateInput(today),
      endDate: this.formatDateInput(end),
      isActive: true,
    });
    this.syncProductTargeting();
  }

  private generateOfferCode(): string {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `OFFER-${suffix}`;
  }

  private formatDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static parseProductIds(raw: unknown): string[] {
    if (!raw) {
      return [];
    }
    return String(raw)
      .split(/[,;[\]"\s]+/)
      .map((segment) => segment.trim())
      .filter((segment) => !!segment);
  }

  /** Blank, null and empty-string all mean "not set" on an optional number field. */
  private toNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private static requireAtLeastOneProduct(control: AbstractControl): ValidationErrors | null {
    return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
  }

  private setupValueChanges(): void {
    this.f.type.valueChanges.subscribe((type) => {
      const amount = this.f.amount;
      if (type === CouponTypeEnum.FreeShipping) {
        amount.clearValidators();
        amount.setValue(null);
      } else {
        amount.setValidators([Validators.required, Validators.min(0)]);
      }
      amount.updateValueAndValidity();
      // Free shipping has no scope of its own, so the product pickers disappear with it.
      this.syncProductTargeting();
    });

    this.f.scope.valueChanges.subscribe(() => this.syncProductTargeting());

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

  /**
   * A product-scoped coupon needs at least one product to reduce; any other scope must not be held
   * back by a picker it does not show.
   */
  private syncProductTargeting(): void {
    const include = this.f.includeProducts;
    if (this.isProductScoped) {
      include.setValidators([CouponFormModalComponent.requireAtLeastOneProduct]);
    } else {
      include.clearValidators();
    }
    include.updateValueAndValidity({ emitEvent: false });
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
          // A stored zero is the absence of a floor, so show it as blank rather than a figure that
          // looks deliberate.
          minSpend: c.minSpend ? c.minSpend : null,
          maxSpend: c.maxSpend ?? null,
          isUnlimited: c.isUnlimited,
          usagePerCoupon: c.usagePerCoupon,
          usagePerCustomer: c.usagePerCustomer,
          // Shipping scope belongs to free-shipping coupons and is not offered in the dropdown, so the
          // control falls back to the order default rather than holding an unselectable value.
          scope:
            c.scope && c.scope !== DiscountScopeEnum.Shipping
              ? c.scope
              : DiscountScopeEnum.Order,
          maxDiscountAmount: c.maxDiscountAmount ?? null,
        });
        this.pendingIncludeIds = CouponFormModalComponent.parseProductIds(c.includeProductIds);
        this.pendingExcludeIds = CouponFormModalComponent.parseProductIds(c.excludeProductIds);
        this.syncProductTargeting();
        this.applyPendingProductSelection();
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
      amount: this.isFreeShipping ? null : Number(v.amount),
      // The server takes a non-nullable minimum, so "no minimum" travels as zero.
      minSpend: this.toNumber(v.minSpend) ?? 0,
      maxSpend: this.toNumber(v.maxSpend),
      isUnlimited: !!v.isUnlimited,
      usagePerCoupon: v.isUnlimited ? null : v.usagePerCoupon,
      usagePerCustomer: v.isUnlimited ? null : v.usagePerCustomer,
      isExpired: !!v.isExpired,
      startDate: v.isExpired && v.startDate ? v.startDate : null,
      endDate: v.isExpired && v.endDate ? v.endDate : null,
      // Targeting follows the scope rather than being set separately: only a product-scoped coupon
      // narrows to a product list, and every other scope reduces the whole thing.
      isApplyAll: !this.isProductScoped,
      isFirstOrder: !!v.isFirstOrder,
      isActive: !!v.isActive,
      includeProductIds: this.isProductScoped ? this.joinProductIds(v.includeProducts) : null,
      excludeProductIds: this.isProductScoped ? this.joinProductIds(v.excludeProducts) : null,
      // Free shipping's scope is its type; the server decides it either way.
      scope: this.isFreeShipping ? null : v.scope,
      maxDiscountAmount: this.showMaxDiscount ? this.toNumber(v.maxDiscountAmount) : null,
    };
  }

  private joinProductIds(selection: CouponProductOption[]): string | null {
    const ids = (selection || []).map((option) => option?.id).filter((id) => !!id);
    return ids.length ? Array.from(new Set(ids)).join(',') : null;
  }

  private focusInvalidSection(): void {
    const controls = this.form.controls;
    const generalFields = [
      'title',
      'description',
      'code',
      'type',
      'amount',
      'maxDiscountAmount',
      'startDate',
      'endDate',
    ];
    const restrictionFields = ['scope', 'includeProducts', 'minSpend'];
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
    if (this.spendBandInverted) {
      this.activeSection = 'restriction';
      return;
    }
    for (const key of usageFields) {
      if (controls[key]?.invalid) {
        this.activeSection = 'usage';
        return;
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
      includeProductIds: data.includeProductIds ?? data.IncludeProductIds,
      excludeProductIds: data.excludeProductIds ?? data.ExcludeProductIds,
      isFirstOrder: data.isFirstOrder ?? data.IsFirstOrder,
      isActive: data.isActive ?? data.IsActive,
      scope: data.scope ?? data.Scope,
      maxDiscountAmount: data.maxDiscountAmount ?? data.MaxDiscountAmount,
    };
  }
}
