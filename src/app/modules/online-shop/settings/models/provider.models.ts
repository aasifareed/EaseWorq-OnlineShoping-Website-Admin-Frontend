export interface CourierProviderListItem {
  id: string;
  courierProvider: string;
  providerCode: string;
  apiBaseUrl: string;
  isActive: boolean;
  isApiEnabled: boolean;
  isManualRateEnabled: boolean;
  clientIdMasked?: string;
  clientSecretMasked?: string;
  usernameMasked?: string;
  lastRefreshAt?: string;
  lastError?: string;
  hasAccessToken?: boolean;
}

export interface CourierProviderEdit {
  id?: string;
  courierProvider: string;
  providerCode: string;
  apiBaseUrl: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  isActive: boolean;
  isApiEnabled: boolean;
  isManualRateEnabled: boolean;
  expiry?: string;
}

export enum PaymentProviderCodeEnum {
  COD = 'COD',
  GoPayFast = 'GoPayFast',
}

export const PAYMENT_PROVIDER_OPTIONS: Array<{
  code: PaymentProviderCodeEnum;
  label: string;
  defaultName: string;
}> = [
  { code: PaymentProviderCodeEnum.COD, label: 'Cash on Delivery (COD)', defaultName: 'Cash on Delivery' },
  { code: PaymentProviderCodeEnum.GoPayFast, label: 'GoPayFast', defaultName: 'GoPayFast' },
];

export interface PaymentProviderListItem {
  id: string;
  providerName: string;
  providerCode: string;
  environment?: string;
  isActive: boolean;
  isApiEnabled: boolean;
  isDefault: boolean;
  sortOrder?: number;
  merchantIdMasked?: string;
  securedKeyMasked?: string;
  publicBaseUrl?: string;
  collectShippingChargesInAdvanceForCod?: boolean;
  lastError?: string;
  lastTestedAt?: string;
}

export interface PaymentProviderEdit {
  id?: string;
  customStoreId?: string;
  providerName: string;
  providerCode: string;
  environment?: string;
  baseUrl?: string;
  tokenApiUrl?: string;
  formUrl?: string;
  merchantId?: string;
  securedKey?: string;
  publicBaseUrl?: string;
  username?: string;
  password?: string;
  extraConfigJson?: string;
  isActive: boolean;
  isApiEnabled: boolean;
  isDefault: boolean;
  sortOrder?: number;
  collectShippingChargesInAdvanceForCod?: boolean;
}
