import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { AdminProductCategoryListItem } from '../models/product-category.models';
import { ProductCategoriesService } from '../services/product-categories.service';
import { CategoryImageModalComponent } from '../category-image-modal/category-image-modal.component';
import { ProductCategoryEditModalComponent } from '../product-category-edit-modal/product-category-edit-modal.component';
import { calculateProductsGridLayout } from '../utils/products-grid-layout.util';
import { ProductsTabGrid } from '../utils/products-tab-grid';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.css', '../products.component.css'],
})
export class ProductCategoriesComponent implements OnInit, ProductsTabGrid {
  ColumnMode = ColumnMode;
  data: AdminProductCategoryListItem[] = [];
  searchControl = new FormControl('');
  gridHeight = '100%';
  loadingIndicator = false;
  loadError: string | null = null;
  private readonly savingKeys = new Set<string>();

  page = new Page();

  constructor(
    private categoriesService: ProductCategoriesService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
    public globalDataService: GlobalDataService,
    private el: ElementRef,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 0;
  }

  ngOnInit(): void {
    this.onTabActivated();

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.pageNumber = 0;
      this.loadCategories();
    });
  }

  onTabActivated(): void {
    this.page.pageNumber = 0;
    this.calculatePageSize(true);
    setTimeout(() => this.calculatePageSize(true), 0);
    setTimeout(() => this.calculatePageSize(true), 100);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculatePageSize(true);
  }

  calculatePageSize(reload = true): void {
    const layout = calculateProductsGridLayout(this.el.nativeElement);
    const sizeChanged = this.page.size !== layout.pageSize;
    this.page.size = layout.pageSize;
    this.gridHeight = layout.gridHeight;
    if (reload && (sizeChanged || this.data.length === 0)) {
      if (sizeChanged) {
        this.page.pageNumber = 0;
      }
      this.loadCategories();
    }
  }

  loadCategories(): void {
    if (!this.page.size || this.page.size <= 0) {
      this.calculatePageSize(false);
    }

    this.loadingIndicator = true;
    this.loadError = null;

    const keyword = (this.searchControl.value || '').trim();

    this.categoriesService
      .getCategories({
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        keyword: keyword || undefined,
        sorting: 'Name asc',
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.page.totalElements = totalCount;
          this.data = items;
          this.loadingIndicator = false;
        },
        error: (err) => {
          this.loadingIndicator = false;
          this.data = [];
          this.page.totalElements = 0;
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Failed to load product categories');
          this.loadError = message;
          this.toastr.error(message);
        },
      });
  }

  setPage(pageInfo: { offset: number }): void {
    this.page.pageNumber = pageInfo.offset;
    this.loadCategories();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  openImageModal(row: AdminProductCategoryListItem): void {
    const modalRef = this.modalService.open(CategoryImageModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      windowClass: 'product-images-modal-window',
    });
    modalRef.componentInstance.category = { ...row };

    modalRef.result.then(
      (result: { changed?: boolean; pictureUrl?: string }) => {
        if (result?.changed) {
          this.updateRowPicture(row.id, result.pictureUrl ?? '');
        }
      },
      () => undefined,
    );
  }

  private updateRowPicture(categoryId: string, pictureUrl: string): void {
    this.data = this.data.map((item) =>
      item.id === categoryId ? { ...item, pictureUrl } : item,
    );
  }

  isSaving(row: AdminProductCategoryListItem, field: 'popular' | 'showOnline'): boolean {
    return this.savingKeys.has(this.savingKey(row, field));
  }

  onPopularToggle(row: AdminProductCategoryListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSaving(row, 'popular')) {
      input.checked = row.isPopular;
      return;
    }
    this.saveCategoryField(row, 'popular', { isPopular: input.checked }, input);
  }

  onShowOnlineToggle(row: AdminProductCategoryListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSaving(row, 'showOnline')) {
      input.checked = row.showCategoryOnline;
      return;
    }
    this.saveCategoryField(row, 'showOnline', { showCategoryOnline: input.checked }, input);
  }

  openEditModal(row: AdminProductCategoryListItem): void {
    const modalRef = this.modalService.open(ProductCategoryEditModalComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'ew-app-modal',
    });
    modalRef.componentInstance.category = { ...row };

    modalRef.result.then(
      (updated: AdminProductCategoryListItem) => {
        if (updated) {
          this.replaceRow(updated);
        }
      },
      () => undefined,
    );
  }

  getDisplayLabel(row: AdminProductCategoryListItem): string {
    const custom = (row.displayName || '').trim();
    return custom || row.name;
  }

  private saveCategoryField(
    row: AdminProductCategoryListItem,
    field: 'popular' | 'showOnline',
    patch: { isPopular?: boolean; showCategoryOnline?: boolean },
    toggleInput?: HTMLInputElement,
  ): void {
    const key = this.savingKey(row, field);
    this.savingKeys.add(key);

    this.categoriesService
      .updateForAdmin({
        productGroupId: row.id,
        ...patch,
      })
      .subscribe({
        next: (updated) => {
          this.savingKeys.delete(key);
          this.replaceRow(updated);
          this.toastr.success(this.translate.instant('Category updated.'));
        },
        error: (err) => {
          this.savingKeys.delete(key);
          if (toggleInput) {
            if (field === 'popular') {
              toggleInput.checked = row.isPopular;
            } else if (field === 'showOnline') {
              toggleInput.checked = row.showCategoryOnline;
            }
          }
          const message =
            err?.error?.error?.message || this.translate.instant('Failed to update category.');
          this.toastr.error(message);
        },
      });
  }

  private savingKey(row: AdminProductCategoryListItem, field: string): string {
    return `${row.id}:${field}`;
  }

  private replaceRow(updated: AdminProductCategoryListItem): void {
    this.data = this.data.map((item) =>
      item.id === updated.id
        ? {
            ...item,
            ...updated,
            pictureUrl: updated.pictureUrl || item.pictureUrl,
          }
        : item,
    );
  }
}
