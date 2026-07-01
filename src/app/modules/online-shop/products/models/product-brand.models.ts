export interface AdminProductBrandListItem {
  id: string;
  name: string;
  isPopular: boolean;
  pictureUrl?: string;
}

export interface OnlineShopBrandImage {
  attachmentId?: string;
  url: string;
  canRemove: boolean;
}

export interface AdminProductBrandsQuery {
  skipCount: number;
  maxResultCount: number;
  keyword?: string;
  sorting?: string;
}

export interface UpdateAdminProductBrandPayload {
  brandId: string;
  isPopular?: boolean;
}
