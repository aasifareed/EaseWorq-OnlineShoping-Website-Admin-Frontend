import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  OnlineShopPosInfo,
  OnlineShopSettings,
  OnlineShopSettingsForEdit,
} from '../models/settings.models';

@Injectable()
export class OnlineShopSettingsStateService {
  readonly form: FormGroup;
  private readonly posInfoSubject = new BehaviorSubject<OnlineShopPosInfo | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly savingSubject = new BehaviorSubject<boolean>(false);
  private loaded = false;

  readonly posInfo$ = this.posInfoSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly saving$ = this.savingSubject.asObservable();

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
    this.form = this.buildForm();
  }

  get posInfo(): OnlineShopPosInfo | null {
    return this.posInfoSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get saving(): boolean {
    return this.savingSubject.value;
  }

  ensureLoaded(): void {
    if (!this.loaded && !this.loading) {
      this.loadSettings();
    }
  }

  loadSettings(): void {
    this.loadingSubject.next(true);
    this.restService.get(environment.urls.Settings_GetForEdit).subscribe({
      next: (response) => {
        this.loadingSubject.next(false);
        if (response?.result) {
          this.applyResponse(this.normalizeForEdit(response.result));
          this.loaded = true;
        }
      },
      error: () => {
        this.loadingSubject.next(false);
        this.toastr.error(this.translate.instant('Failed to load settings'));
      },
    });
  }

  save(): Observable<boolean> {
    return new Observable((observer) => {
      const payload = { settings: this.buildPayload() };
      this.savingSubject.next(true);
      this.restService.postWithOutSpinner(environment.urls.Settings_Save, payload).subscribe({
        next: () => {
          this.savingSubject.next(false);
          this.toastr.success(this.translate.instant('Settings saved successfully'));
          this.loadSettings();
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          this.savingSubject.next(false);
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Failed to save settings');
          this.toastr.error(message);
          observer.next(false);
          observer.complete();
        },
      });
    });
  }

  displayValue(value: string | null | undefined): string {
    return value && String(value).trim() ? String(value).trim() : '—';
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      id: [null],
      customStoreId: [null],
      isOnlineShopEnabled: [true],
      storeSlug: [''],
      domain: [''],
      themeName: ['default'],
      storefrontBannerImageUrl: [''],
      storefrontLogoOverrideUrl: [''],
      showOutOfStockProducts: [false],
      allowGuestCheckout: [true],
      isDeliveryEnabled: [true],
      defaultDeliveryCharges: [null],
      freeDeliveryMinimumOrderAmount: [null],
      estimatedDeliveryDays: [null],
      isSameDayDeliveryEnabled: [false],
      deliveryTimeSlotsJson: [''],
      isCashOnDeliveryEnabled: [true],
      isGoPayFastEnabled: [false],
      onlineOrderPrefix: ['OS-'],
      onlineInvoicePrefix: ['INV-OS-'],
      receiptFooterText: [''],
      metaTitle: [''],
      metaDescription: [''],
      metaImageUrl: [''],
    });
  }

  private applyResponse(data: OnlineShopSettingsForEdit): void {
    this.posInfoSubject.next(data.posInfo || this.emptyPosInfo());
    const s = data.settings;
    this.form.patchValue({
      id: s.id || null,
      customStoreId: s.customStoreId || null,
      isOnlineShopEnabled: s.isOnlineShopEnabled !== false,
      storeSlug: s.storeSlug || '',
      domain: s.domain || '',
      themeName: s.themeName || 'default',
      storefrontBannerImageUrl: s.storefrontBannerImageUrl || '',
      storefrontLogoOverrideUrl: s.storefrontLogoOverrideUrl || '',
      showOutOfStockProducts: !!s.showOutOfStockProducts,
      allowGuestCheckout: s.allowGuestCheckout !== false,
      isDeliveryEnabled: s.isDeliveryEnabled !== false,
      defaultDeliveryCharges: s.defaultDeliveryCharges,
      freeDeliveryMinimumOrderAmount: s.freeDeliveryMinimumOrderAmount,
      estimatedDeliveryDays: s.estimatedDeliveryDays,
      isSameDayDeliveryEnabled: !!s.isSameDayDeliveryEnabled,
      deliveryTimeSlotsJson: s.deliveryTimeSlotsJson || '',
      isCashOnDeliveryEnabled: s.isCashOnDeliveryEnabled !== false,
      isGoPayFastEnabled: this.resolveGoPayFastEnabled(s),
      onlineOrderPrefix: s.onlineOrderPrefix || 'OS-',
      onlineInvoicePrefix: s.onlineInvoicePrefix || 'INV-OS-',
      receiptFooterText: s.receiptFooterText || '',
      metaTitle: s.metaTitle || '',
      metaDescription: s.metaDescription || '',
      metaImageUrl: s.metaImageUrl || '',
    });
  }

  private emptyPosInfo(): OnlineShopPosInfo {
    return { taxEnabled: false, taxes: [] };
  }

  private buildPayload(): OnlineShopSettings {
    const v = this.form.getRawValue();
    return {
      id: v.id || undefined,
      customStoreId: v.customStoreId || undefined,
      isOnlineShopEnabled: !!v.isOnlineShopEnabled,
      storeSlug: this.trimOrUndefined(v.storeSlug),
      domain: this.trimOrUndefined(v.domain),
      themeName: this.trimOrUndefined(v.themeName),
      storefrontBannerImageUrl: this.trimOrUndefined(v.storefrontBannerImageUrl),
      storefrontLogoOverrideUrl: this.trimOrUndefined(v.storefrontLogoOverrideUrl),
      showOutOfStockProducts: !!v.showOutOfStockProducts,
      allowGuestCheckout: !!v.allowGuestCheckout,
      isDeliveryEnabled: !!v.isDeliveryEnabled,
      defaultDeliveryCharges: this.toNumberOrUndefined(v.defaultDeliveryCharges),
      freeDeliveryMinimumOrderAmount: this.toNumberOrUndefined(v.freeDeliveryMinimumOrderAmount),
      estimatedDeliveryDays: this.toNumberOrUndefined(v.estimatedDeliveryDays),
      isSameDayDeliveryEnabled: !!v.isSameDayDeliveryEnabled,
      deliveryTimeSlotsJson: this.trimOrUndefined(v.deliveryTimeSlotsJson),
      isCashOnDeliveryEnabled: !!v.isCashOnDeliveryEnabled,
      isGoPayFastEnabled: !!v.isGoPayFastEnabled,
      onlineOrderPrefix: this.trimOrUndefined(v.onlineOrderPrefix),
      onlineInvoicePrefix: this.trimOrUndefined(v.onlineInvoicePrefix),
      receiptFooterText: this.trimOrUndefined(v.receiptFooterText),
      metaTitle: this.trimOrUndefined(v.metaTitle),
      metaDescription: this.trimOrUndefined(v.metaDescription),
      metaImageUrl: this.trimOrUndefined(v.metaImageUrl),
    };
  }

  private normalizeForEdit(raw: Record<string, unknown>): OnlineShopSettingsForEdit {
    const pos = (raw.posInfo || raw.PosInfo || {}) as Record<string, unknown>;
    const settings = (raw.settings || raw.Settings || {}) as Record<string, unknown>;
    const taxesRaw = (pos.taxes || pos.Taxes) as Record<string, unknown>[] | undefined;

    return {
      posInfo: {
        customStoreId: (pos.customStoreId || pos.CustomStoreId) as string,
        storeName: (pos.storeName || pos.StoreName) as string,
        storeLogoUrl: (pos.storeLogoUrl || pos.StoreLogoUrl) as string,
        storeAddress: (pos.storeAddress || pos.StoreAddress) as string,
        phoneNumber: (pos.phoneNumber || pos.PhoneNumber) as string,
        whatsAppNumber: (pos.whatsAppNumber || pos.WhatsAppNumber) as string,
        email: (pos.email || pos.Email) as string,
        currencyName: (pos.currencyName || pos.CurrencyName) as string,
        currencySymbol: (pos.currencySymbol || pos.CurrencySymbol) as string,
        defaultLanguage: (pos.defaultLanguage || pos.DefaultLanguage) as string,
        timezone: (pos.timezone || pos.Timezone) as string,
        taxEnabled: !!(pos.taxEnabled ?? pos.TaxEnabled),
        taxSummary: (pos.taxSummary || pos.TaxSummary) as string,
        taxes: taxesRaw?.map((t) => ({
          taxId: (t.taxId || t.TaxId) as string,
          taxName: (t.taxName || t.TaxName) as string,
          taxInPercentage: Number(t.taxInPercentage ?? t.TaxInPercentage ?? 0),
          taxType: (t.taxType || t.TaxType) as string,
        })),
      },
      settings: this.normalizeSettings(settings),
    };
  }

  private normalizeSettings(s: Record<string, unknown>): OnlineShopSettings {
    return {
      id: (s.id || s.Id) as string,
      customStoreId: (s.customStoreId || s.CustomStoreId) as string,
      isOnlineShopEnabled: (s.isOnlineShopEnabled ?? s.IsOnlineShopEnabled) !== false,
      storeSlug: (s.storeSlug || s.StoreSlug) as string,
      domain: (s.domain || s.Domain) as string,
      themeName: (s.themeName || s.ThemeName) as string,
      storefrontBannerImageUrl: (s.storefrontBannerImageUrl || s.StorefrontBannerImageUrl) as string,
      storefrontLogoOverrideUrl: (s.storefrontLogoOverrideUrl || s.StorefrontLogoOverrideUrl) as string,
      showOutOfStockProducts: !!(s.showOutOfStockProducts ?? s.ShowOutOfStockProducts),
      allowGuestCheckout: (s.allowGuestCheckout ?? s.AllowGuestCheckout) !== false,
      isDeliveryEnabled: (s.isDeliveryEnabled ?? s.IsDeliveryEnabled) !== false,
      defaultDeliveryCharges: (s.defaultDeliveryCharges ?? s.DefaultDeliveryCharges) as number,
      freeDeliveryMinimumOrderAmount: (s.freeDeliveryMinimumOrderAmount ??
        s.FreeDeliveryMinimumOrderAmount) as number,
      estimatedDeliveryDays: (s.estimatedDeliveryDays ?? s.EstimatedDeliveryDays) as number,
      isSameDayDeliveryEnabled: !!(s.isSameDayDeliveryEnabled ?? s.IsSameDayDeliveryEnabled),
      deliveryTimeSlotsJson: (s.deliveryTimeSlotsJson || s.DeliveryTimeSlotsJson) as string,
      isCashOnDeliveryEnabled: (s.isCashOnDeliveryEnabled ?? s.IsCashOnDeliveryEnabled) !== false,
      isGoPayFastEnabled: this.resolveGoPayFastEnabledFromRaw(s),
      onlineOrderPrefix: (s.onlineOrderPrefix || s.OnlineOrderPrefix) as string,
      onlineInvoicePrefix: (s.onlineInvoicePrefix || s.OnlineInvoicePrefix) as string,
      receiptFooterText: (s.receiptFooterText || s.ReceiptFooterText) as string,
      metaTitle: (s.metaTitle || s.MetaTitle) as string,
      metaDescription: (s.metaDescription || s.MetaDescription) as string,
      metaImageUrl: (s.metaImageUrl || s.MetaImageUrl) as string,
    };
  }

  private resolveGoPayFastEnabled(s: OnlineShopSettings): boolean {
    if (s.isGoPayFastEnabled) {
      return true;
    }
    return this.resolveGoPayFastEnabledFromRaw(s as unknown as Record<string, unknown>);
  }

  private resolveGoPayFastEnabledFromRaw(s: Record<string, unknown>): boolean {
    if (s.isGoPayFastEnabled === true || s.IsGoPayFastEnabled === true) {
      return true;
    }
    return !!(
      s.isBankTransferEnabled ??
      s.IsBankTransferEnabled ??
      s.isJazzCashEnabled ??
      s.IsJazzCashEnabled ??
      s.isEasyPaisaEnabled ??
      s.IsEasyPaisaEnabled ??
      s.isCardOnlinePaymentEnabled ??
      s.IsCardOnlinePaymentEnabled
    );
  }

  private trimOrUndefined(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : undefined;
  }

  private toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }
}
