/**
 * Wire values for the online shop discount engine. The API stores and compares these exact strings,
 * so they mirror the backend constants: OnlineShopCouponTypes, OnlineShopDiscountScopes,
 * OnlineShopShippingRuleTypes and OnlineShopShippingChargeTypes. Changing a value here without
 * changing it there silently stops a coupon or delivery rule from matching.
 */
export enum CouponTypeEnum {
  Percentage = 'percentage',
  Fixed = 'fixed',
  FreeShipping = 'free_shipping',
}

/** What a discount reduces. Discounts in different scopes combine; within one scope the best wins. */
export enum DiscountScopeEnum {
  Product = 'product',
  Order = 'order',
  Shipping = 'shipping',
}

/** Whether a delivery rule bands on order value or on billable weight. */
export enum ShippingRuleTypeEnum {
  BaseOnPrice = 'base_on_price',
  BaseOnWeight = 'base_on_weight',
}

/** How much a matched delivery rule takes off the courier's quote. */
export enum ShippingChargeTypeEnum {
  Fixed = 'fixed',
  Percentage = 'percentage',
  Free = 'free',
}
