import {
  ShippingChargeTypeEnum,
  ShippingRuleTypeEnum,
} from 'src/app/shared/enum/online-shop-discount.enum';

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
  /** Null means the rule has no upper limit ("and above"). */
  max: number | null;
  shippingType: string;
  amount: number;
  isActive: boolean;
}

export interface ShippingCountryOption {
  countryCode: string;
  countryName: string;
}

export const SHIPPING_RULE_TYPES: { value: ShippingRuleTypeEnum; label: string }[] = [
  { value: ShippingRuleTypeEnum.BaseOnPrice, label: 'Based on Price' },
  { value: ShippingRuleTypeEnum.BaseOnWeight, label: 'Based on Weight' },
];

export const SHIPPING_CHARGE_TYPES: { value: ShippingChargeTypeEnum; label: string }[] = [
  { value: ShippingChargeTypeEnum.Fixed, label: 'Fixed' },
  { value: ShippingChargeTypeEnum.Percentage, label: 'Percentage' },
  { value: ShippingChargeTypeEnum.Free, label: 'Free' },
];
