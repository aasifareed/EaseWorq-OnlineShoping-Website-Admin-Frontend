import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminProductListItem } from '../models/product.models';
import {
  MetaPagePostDraft,
  MetaPagePostHistoryItem,
  MetaPagePostImage,
} from '../models/facebook-post.models';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-facebook-post-modal',
  templateUrl: './product-facebook-post-modal.component.html',
  styleUrls: ['./product-facebook-post-modal.component.css'],
})
export class ProductFacebookPostModalComponent implements OnInit {
  @Input() product!: AdminProductListItem;

  loading = true;
  publishing = false;
  loadError: string | null = null;
  draft: MetaPagePostDraft | null = null;
  caption = '';
  showHistory = false;
  images: MetaPagePostImage[] = [];
  previewImage: MetaPagePostImage | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadDraft();
  }

  get history(): MetaPagePostHistoryItem[] {
    return this.draft?.recentPosts ?? [];
  }

  get selectedImages(): MetaPagePostImage[] {
    return this.images.filter((img) => img.selected);
  }

  get selectedCount(): number {
    return this.selectedImages.length;
  }

  get selectedCountLabel(): string {
    const count = this.selectedCount;
    if (count === 1) {
      return '1 image selected';
    }
    return `${count} images selected`;
  }

  get canPublish(): boolean {
    if (!this.draft?.canPublish || this.publishing || this.loading) {
      return false;
    }
    const hasCaption = !!this.caption.trim();
    const hasImages = this.selectedCount > 0;
    const hasLink = !!this.draft.productUrl?.trim();
    return hasCaption || hasImages || hasLink;
  }

  onPreviewImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  loadDraft(): void {
    if (!this.product?.productId) {
      this.loadError = this.translate.instant('Product is required.');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.loadError = null;
    this.productsService.getFacebookPostDraft(this.product.productId).subscribe({
      next: (draft) => {
        this.draft = draft;
        this.caption = draft.caption || '';
        this.images = this.normalizeImages(draft.images || []);
        this.loading = false;
        if (!draft.canPublish && draft.disabledReason) {
          this.loadError = draft.disabledReason;
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadError =
          err?.error?.error?.message ||
          this.translate.instant('Failed to load Facebook post draft.');
      },
    });
  }

  toggleImage(image: MetaPagePostImage): void {
    if (this.publishing || !this.draft?.canPublish) {
      return;
    }
    image.selected = !image.selected;
  }

  moveSelected(image: MetaPagePostImage, direction: -1 | 1): void {
    if (!image.selected || this.publishing) {
      return;
    }
    const selected = this.selectedImages;
    const index = selected.findIndex((x) => x.imageId === image.imageId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= selected.length) {
      return;
    }

    const a = selected[index];
    const b = selected[swapWith];
    const orderA = a.sortOrder;
    a.sortOrder = b.sortOrder;
    b.sortOrder = orderA;
    this.images = [...this.images].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  selectedOrderLabel(image: MetaPagePostImage): string {
    if (!image.selected) {
      return '';
    }
    const index = this.selectedImages.findIndex((x) => x.imageId === image.imageId);
    return index >= 0 ? String(index + 1) : '';
  }

  openImagePreview(image: MetaPagePostImage): void {
    this.previewImage = image;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  publish(): void {
    if (!this.canPublish || !this.draft || this.publishing) {
      return;
    }

    this.publishing = true;
    const selected = this.selectedImages.map((img, index) => ({
      imageId: img.imageId,
      order: index + 1,
    }));

    this.productsService
      .publishFacebookPost({
        productId: this.draft.productId,
        caption: this.caption.trim(),
        imageUrl: selected[0]
          ? this.images.find((x) => x.imageId === selected[0].imageId)?.url
          : undefined,
        selectedImages: selected,
      })
      .subscribe({
        next: (result) => {
          this.publishing = false;
          this.activeModal.close(result);
        },
        error: (err) => {
          this.publishing = false;
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Facebook publishing failed.');
          this.toastr.error(message);
        },
      });
  }

  openPermalink(url: string | null | undefined): void {
    if (!url) {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  formatHistoryDate(item: MetaPagePostHistoryItem): string {
    const raw = item.publishedAt || item.creationTime;
    if (!raw) {
      return '';
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return String(raw);
    }
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private normalizeImages(images: MetaPagePostImage[]): MetaPagePostImage[] {
    const seen = new Set<string>();
    const cleaned = images
      .filter((img) => !!img?.imageId && !!img?.url)
      .filter((img) => {
        const key = img.url.trim().toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((img, index) => ({
        ...img,
        sortOrder: img.sortOrder || index + 1,
      }));

    if (cleaned.length && !cleaned.some((x) => x.selected)) {
      const primary = cleaned.find((x) => x.isPrimary) ?? cleaned[0];
      primary.selected = true;
    }

    return cleaned.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
