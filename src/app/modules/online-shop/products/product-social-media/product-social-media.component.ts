import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { AdminProductListItem } from '../models/product.models';
import { PublishMetaPagePostResult } from '../models/facebook-post.models';
import { ProductImagesModalComponent } from '../product-images-modal/product-images-modal.component';
import { ProductFacebookPostModalComponent } from '../product-facebook-post-modal/product-facebook-post-modal.component';
import { ProductReelModalComponent } from '../product-reel-modal/product-reel-modal.component';
import { SimpleFacebookPostModalComponent } from '../simple-facebook-post-modal/simple-facebook-post-modal.component';
import { SimpleFacebookReelModalComponent } from '../simple-facebook-reel-modal/simple-facebook-reel-modal.component';
import { MetaCatalogSyncModalComponent } from '../meta-catalog-sync-modal/meta-catalog-sync-modal.component';
import { ProductsService } from '../services/products.service';
import { calculateProductsGridLayout } from '../utils/products-grid-layout.util';
import { ProductsTabGrid } from '../utils/products-tab-grid';

@Component({
  selector: 'app-product-social-media',
  templateUrl: './product-social-media.component.html',
  styleUrls: ['./product-social-media.component.css', '../products.component.css'],
})
export class ProductSocialMediaComponent implements OnInit, ProductsTabGrid {
  ColumnMode = ColumnMode;
  data: AdminProductListItem[] = [];
  filteredData: AdminProductListItem[] = [];
  searchControl = new FormControl('');
  publishKindControl = new FormControl('post');
  /** Empty string = All; otherwise SocialMinDaysAgo value as string. */
  daysFilterControl = new FormControl('');
  readonly daysFilterOptions: { value: string; labelKey: string }[] = [
    { value: '', labelKey: 'All' },
    { value: '-1', labelKey: 'Never' },
    { value: '0', labelKey: 'Today' },
    { value: '1', labelKey: '1+ days ago' },
    { value: '2', labelKey: '2+ days ago' },
    { value: '3', labelKey: '3+ days ago' },
    { value: '4', labelKey: '4+ days ago' },
    { value: '5', labelKey: '5+ days ago' },
    { value: '6', labelKey: '6+ days ago' },
    { value: '7', labelKey: '7+ days ago' },
    { value: '14', labelKey: '14+ days ago' },
    { value: '21', labelKey: '21+ days ago' },
    { value: '30', labelKey: '30+ days ago' },
  ];
  gridHeight = '100%';
  loadingIndicator = false;
  loadError: string | null = null;
  private readonly savingKeys = new Set<string>();

  page = new Page();

  constructor(
    private productsService: ProductsService,
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
      this.loadProducts();
    });

    this.publishKindControl.valueChanges.subscribe(() => {
      this.page.pageNumber = 0;
      this.loadProducts();
    });

    this.daysFilterControl.valueChanges.subscribe(() => {
      this.page.pageNumber = 0;
      this.loadProducts();
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
    const layout = calculateProductsGridLayout(this.el.nativeElement, { rowHeight: 64 });
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
    if (!this.page.size || this.page.size <= 0) {
      this.calculatePageSize(false);
    }

    this.loadingIndicator = true;
    this.loadError = null;
    const keyword = (this.searchControl.value || '').trim();
    const daysRaw = (this.daysFilterControl.value || '').trim();
    const socialMinDaysAgo = daysRaw === '' ? undefined : Number(daysRaw);
    const socialPublishKind =
      this.publishKindControl.value === 'reel' ? 'reel' : 'post';

    this.productsService
      .getProducts({
        skipCount: this.page.pageNumber * this.page.size,
        maxResultCount: this.page.size,
        keyword: keyword || undefined,
        sorting: 'Product.ProductName asc',
        socialPublishKind: socialMinDaysAgo == null || Number.isNaN(socialMinDaysAgo)
          ? undefined
          : socialPublishKind,
        socialMinDaysAgo:
          socialMinDaysAgo == null || Number.isNaN(socialMinDaysAgo)
            ? undefined
            : socialMinDaysAgo,
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

  isSavingShowOnMeta(row: AdminProductListItem): boolean {
    return this.savingKeys.has(this.savingKey(row));
  }

  onShowOnMetaToggle(row: AdminProductListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isSavingShowOnMeta(row)) {
      input.checked = row.showOnMeta;
      return;
    }

    const key = this.savingKey(row);
    this.savingKeys.add(key);

    this.productsService
      .updateForAdmin({
        productInventoryId: row.id,
        productId: row.productId,
        showOnMeta: input.checked,
      })
      .subscribe({
        next: (updated) => {
          this.savingKeys.delete(key);
          this.replaceRow(updated);
          this.toastr.success(this.translate.instant('Product updated.'));
        },
        error: (err) => {
          this.savingKeys.delete(key);
          input.checked = row.showOnMeta;
          const message =
            err?.error?.error?.message || this.translate.instant('Failed to update product.');
          this.toastr.error(message);
        },
      });
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

  formatDaysSince(iso: string | null | undefined): string {
    if (!iso) {
      return this.translate.instant('Never');
    }
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) {
      return this.translate.instant('Never');
    }

    const now = new Date();
    const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDay = Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
    const days = Math.max(0, Math.floor((startOfToday - startOfDay) / 86400000));

    if (days === 0) {
      return this.translate.instant('Today');
    }
    if (days === 1) {
      return this.translate.instant('1 day ago');
    }
    return `${days} ${this.translate.instant('days ago')}`;
  }

  getSocialAgeTitle(row: AdminProductListItem): string {
    const post = row.lastPostPublishedAt
      ? new Date(row.lastPostPublishedAt).toLocaleString()
      : this.translate.instant('Never');
    const reel = row.lastReelPublishedAt
      ? new Date(row.lastReelPublishedAt).toLocaleString()
      : this.translate.instant('Never');
    return `${this.translate.instant('Post')}: ${post}\n${this.translate.instant('Reel')}: ${reel}`;
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

  openFacebookPostModal(row: AdminProductListItem): void {
    const modalRef = this.modalService.open(ProductFacebookPostModalComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'ew-app-modal ew-app-modal--wide',
    });
    modalRef.componentInstance.product = { ...row };

    modalRef.result.then(
      (result: PublishMetaPagePostResult) => {
        this.handleFacebookPublishResult(result);
      },
      () => undefined,
    );
  }

  openReelModal(row: AdminProductListItem): void {
    const modalRef = this.modalService.open(ProductReelModalComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'ew-app-modal ew-app-modal--wide',
    });
    modalRef.componentInstance.product = { ...row };

    modalRef.result.then(
      (result: PublishMetaPagePostResult) => {
        this.handleFacebookPublishResult(
          result,
          'Facebook Reel published successfully. Click here to view.',
        );
      },
      () => undefined,
    );
  }

  openSimpleFacebookPostModal(): void {
    const modalRef = this.modalService.open(SimpleFacebookPostModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg',
      windowClass: 'ew-app-modal',
    });

    modalRef.result.then(
      (result: PublishMetaPagePostResult) => {
        this.handleFacebookPublishResult(result);
      },
      () => undefined,
    );
  }

  /** Opens the standalone (non-product) Facebook Reel creator. */
  openSimpleFacebookReelModal(): void {
    const modalRef = this.modalService.open(SimpleFacebookReelModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg',
      windowClass: 'ew-app-modal ew-app-modal--wide',
    });

    modalRef.result.then(
      (result: PublishMetaPagePostResult) => {
        this.handleFacebookPublishResult(
          result,
          'Facebook Reel published successfully. Click here to view.',
        );
      },
      () => undefined,
    );
  }

  openMetaCatalogSyncModal(): void {
    this.modalService.open(MetaCatalogSyncModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'ew-app-modal',
    });
  }

  private handleFacebookPublishResult(
    result: PublishMetaPagePostResult,
    successMessage = 'Facebook post published successfully. Click here to view.',
  ): void {
    if (result?.permalink) {
      const toast = this.toastr.success(this.translate.instant(successMessage), '', {
        enableHtml: false,
        timeOut: 8000,
      });
      toast.onTap.subscribe(() => {
        window.open(result.permalink, '_blank', 'noopener,noreferrer');
      });
    } else if (result?.success) {
      this.toastr.success(this.translate.instant('Facebook post published successfully.'));
    }

    if (result?.success || result?.permalink) {
      this.loadProducts();
    }
  }

  private replaceRow(updated: AdminProductListItem): void {
    const replace = (items: AdminProductListItem[]) =>
      items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));

    this.data = replace(this.data);
    this.filteredData = replace(this.filteredData);
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

  private savingKey(row: AdminProductListItem): string {
    return `${row.id}:showOnMeta`;
  }
}
