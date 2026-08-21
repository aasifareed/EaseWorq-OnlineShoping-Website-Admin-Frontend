import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminProductListItem } from '../models/product.models';
import {
  MetaPagePostDraft,
  MetaPagePostHistoryItem,
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

  /** Same URL the products grid uses — not the Meta-rewritten public CDN URL. */
  get previewImageUrl(): string {
    return this.product?.pictureUrl || 'assets/images/logo.svg';
  }

  get imageCountLabel(): string {
    const count = this.product?.pictureUrls?.length ?? (this.product?.pictureUrl ? 1 : 0);
    return count > 0 ? String(count) : '+';
  }

  get canPublish(): boolean {
    return !!this.draft?.canPublish && !!this.caption.trim() && !this.publishing && !this.loading;
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

  publish(): void {
    if (!this.canPublish || !this.draft) {
      return;
    }

    this.publishing = true;
    this.productsService
      .publishFacebookPost({
        productId: this.draft.productId,
        caption: this.caption.trim(),
        imageUrl: this.draft.imageUrl || undefined,
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
}
