import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { AdminProductBrandListItem } from '../models/product-brand.models';
import { ProductBrandsService } from '../services/product-brands.service';
import { calculateProductsGridLayout } from '../utils/products-grid-layout.util';
import { ProductsTabGrid } from '../utils/products-tab-grid';

@Component({
  selector: 'app-product-brands',
  templateUrl: './product-brands.component.html',
  styleUrls: ['./product-brands.component.css', '../products.component.css'],
})
export class ProductBrandsComponent implements OnInit, ProductsTabGrid {
  ColumnMode = ColumnMode;
  data: AdminProductBrandListItem[] = [];
  searchControl = new FormControl('');
  gridHeight = '100%';
  loadingIndicator = false;
  loadError: string | null = null;
  private readonly savingKeys = new Set<string>();

  page = new Page();

  constructor(
    private brandsService: ProductBrandsService,
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
      this.loadBrands();
    });
  }

  onTabActivated(): void {
    this.page.pageNumber = 0;
    this.calculatePageSize(true);
    setTimeout(() => this.calculatePageSize(false), 0);
    setTimeout(() => this.calculatePageSize(false), 120);
  }

  @HostListener('window:resize')
  onResize(): void {
    const previousSize = this.page.size;
    this.calculatePageSize(false);
    if (previousSize !== this.page.size) {
      this.page.pageNumber = 0;
      this.loadBrands();
    }
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
      this.loadBrands();
    }
  }

  loadBrands(): void {
    if (!this.page.size || this.page.size <= 0) {
      this.calculatePageSize(false);
    }

    this.loadingIndicator = true;
    this.loadError = null;

    const keyword = (this.searchControl.value || '').trim();

    this.brandsService
      .getBrands({
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        keyword: keyword || undefined,
        sorting: 'BrandName asc',
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
            err?.error?.error?.message || this.translate.instant('Failed to load brands');
          this.loadError = message;
          this.toastr.error(message);
        },
      });
  }

  setPage(pageInfo: { offset: number }): void {
    this.page.pageNumber = pageInfo.offset;
    this.loadBrands();
  }

  formatYesNo(value: boolean): string {
    return value ? this.translate.instant('Yes') : this.translate.instant('No');
  }

  isSaving(row: AdminProductBrandListItem): boolean {
    return this.savingKeys.has(this.savingKey(row));
  }

  togglePopular(row: AdminProductBrandListItem): void {
    if (this.isSaving(row)) {
      return;
    }
    this.saveBrandField(row, { isPopular: !row.isPopular });
  }

  private saveBrandField(
    row: AdminProductBrandListItem,
    patch: { isPopular: boolean },
  ): void {
    const key = this.savingKey(row);
    this.savingKeys.add(key);

    this.brandsService
      .updateForAdmin({
        brandId: row.id,
        ...patch,
      })
      .subscribe({
        next: (updated) => {
          this.savingKeys.delete(key);
          this.replaceRow(updated);
          this.toastr.success(this.translate.instant('Brand updated.'));
        },
        error: (err) => {
          this.savingKeys.delete(key);
          const message =
            err?.error?.error?.message || this.translate.instant('Failed to update brand.');
          this.toastr.error(message);
        },
      });
  }

  private savingKey(row: AdminProductBrandListItem): string {
    return `${row.id}:popular`;
  }

  private replaceRow(updated: AdminProductBrandListItem): void {
    this.data = this.data.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
  }
}
