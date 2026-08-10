export interface AdminProductListItem {
  id: string;
  productId: string;
  productIdTag: string;
  productName: string;
  categoryName: string;
  brandName: string;
  /** SEO / shareable storefront URL slug. */
  slug: string;
  availableQuantity: number;
  unitStock: number;
  actualSellPrice: number;
  /** Online-only percent discount (0–100). */
  discountPercent: number;
  /**
   * Catalogue weight of one unit, in kilograms — the unit the API and the couriers use. The grid
   * shows and edits it in grams; see `../shared/weight.util.ts`.
   */
  productWeightKg: number;
  isAvailable: boolean;
  showProductOnline: boolean;
  pictureUrl: string;
  pictureUrls: string[];
}

export interface OnlineShopProductImage {
  attachmentId?: string;
  posAttachmentId?: string;
  source?: 'OnlineShop' | 'Pos';
  url: string;
  isPrimary: boolean;
  canRemove: boolean;
}

export interface UpdateAdminProductPayload {
  productInventoryId: string;
  productId: string;
  actualSellPrice?: number;
  discountPercent?: number;
  /** Pass string to set/normalize; empty clears then auto-generates from name. */
  slug?: string;
  /** Unit weight in kilograms. Shared with POS — the same weight the POS product carries. */
  productWeightKg?: number;
  isAvailable?: boolean;
  showProductOnline?: boolean;
}

export interface AdminProductsQuery {
  skipCount: number;
  maxResultCount: number;
  keyword?: string;
  sorting?: string;
}
