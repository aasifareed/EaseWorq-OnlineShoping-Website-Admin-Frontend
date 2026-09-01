import { Component, Input, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminProductListItem } from '../models/product.models';
import {
  MetaPagePostHistoryItem,
  MetaPagePostImage,
  MetaPageReelDraft,
  PublishMetaPageReelPayload,
} from '../models/facebook-post.models';
import { ProductsService } from '../services/products.service';

type ReelModalStep = 'edit' | 'preview';

@Component({
  selector: 'app-product-reel-modal',
  templateUrl: './product-reel-modal.component.html',
  styleUrls: [
    '../product-facebook-post-modal/product-facebook-post-modal.component.css',
    './product-reel-modal.component.css',
  ],
})
export class ProductReelModalComponent implements OnInit, OnDestroy {
  @Input() product!: AdminProductListItem;
  @ViewChild('previewVideo') previewVideoRef?: ElementRef<HTMLVideoElement>;

  loading = true;
  buildingPreview = false;
  publishing = false;
  loadError: string | null = null;
  previewError: string | null = null;
  draft: MetaPageReelDraft | null = null;
  caption = '';
  baseCaption = '';
  includePriceChallenge = false;
  showHistory = false;
  images: MetaPagePostImage[] = [];
  previewImage: MetaPagePostImage | null = null;
  step: ReelModalStep = 'edit';
  previewVideoUrl: string | null = null;
  previewVideoSafeUrl: SafeResourceUrl | null = null;
  previewDurationSeconds = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadDraft();
  }

  ngOnDestroy(): void {
    this.clearPreviewVideo();
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

  get reelDurationHint(): string {
    const configured = this.draft?.reelSecondsPerSlide ?? 3.5;
    const estimate = this.estimateReelDuration(this.selectedCount, configured);
    return `~${Math.ceil(estimate.total)}s video (${estimate.perSlide.toFixed(1)}s per slide, with voiceover and music)`;
  }

  get isBusy(): boolean {
    return this.loading || this.buildingPreview || this.publishing;
  }

  get canPreview(): boolean {
    if (!this.draft?.canPublish || !this.draft?.reelBuilderReady || this.isBusy) {
      return false;
    }
    return this.selectedCount > 0;
  }

  get canPublish(): boolean {
    return this.step === 'preview' && !!this.previewVideoSafeUrl && !this.isBusy && !this.previewError;
  }

  get willAppendProductLink(): boolean {
    if (!this.draft?.productUrl) {
      return false;
    }
    return !this.captionIncludesProductUrl(this.caption, this.draft.productUrl);
  }

  get effectivePublishCaption(): string {
    return this.ensureProductLinkInCaption(this.caption, this.draft?.productUrl);
  }

  get shoppingHost(): string {
    const host = (this.draft?.reelShoppingHost || '').trim();
    if (host) {
      return host;
    }
    return this.formatShoppingHost(this.draft?.productUrl);
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
    this.productsService.getFacebookReelDraft(this.product.productId).subscribe({
      next: (draft) => {
        this.draft = draft;
        this.baseCaption = draft.baseCaption || draft.caption || '';
        this.includePriceChallenge = !!draft.includePriceChallenge;
        this.caption = draft.caption || '';
        this.images = this.normalizeImages(draft.images || []);
        this.loading = false;
        if (!draft.reelBuilderReady && draft.reelDisabledReason) {
          this.loadError = draft.reelDisabledReason;
        } else if (!draft.canPublish && draft.disabledReason) {
          this.loadError = draft.disabledReason;
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadError =
          err?.error?.error?.message ||
          this.translate.instant('Failed to load Facebook Reel draft.');
      },
    });
  }

  toggleImage(image: MetaPagePostImage): void {
    if (this.isBusy || !this.draft?.canPublish || this.step !== 'edit') {
      return;
    }
    this.invalidatePreview();
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
    if (!image.selected || this.isBusy || this.step !== 'edit') {
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

    this.invalidatePreview();
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
    if (this.step !== 'edit') {
      return;
    }
    this.invalidatePreview();
    this.includePriceChallenge = checked;
    this.caption = this.buildCaption(this.baseCaption, checked);
  }

  onCaptionChange(): void {
    if (this.step === 'edit') {
      this.invalidatePreview();
    }
  }

  buildPreview(): void {
    if (!this.canPreview || !this.draft || this.buildingPreview) {
      return;
    }

    this.buildingPreview = true;
    this.previewError = null;
    this.clearPreviewVideo();
    this.step = 'preview';

    this.productsService.previewFacebookReel(this.buildReelPayload()).subscribe({
      next: (preview) => {
        this.buildingPreview = false;
        if (!preview.blob || preview.blob.size < 256) {
          this.previewError = this.translate.instant('Could not build Reel preview.');
          return;
        }

        this.clearPreviewVideo();
        this.previewVideoUrl = URL.createObjectURL(preview.blob);
        this.previewVideoSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewVideoUrl);
        this.previewDurationSeconds = preview.durationSeconds;
        this.queueVideoReload();
      },
      error: (err) => {
        this.buildingPreview = false;
        this.previewError =
          err?.error?.error?.message ||
          this.translate.instant('Could not build Reel preview.');
      },
    });
  }

  backToEdit(): void {
    if (this.isBusy) {
      return;
    }
    this.step = 'edit';
    this.previewError = null;
    this.clearPreviewVideo();
  }

  publish(): void {
    if (!this.canPublish || !this.draft || this.publishing) {
      return;
    }

    this.publishing = true;
    this.productsService.publishFacebookReel(this.buildReelPayload()).subscribe({
      next: (result) => {
        this.publishing = false;
        this.activeModal.close(result);
      },
      error: (err) => {
        this.publishing = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Facebook Reel publishing failed.');
        this.toastr.error(message);
      },
    });
  }

  onPreviewVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video?.duration && Number.isFinite(video.duration) && video.duration > 0) {
      this.previewDurationSeconds = video.duration;
    }
  }

  onPreviewVideoError(): void {
    this.previewError = this.translate.instant('Could not play the Reel preview in this browser.');
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

  private estimateReelDuration(
    slideCount: number,
    configuredPerSlide = 3.5,
  ): { total: number; perSlide: number } {
    const count = Math.max(1, slideCount);
    const base = configuredPerSlide > 0 ? configuredPerSlide : 3.5;
    let total = Math.max(10, Math.min(15, count * base));
    let perSlide = total / count;
    perSlide = Math.max(2, Math.min(15, perSlide));
    total = perSlide * count;
    if (total < 10) {
      perSlide = 10 / count;
      total = perSlide * count;
    }
    return { total, perSlide };
  }

  private buildReelPayload(): PublishMetaPageReelPayload {
    const selected = this.selectedImages.map((img, index) => ({
      imageId: img.imageId,
      order: index + 1,
    }));

    return {
      productId: this.draft!.productId,
      caption: this.caption.trim(),
      imageUrl: selected[0]
        ? this.images.find((x) => x.imageId === selected[0].imageId)?.url
        : undefined,
      selectedImages: selected,
      includePriceChallenge: this.includePriceChallenge,
    };
  }

  private invalidatePreview(): void {
    if (this.step === 'preview' || this.previewVideoUrl) {
      this.step = 'edit';
      this.previewError = null;
      this.clearPreviewVideo();
    }
  }

  private clearPreviewVideo(): void {
    if (this.previewVideoUrl) {
      URL.revokeObjectURL(this.previewVideoUrl);
      this.previewVideoUrl = null;
    }
    this.previewVideoSafeUrl = null;
    this.previewDurationSeconds = 0;
  }

  private queueVideoReload(): void {
    setTimeout(() => {
      const video = this.previewVideoRef?.nativeElement;
      if (!video) {
        return;
      }
      video.load();
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
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

  private captionIncludesProductUrl(caption: string, productUrl: string): boolean {
    const text = (caption || '').trim();
    const url = (productUrl || '').trim();
    if (!url) {
      return true;
    }
    if (text.toLowerCase().includes(url.toLowerCase())) {
      return true;
    }

    const normalized = url.replace(/\/$/, '');
    if (normalized !== url && text.toLowerCase().includes(normalized.toLowerCase())) {
      return true;
    }

    try {
      const parsed = new URL(url);
      const path = `${parsed.pathname}${parsed.search}`;
      if (path && path !== '/' && text.toLowerCase().includes(path.toLowerCase())) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  private ensureProductLinkInCaption(caption: string, productUrl?: string | null): string {
    const url = (productUrl || '').trim();
    let text = (caption || '').trim();
    if (!url || this.captionIncludesProductUrl(text, url)) {
      return text;
    }

    const block = `🛒 Order online:\n${url}`;
    return text ? `${text}\n\n${block}` : block;
  }

  private formatShoppingHost(productUrl?: string | null): string {
    const url = (productUrl || '').trim();
    if (!url) {
      return 'Link in caption';
    }

    try {
      const host = new URL(url).hostname.replace(/^www\./i, '');
      return host || 'Link in caption';
    } catch {
      return 'Link in caption';
    }
  }
}
