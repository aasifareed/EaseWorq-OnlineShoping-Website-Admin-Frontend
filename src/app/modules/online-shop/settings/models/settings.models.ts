export interface OnlineShopPosTaxItem {
  taxId: string;
  taxName: string;
  taxInPercentage: number;
  taxType: string;
}

export interface OnlineShopPosInfo {
  customStoreId?: string;
  storeName?: string;
  storeLogoUrl?: string;
  storeAddress?: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  email?: string;
  currencyName?: string;
  currencySymbol?: string;
  defaultLanguage?: string;
  timezone?: string;
  taxEnabled: boolean;
  taxSummary?: string;
  taxes?: OnlineShopPosTaxItem[];
}

export interface OnlineShopSettings {
  id?: string;
  tenantId?: number;
  customStoreId?: string;
  isOnlineShopEnabled: boolean;
  storeSlug?: string;
  domain?: string;
  themeName?: string;
  storefrontBannerImageUrl?: string;
  storefrontLogoOverrideUrl?: string;
  showOutOfStockProducts: boolean;
  allowGuestCheckout: boolean;
  isDeliveryEnabled: boolean;
  defaultDeliveryCharges?: number;
  freeDeliveryMinimumOrderAmount?: number;
  estimatedDeliveryDays?: number;
  isSameDayDeliveryEnabled: boolean;
  deliveryTimeSlotsJson?: string;
  isCashOnDeliveryEnabled: boolean;
  collectShippingChargesOnCod: boolean;
  isGoPayFastEnabled: boolean;
  onlineOrderPrefix?: string;
  onlineInvoicePrefix?: string;
  receiptFooterText?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaImageUrl?: string;
  /** Stops stacked promotions from selling below an acceptable margin. */
  isMarginProtectionEnabled?: boolean;
  /** Gross margin floor as a percentage of merchandise revenue, e.g. 15. */
  minimumGrossMarginPercentage?: number;
  /**
   * Kilograms assumed per unit for a product with no catalogue weight, so an unweighed line does not
   * quote the courier as if it weighed nothing. Absent means no assumption.
   */
  fallbackProductWeightKg?: number;
}

export interface OnlineShopSettingsForEdit {
  posInfo: OnlineShopPosInfo;
  settings: OnlineShopSettings;
}
