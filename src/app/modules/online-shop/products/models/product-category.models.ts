export interface AdminProductCategoryListItem {
  id: string;
  name: string;
  showCategoryOnline: boolean;
  isPopular: boolean;
}

export interface AdminProductCategoriesQuery {
  skipCount: number;
  maxResultCount: number;
  keyword?: string;
  sorting?: string;
}

export interface UpdateAdminProductCategoryPayload {
  productGroupId: string;
  showCategoryOnline?: boolean;
  isPopular?: boolean;
}
