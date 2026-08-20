import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { AdminProductListItem } from './models/product.models';
import { ProductImagesModalComponent } from './product-images-modal/product-images-modal.component';
import { ProductEditModalComponent } from './product-edit-modal/product-edit-modal.component';
import { ProductsService } from './services/products.service';
import { calculateProductsGridLayout } from './utils/products-grid-layout.util';
import {
  MAX_PRODUCT_WEIGHT_GRAMS,
  gramsToKilograms,
  kilogramsToGrams,
} from '../shared/weight.util';
import { ProductCategoriesComponent } from './product-categories/product-categories.component';
import { ProductBrandsComponent } from './product-brands/product-brands.component';

/** The inline-editable cells, each saved on its own so one slow save cannot block the others. */
type EditableProductField = 'price' | 'discount' | 'slug' | 'weight' | 'showOnline' | 'showOnMeta' | 'available';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  activeTab = 0;
  ColumnMode = ColumnMode;
  data: AdminProductListItem[] = [];
  filteredData: AdminProductListItem[] = [];
  searchControl = new FormControl('');
  gridHeight = '100%';
  loadingIndicator = false;
  loadError: string | null = null;
  private readonly savingKeys = new Set<string>();

  page = new Page();

  @ViewChild(ProductCategoriesComponent)
  private categoriesTab?: ProductCategoriesComponent;

  @ViewChild(ProductBrandsComponent)
  private brandsTab?: ProductBrandsComponent;

  constructor(
    private productsService: ProductsService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
    public globalDataService: GlobalDataService,
    private el: ElementRef,
  ) {
    this.page.pageNumber = 0;
  }

  changeTab(index: number): void {
    this.activeTab = index;
    setTimeout(() => this.activateTab(index), 0);
  }

  private activateTab(index: number): void {
    if (index === 0) {
      this.onProductsTabActivated();
      return;
    }
    if (index === 1) {
      this.categoriesTab?.onTabActivated();
      return;
    }
    if (index === 2) {
      this.brandsTab?.onTabActivated();
    }
  }

  /** Re-measure after the tab DOM is painted so height matches Categories/Brands. */
  private onProductsTabActivated(): void {
    this.page.pageNumber = 0;
    this.calculatePageSize(true);
    setTimeout(() => this.calculatePageSize(true), 0);
    setTimeout(() => this.calculatePageSize(true), 100);
  }

  ngOnInit(): void {
    this.onProductsTabActivated();

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.pageNumber = 0;
      this.loadProducts();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.activeTab !== 0) {
      return;
    }
    this.calculatePageSize(true);
  }

  calculatePageSize(reload = true): void {
    if (this.activeTab !== 0) {
      return;
    }

    const layout = calculateProductsGridLayout(this.el.nativeElement);
    const sizeChanged = this.page.size !== layout.pageSize;
    this.page.size = layout.pageSize;
    this.gridHeight = layout.gridHeight;

    if (reload && (sizeChanged || this.data.length === 0)) {
      if (sizeChanged) {
        this.page.pageNumber = 0;
      }
      this.loadProducts();
    }
  }

  loadProducts(): void {
    this.loadingIndicator = true;
    this.loadError = null;

    const keyword = (this.searchControl.value || '').trim();

    this.productsService
      .getProducts({
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        keyword: keyword || undefined,
        sorting: 'Product.ProductName asc',
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.page.totalElements = totalCount;
          this.data = items;
          this.filteredData = [...items];
          this.loadingIndicator = false;
        },
        error: (err) => {
          this.loadingIndicator = false;
          this.data = [];
          this.filteredData = [];
          this.page.totalElements = 0;
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Failed to load products');
          this.loadError = message;
          this.toastr.error(message);
        },
      });
  }

  setPage(pageInfo: { offset: number }): void {
    this.page.pageNumber = pageInfo.offset;
    this.loadProducts();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  isSaving(row: AdminProductListItem, field: EditableProductField): boolean {
    return this.savingKeys.has(this.savingKey(row, field));
  }

  onSellPriceBlur(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input?.value);
    if (Number.isNaN(value) || value < 0) {
      input.value = String(row.actualSellPrice);
      this.toastr.warning(this.translate.instant('Enter a valid sell price.'));
      return;
    }
    if (value === row.actualSellPrice) {
      return;
    }
    this.saveProductField(row, 'price', { actualSellPrice: value });
  }

  onDiscountBlur(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input?.value);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      input.value = String(row.discountPercent ?? 0);
      this.toastr.warning(this.translate.instant('Enter a valid discount between 0 and 100.'));
      return;
    }
    const rounded = Math.round(value * 100) / 100;
    if (rounded === Number(row.discountPercent ?? 0)) {
      return;
    }
    this.saveProductField(row, 'discount', { discountPercent: rounded });
  }

  /** The unit weight as a human reads it: grams. 0 means no weight has been recorded yet. */
  weightGrams(row: AdminProductListItem): number {
    return kilogramsToGrams(row.productWeightKg);
  }

  /**
   * Unit weight, typed in grams because the catalogue is accessories weighing tens of grams. Couriers
   * quote on weight and an order's weight is summed from this, so a product left at 0 is invisible to
   * the shipping engine and its parcel gets quoted at the courier's minimum instead.
   */
  onWeightBlur(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const grams = Number(input?.value);
    const currentGrams = this.weightGrams(row);
    if (Number.isNaN(grams) || grams < 0 || grams > MAX_PRODUCT_WEIGHT_GRAMS) {
      input.value = String(currentGrams);
      this.toastr.warning(this.translate.instant('Enter a valid weight in grams.'));
      return;
    }
    const wholeGrams = Math.round(grams);
    if (wholeGrams === currentGrams) {
      return;
    }
    this.saveProductField(row, 'weight', { productWeightKg: gramsToKilograms(wholeGrams) });
  }

  slugPlaceholder(row: AdminProductListItem): string {
    return this.suggestSlug(row.productName) || 'product-slug';
  }

  onSlugBlur(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = String(input?.value ?? '').trim();
    const current = String(row.slug ?? '').trim();
    if (next === current) {
      return;
    }
    // Empty blur with no existing slug → auto-generate from product name.
    const payloadSlug = next || this.suggestSlug(row.productName) || '';
    this.saveProductField(row, 'slug', { slug: payloadSlug });
  }

  private suggestSlug(name: string): string {
    return String(name || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 180);
  }

  onShowOnlineToggle(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSaving(row, 'showOnline')) {
      input.checked = row.showProductOnline;
      return;
    }
    this.saveProductField(row, 'showOnline', { showProductOnline: input.checked }, input);
  }

  onShowOnMetaToggle(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSaving(row, 'showOnMeta')) {
      input.checked = row.showOnMeta;
      return;
    }
    this.saveProductField(row, 'showOnMeta', { showOnMeta: input.checked }, input);
  }

  onAvailableToggle(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSaving(row, 'available')) {
      input.checked = row.isAvailable;
      return;
    }
    this.saveProductField(row, 'available', { isAvailable: input.checked }, input);
  }

  private saveProductField(
    row: AdminProductListItem,
    field: EditableProductField,
    patch: {
      actualSellPrice?: number;
      discountPercent?: number;
      slug?: string;
      productWeightKg?: number;
      isAvailable?: boolean;
      showProductOnline?: boolean;
      showOnMeta?: boolean;
    },
    toggleInput?: HTMLInputElement,
  ): void {
    const key = this.savingKey(row, field);
    this.savingKeys.add(key);

    this.productsService
      .updateForAdmin({
        productInventoryId: row.id,
        productId: row.productId,
        ...patch,
      })
      .subscribe({
        next: (updated) => {
          this.savingKeys.delete(key);
          this.replaceRow(updated);
          this.toastr.success(this.translate.instant('Product updated.'));
        },
        error: (err) => {
          this.savingKeys.delete(key);
          if (toggleInput) {
            if (field === 'showOnline') {
              toggleInput.checked = row.showProductOnline;
            } else if (field === 'showOnMeta') {
              toggleInput.checked = row.showOnMeta;
            } else if (field === 'available') {
              toggleInput.checked = row.isAvailable;
            }
          }
          const message = err?.error?.error?.message || this.translate.instant('Failed to update product.');
          this.toastr.error(message);
        },
      });
  }

  private savingKey(row: AdminProductListItem, field: string): string {
    return `${row.id}:${field}`;
  }

  private replaceRow(updated: AdminProductListItem): void {
    const replace = (items: AdminProductListItem[]) =>
      items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));

    this.data = replace(this.data);
    this.filteredData = replace(this.filteredData);
  }

  getImageCount(row: AdminProductListItem): number {
    return row.pictureUrls?.length ?? (row.pictureUrl ? 1 : 0);
  }

  getDisplayLabel(row: AdminProductListItem): string {
    const custom = (row.displayName || '').trim();
    return custom || row.productName;
  }

  getProductNameTitle(row: AdminProductListItem): string {
    const display = this.getDisplayLabel(row);
    const posName = (row.productName || '').trim();
    if (row.displayName && posName && display !== posName) {
      return `${display}\n${posName}`;
    }
    return display;
  }

  openEditModal(row: AdminProductListItem): void {
    const modalRef = this.modalService.open(ProductEditModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg',
      windowClass: 'ew-app-modal ew-app-modal--wide',
    });
    modalRef.componentInstance.product = { ...row };

    modalRef.result.then(
      (updated: AdminProductListItem) => {
        if (updated) {
          this.replaceRow(updated);
        }
      },
      () => undefined,
    );
  }

  openImagesModal(row: AdminProductListItem): void {
    const modalRef = this.modalService.open(ProductImagesModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      windowClass: 'product-images-modal-window',
    });
    modalRef.componentInstance.product = { ...row };

    modalRef.result.then(
      (result: { uploaded?: boolean; pictureUrls?: string[] }) => {
        if (result?.uploaded) {
          this.updateRowPictures(row.productId, result.pictureUrls ?? []);
        }
      },
      () => undefined,
    );
  }

  private updateRowPictures(productId: string, pictureUrls: string[]): void {
    const patch = (items: AdminProductListItem[]) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              pictureUrls,
              pictureUrl: pictureUrls[0] ?? '',
            }
          : item,
      );

    this.data = patch(this.data);
    this.filteredData = patch(this.filteredData);
  }
}
