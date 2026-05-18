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
  isGoPayFastEnabled: boolean;
  onlineOrderPrefix?: string;
  onlineInvoicePrefix?: string;
  receiptFooterText?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaImageUrl?: string;
}

export interface OnlineShopSettingsForEdit {
  posInfo: OnlineShopPosInfo;
  settings: OnlineShopSettings;
}
