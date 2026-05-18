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
}

export const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'free_shipping', label: 'Free Shipping' },
];
