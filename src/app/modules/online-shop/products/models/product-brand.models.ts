export interface AdminProductBrandListItem {
  id: string;
  name: string;
  isPopular: boolean;
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
