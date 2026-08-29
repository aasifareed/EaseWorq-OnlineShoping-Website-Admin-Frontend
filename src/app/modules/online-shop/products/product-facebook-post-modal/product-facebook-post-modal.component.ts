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
  baseCaption = '';
  includePriceChallenge = false;
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
    return this.images
      .filter((img) => img.selected)
      .sort((a, b) => (a.publishOrder ?? 0) - (b.publishOrder ?? 0));
  }

  get displayImages(): MetaPagePostImage[] {
    const selected = this.selectedImages;
    const unselected = this.images
      .filter((img) => !img.selected)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return [...selected, ...unselected];
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
        this.baseCaption = draft.baseCaption || draft.caption || '';
        this.includePriceChallenge = !!draft.includePriceChallenge;
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
    if (image.selected) {
      image.publishOrder = this.nextPublishOrder();
    } else {
      image.publishOrder = undefined;
      this.compactPublishOrders();
    }
    this.images = [...this.images];
  }

  canMoveSelected(image: MetaPagePostImage, direction: -1 | 1): boolean {
    if (!image.selected || this.publishing) {
      return false;
    }
    const index = this.selectedOrderIndex(image);
    const target = index + direction;
    return index >= 0 && target >= 0 && target < this.selectedCount;
  }

  moveSelected(image: MetaPagePostImage, direction: -1 | 1): void {
    if (!this.canMoveSelected(image, direction)) {
      return;
    }

    const selected = this.selectedImages;
    const index = this.selectedOrderIndex(image);
    const swapWith = index + direction;
    const a = selected[index];
    const b = selected[swapWith];
    const orderA = a.publishOrder ?? index + 1;
    const orderB = b.publishOrder ?? swapWith + 1;
    a.publishOrder = orderB;
    b.publishOrder = orderA;
    this.images = [...this.images];
  }

  selectedOrderIndex(image: MetaPagePostImage): number {
    return this.selectedImages.findIndex((x) => x.imageId === image.imageId);
  }

  selectedOrderLabel(image: MetaPagePostImage): string {
    if (!image.selected) {
      return '';
    }
    const index = this.selectedOrderIndex(image);
    return index >= 0 ? String(index + 1) : '';
  }

  trackImageById(_index: number, image: MetaPagePostImage): string {
    return image.imageId;
  }

  openImagePreview(image: MetaPagePostImage): void {
    this.previewImage = image;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  onIncludePriceChallengeChange(checked: boolean): void {
    this.includePriceChallenge = checked;
    this.caption = this.buildCaption(this.baseCaption, checked);
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
        includePriceChallenge: this.includePriceChallenge,
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
        sortOrder: Number(img.sortOrder) > 0 ? Number(img.sortOrder) : index + 1,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.imageId.localeCompare(b.imageId))
      .map((img, index) => ({
        ...img,
        sortOrder: index + 1,
      }));

    if (cleaned.length && !cleaned.some((x) => x.selected)) {
      const primary = cleaned.find((x) => x.isPrimary) ?? cleaned[0];
      primary.selected = true;
    }

    let publishOrder = 0;
    return cleaned.map((img) => {
      if (!img.selected) {
        return { ...img, publishOrder: undefined };
      }
      publishOrder += 1;
      return { ...img, publishOrder };
    });
  }

  private nextPublishOrder(): number {
    const maxOrder = this.images
      .filter((img) => img.selected && img.publishOrder != null)
      .reduce((max, img) => Math.max(max, img.publishOrder ?? 0), 0);
    return maxOrder + 1;
  }

  private compactPublishOrders(): void {
    this.selectedImages.forEach((img, index) => {
      img.publishOrder = index + 1;
    });
  }

  private buildCaption(baseCaption: string, includePriceChallenge: boolean): string {
    const base = (baseCaption || '').trimEnd();
    const url = (this.draft?.priceChallengeUrl || '').trim();
    if (!includePriceChallenge || !url) {
      return base;
    }

    const block = `🔥 Found it cheaper?\nChallenge our price 👇\n\n${url}`;
    return base ? `${base}\n\n${block}` : block;
  }
}
