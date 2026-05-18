export interface ShippingCountryListItem {
  id: string;
  countryName: string;
  countryCode: string;
  isActive: boolean;
  ruleCount: number;
}

export interface ShippingCountryDetail {
  id: string;
  countryName: string;
  countryCode: string;
  isActive: boolean;
  shippingRules: ShippingRule[];
}

export interface ShippingRule {
  id: string;
  onlineShopShippingCountryId: string;
  name: string;
  ruleType: string;
  min: number;
  max: number;
  shippingType: string;
  amount: number;
  isActive: boolean;
}

export interface ShippingCountryOption {
  countryCode: string;
  countryName: string;
}

export const SHIPPING_RULE_TYPES = [
  { value: 'base_on_price', label: 'Based on Price' },
  { value: 'base_on_weight', label: 'Based on Weight' },
];

export const SHIPPING_CHARGE_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'free', label: 'Free' },
];
