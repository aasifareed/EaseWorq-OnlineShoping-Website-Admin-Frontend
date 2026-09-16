import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import {
  MetaPagePostHistoryItem,
  SimpleMetaPageReelDraft,
} from '../models/facebook-post.models';
import { ProductsService } from '../services/products.service';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'];

@Component({
  selector: 'app-simple-facebook-reel-modal',
  templateUrl: './simple-facebook-reel-modal.component.html',
  styleUrls: [
    '../simple-facebook-post-modal/simple-facebook-post-modal.component.css',
    '../product-reel-modal/product-reel-modal.component.css',
    './simple-facebook-reel-modal.component.css',
  ],
})
export class SimpleFacebookReelModalComponent implements OnInit, OnDestroy {
  @ViewChild('videoInput') videoInputRef?: ElementRef<HTMLInputElement>;

  loading = true;
  publishing = false;
  loadError: string | null = null;
  uploadError: string | null = null;
  draft: SimpleMetaPageReelDraft | null = null;
  caption = '';
  linkUrl = '';
  showHistory = false;
  videoFile: File | null = null;
  videoFileName = '';
  previewVideoUrl: string | null = null;
  previewVideoSafeUrl: SafeResourceUrl | null = null;

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

  get isBusy(): boolean {
    return this.loading || this.publishing;
  }

  get canPublish(): boolean {
    return (
      !!this.draft?.canPublish &&
      !!this.draft?.reelBuilderReady &&
      !!this.videoFile &&
      !this.isBusy &&
      !this.uploadError
    );
  }

  loadDraft(): void {
    this.loading = true;
    this.loadError = null;
    this.productsService.getSimpleFacebookReelDraft().subscribe({
      next: (draft) => {
        this.draft = draft;
        this.caption = draft.caption || '';
        this.linkUrl = draft.linkUrl || '';
        this.loading = false;
        if (!draft.canPublish && draft.disabledReason) {
          this.loadError = draft.disabledReason;
        } else if (!draft.reelBuilderReady && draft.reelDisabledReason) {
          this.loadError = draft.reelDisabledReason;
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

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] ?? null;
    this.uploadError = null;

    if (!file) {
      this.clearVideoSelection();
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      this.uploadError = this.translate.instant('Video is too large. Maximum size is 100 MB.');
      this.clearVideoSelection();
      input.value = '';
      return;
    }

    const name = (file.name || '').toLowerCase();
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    const typeOk = (file.type || '').startsWith('video/');
    const extOk = ALLOWED_EXTENSIONS.includes(extension);
    if (!typeOk && !extOk) {
      this.uploadError = this.translate.instant('Upload an MP4, MOV, or WebM video file.');
      this.clearVideoSelection();
      input.value = '';
      return;
    }

    this.clearPreviewVideo();
    this.videoFile = file;
    this.videoFileName = file.name;
    this.previewVideoUrl = URL.createObjectURL(file);
    this.previewVideoSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewVideoUrl);
  }

  clearVideoSelection(): void {
    this.videoFile = null;
    this.videoFileName = '';
    this.clearPreviewVideo();
    if (this.videoInputRef?.nativeElement) {
      this.videoInputRef.nativeElement.value = '';
    }
  }

  publish(): void {
    if (!this.canPublish || !this.draft || !this.videoFile || this.publishing) {
      return;
    }
    this.publishing = true;
    this.productsService
      .publishSimpleFacebookReel({
        caption: this.caption.trim(),
        linkUrl: this.linkUrl.trim() || undefined,
        videoFile: this.videoFile,
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
            this.translate.instant('Facebook Reel publishing failed.');
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

  private clearPreviewVideo(): void {
    if (this.previewVideoUrl) {
      URL.revokeObjectURL(this.previewVideoUrl);
    }
    this.previewVideoUrl = null;
    this.previewVideoSafeUrl = null;
  }
}
