import {
  ShippingChargeTypeEnum,
  ShippingRuleTypeEnum,
} from 'src/app/shared/enum/online-shop-discount.enum';
import { ShippingRule } from '../models/shipping.models';

/**
 * A delivery rule bands on one of two dimensions, and they are measured in different units: a price
 * rule's limits are currency, a weight rule's are kilograms. A bare "2 – 5" tells a reader nothing,
 * so every surface that shows a rule goes through here.
 *
 * Kilograms rather than the grams the product grid uses: courier rate cards are written in kilograms,
 * and a delivery threshold reads as "over 2 kg", not "over 2000 g".
 */

export function isWeightRule(ruleType: string): boolean {
  return ruleType === ShippingRuleTypeEnum.BaseOnWeight;
}

export function ruleLimitUnit(ruleType: string, currencySymbol: string): string {
  return isWeightRule(ruleType) ? 'kg' : currencySymbol;
}

export function formatRuleRange(rule: ShippingRule, currencySymbol: string): string {
  const unit = ruleLimitUnit(rule.ruleType, currencySymbol);
  const range =
    rule.max === null || rule.max === undefined
      ? `${rule.min} & above`
      : `${rule.min} – ${rule.max}`;

  return `${range} ${unit}`;
}

/**
 * What the rule takes off the courier's charge — not a delivery price. "Fixed 200" is 200 off, and
 * free waives the charge entirely.
 */
export function formatRuleDiscount(rule: ShippingRule, currencySymbol: string): string {
  if (rule.shippingType === ShippingChargeTypeEnum.Free) {
    return 'Delivery free';
  }
  if (rule.shippingType === ShippingChargeTypeEnum.Percentage) {
    return `${rule.amount}% off`;
  }
  return `${currencySymbol} ${rule.amount} off`;
}

export function ruleTypeLabel(ruleType: string): string {
  if (ruleType === ShippingRuleTypeEnum.BaseOnPrice) {
    return 'Based on Price';
  }
  if (isWeightRule(ruleType)) {
    return 'Based on Weight';
  }
  return ruleType;
}

export function shippingTypeLabel(shippingType: string): string {
  if (shippingType === ShippingChargeTypeEnum.Fixed) {
    return 'Fixed';
  }
  if (shippingType === ShippingChargeTypeEnum.Percentage) {
    return 'Percentage';
  }
  if (shippingType === ShippingChargeTypeEnum.Free) {
    return 'Free';
  }
  return shippingType;
}
