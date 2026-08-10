import {
  CouponTypeEnum,
  DiscountScopeEnum,
} from 'src/app/shared/enum/online-shop-discount.enum';

export interface CouponListItem {
  id: string;
  title: string;
  code: string;
  type: string;
  amount?: number;
  isActive: boolean;
  creationTime: string;
}

export interface CouponDetail {
  id: string;
  title: string;
  description: string;
  code: string;
  type: string;
  amount?: number;
  minSpend: number;
  maxSpend?: number;
  isUnlimited: boolean;
  usagePerCoupon?: number;
  usagePerCustomer?: number;
  isExpired: boolean;
  startDate?: string;
  endDate?: string;
  isApplyAll: boolean;
  includeProductIds?: string;
  excludeProductIds?: string;
  isFirstOrder: boolean;
  isActive: boolean;
  /** What the coupon reduces. The server resolves it, so it is never blank on an existing coupon. */
  scope?: CouponScope;
  /** Ceiling on the reduction, in currency. Only meaningful for a percentage coupon. */
  maxDiscountAmount?: number;
}

/** Discounts in different scopes combine; within one scope only the best applies. */
export type CouponScope = DiscountScopeEnum;

/** Option shape for the product multi-select on the Restriction tab. */
export interface CouponProductOption {
  /** POS catalog product id — the same id the storefront cart sends when applying a coupon. */
  id: string;
  label: string;
}

export const COUPON_TYPES: { value: CouponTypeEnum; label: string }[] = [
  { value: CouponTypeEnum.Percentage, label: 'Percentage' },
  { value: CouponTypeEnum.Fixed, label: 'Fixed' },
  { value: CouponTypeEnum.FreeShipping, label: 'Free Shipping' },
];

/**
 * Free shipping is deliberately absent: a free-shipping coupon always reduces the delivery charge, so
 * its scope is decided by its type rather than chosen.
 */
export const COUPON_SCOPES: { value: CouponScope; label: string; hint: string }[] = [
  {
    value: DiscountScopeEnum.Order,
    label: 'Whole order',
    hint: 'Reduces the order total after any product discounts.',
  },
  {
    value: DiscountScopeEnum.Product,
    label: 'Selected products',
    hint: 'Reduces only the products this coupon targets.',
  },
];
