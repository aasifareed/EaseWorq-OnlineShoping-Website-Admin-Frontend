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
import { ProductsService } from './services/products.service';
import { calculateProductsGridLayout } from './utils/products-grid-layout.util';
import { ProductCategoriesComponent } from './product-categories/product-categories.component';
import { ProductBrandsComponent } from './product-brands/product-brands.component';

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
      this.calculatePageSize();
      return;
    }
    if (index === 1) {
      this.categoriesTab?.onTabActivated();
      setTimeout(() => this.categoriesTab?.onTabActivated(), 50);
      return;
    }
    if (index === 2) {
      this.brandsTab?.onTabActivated();
      setTimeout(() => this.brandsTab?.onTabActivated(), 50);
    }
  }

  ngOnInit(): void {
    this.calculatePageSize();

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
    const previousSize = this.page.size;
    this.calculatePageSize();
    if (previousSize !== this.page.size) {
      this.page.pageNumber = 0;
      this.loadProducts();
    }
  }

  calculatePageSize(): void {
    if (this.activeTab !== 0) {
      return;
    }

    const layout = calculateProductsGridLayout(this.el.nativeElement);
    this.page.size = layout.pageSize;
    this.gridHeight = layout.gridHeight;
    this.loadProducts();
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

  formatYesNo(value: boolean): string {
    return value ? this.translate.instant('Yes') : this.translate.instant('No');
  }

  isSaving(row: AdminProductListItem, field: 'price' | 'showOnline' | 'available'): boolean {
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

  toggleShowOnline(row: AdminProductListItem): void {
    if (this.isSaving(row, 'showOnline')) {
      return;
    }
    this.saveProductField(row, 'showOnline', { showProductOnline: !row.showProductOnline });
  }

  toggleAvailable(row: AdminProductListItem): void {
    if (this.isSaving(row, 'available')) {
      return;
    }
    this.saveProductField(row, 'available', { isAvailable: !row.isAvailable });
  }

  private saveProductField(
    row: AdminProductListItem,
    field: 'price' | 'showOnline' | 'available',
    patch: { actualSellPrice?: number; isAvailable?: boolean; showProductOnline?: boolean },
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
