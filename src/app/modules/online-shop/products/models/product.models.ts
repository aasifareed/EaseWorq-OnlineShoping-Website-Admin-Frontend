export interface AdminProductListItem {
  id: string;
  productId: string;
  productIdTag: string;
  productName: string;
  categoryName: string;
  brandName: string;
  availableQuantity: number;
  unitStock: number;
  actualSellPrice: number;
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
  isAvailable?: boolean;
  showProductOnline?: boolean;
}

export interface AdminProductsQuery {
  skipCount: number;
  maxResultCount: number;
  keyword?: string;
  sorting?: string;
}
