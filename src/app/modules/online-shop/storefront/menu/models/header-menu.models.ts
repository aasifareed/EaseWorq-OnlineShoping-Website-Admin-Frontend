export interface ProductCategoryOption {
  id: string;
  name: string;
}

export interface OnlineShopHeaderMenu {
  id?: string;
  tenantId?: number;
  customStoreId?: string;
  headerDropdown1ProductGroupId?: string | null;
  headerDropdown2ProductGroupId?: string | null;
  headerDropdown3ProductGroupId?: string | null;
}

export interface OnlineShopHeaderMenuForEdit {
  categories: ProductCategoryOption[];
  menu: OnlineShopHeaderMenu;
}
