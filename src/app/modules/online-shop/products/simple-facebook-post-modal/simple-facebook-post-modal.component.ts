import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  MetaPagePostHistoryItem,
  SimpleMetaPagePostDraft,
} from '../models/facebook-post.models';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-simple-facebook-post-modal',
  templateUrl: './simple-facebook-post-modal.component.html',
  styleUrls: ['./simple-facebook-post-modal.component.css'],
})
export class SimpleFacebookPostModalComponent implements OnInit {
  loading = true;
  publishing = false;
  loadError: string | null = null;
  draft: SimpleMetaPagePostDraft | null = null;
  caption = '';
  linkUrl = '';
  imageUrlsText = '';
  showHistory = false;

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadDraft();
  }

  get history(): MetaPagePostHistoryItem[] {
    return this.draft?.recentPosts ?? [];
  }

  get canPublish(): boolean {
    if (!this.draft?.canPublish || this.publishing || this.loading) {
      return false;
    }
    const hasCaption = !!this.caption.trim();
    const hasLink = !!this.linkUrl.trim();
    const hasImages = this.parseImageUrls().length > 0;
    return hasCaption || hasLink || hasImages;
  }

  loadDraft(): void {
    this.loading = true;
    this.loadError = null;
    this.productsService.getSimpleFacebookPostDraft().subscribe({
      next: (draft) => {
        this.draft = draft;
        this.caption = draft.caption || '';
        this.linkUrl = draft.linkUrl || '';
        this.loading = false;
        if (!draft.canPublish && draft.disabledReason) {
          this.loadError = draft.disabledReason;
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadError =
          err?.error?.error?.message || 'Failed to load Facebook post draft.';
      },
    });
  }

  publish(): void {
    if (!this.canPublish || !this.draft || this.publishing) {
      return;
    }

    this.publishing = true;
    this.productsService
      .publishSimpleFacebookPost({
        caption: this.caption.trim(),
        linkUrl: this.linkUrl.trim() || undefined,
        imageUrls: this.parseImageUrls(),
      })
      .subscribe({
        next: (result) => {
          this.publishing = false;
          this.activeModal.close(result);
        },
        error: (err) => {
          this.publishing = false;
          const message =
            err?.error?.error?.message || 'Facebook publishing failed.';
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

  private parseImageUrls(): string[] {
    const raw = (this.imageUrlsText || '').trim();
    if (!raw) {
      return [];
    }
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const part of raw.split(/[\r\n,;]+/)) {
      const url = part.trim();
      if (!url) {
        continue;
      }
      const key = url.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      urls.push(url);
    }
    return urls;
  }
}
