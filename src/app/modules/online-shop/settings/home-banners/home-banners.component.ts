import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { OnlineShopHomeBanner } from './home-banner.models';
import { HomeBannersService } from './home-banners.service';

interface PreviewItem {
  objectUrl: string;
  safeUrl: SafeUrl;
}

@Component({
  selector: 'app-home-banners',
  templateUrl: './home-banners.component.html',
  styleUrls: ['./home-banners.component.css'],
})
export class HomeBannersComponent implements OnInit {
  banners: OnlineShopHomeBanner[] = [];
  selectedFiles: File[] = [];
  previewItems: PreviewItem[] = [];
  uploading = false;
  loadingBanners = false;
  dragOver = false;
  removingBannerId: string | null = null;
  readonly skeletonSlots = [1, 2, 3, 4];

  constructor(
    private homeBannersService: HomeBannersService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  get uploadButtonLabel(): string {
    if (this.uploading) {
      return 'Uploading…';
    }
    if (!this.selectedFiles.length) {
      return 'Upload';
    }
    return `Upload (${this.selectedFiles.length})`;
  }

  loadBanners(): void {
    this.loadingBanners = true;
    this.homeBannersService.getBanners().subscribe({
      next: (banners) => {
        this.loadingBanners = false;
        this.banners = banners.filter((b) => !!b.url);
      },
      error: (err) => {
        this.loadingBanners = false;
        const message = err?.error?.error?.message || 'Failed to load banners.';
        this.toastr.error(message);
        this.banners = [];
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input?.files;
    if (!files?.length) {
      return;
    }
    this.addImageFiles(Array.from(files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.uploading) {
      this.dragOver = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    if (this.uploading || !event.dataTransfer?.files?.length) {
      return;
    }
    this.addImageFiles(Array.from(event.dataTransfer.files));
  }

  removeSelected(index: number): void {
    const item = this.previewItems[index];
    if (item?.objectUrl) {
      URL.revokeObjectURL(item.objectUrl);
    }
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.previewItems = this.previewItems.filter((_, i) => i !== index);
  }

  removeBanner(banner: OnlineShopHomeBanner): void {
    if (!banner.canRemove || !banner.id) {
      return;
    }

    this.removingBannerId = banner.id;
    this.homeBannersService.removeBanner(banner.id).subscribe({
      next: (banners) => {
        this.removingBannerId = null;
        this.banners = banners.filter((b) => !!b.url);
        this.toastr.success('Banner removed.');
      },
      error: (err) => {
        this.removingBannerId = null;
        const message = err?.error?.error?.message || 'Failed to remove banner.';
        this.toastr.error(message);
      },
    });
  }

  upload(): void {
    if (this.selectedFiles.length === 0) {
      this.toastr.warning('Select at least one image to upload.');
      return;
    }

    this.uploading = true;
    this.homeBannersService.uploadBanners(this.selectedFiles).subscribe({
      next: () => {
        this.uploading = false;
        this.revokePreviews();
        this.selectedFiles = [];
        this.toastr.success('Banners uploaded successfully.');
        this.loadBanners();
      },
      error: (err) => {
        this.uploading = false;
        const message = err?.error?.error?.message || 'Failed to upload banners.';
        this.toastr.error(message);
      },
    });
  }

  isRemoving(banner: OnlineShopHomeBanner): boolean {
    return !!banner.id && this.removingBannerId === banner.id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  private addImageFiles(files: File[]): void {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      this.toastr.warning('Please select image files only.');
      return;
    }

    const merged = [...this.selectedFiles];
    for (const file of imageFiles) {
      const isDuplicate = merged.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );
      if (!isDuplicate) {
        merged.push(file);
      }
    }

    const newFiles = merged.slice(this.selectedFiles.length);
    this.selectedFiles = merged;
    this.previewItems = [
      ...this.previewItems,
      ...newFiles.map((file) => {
        const objectUrl = URL.createObjectURL(file);
        return {
          objectUrl,
          safeUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl),
        };
      }),
    ];
  }

  private revokePreviews(): void {
    this.previewItems.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    this.previewItems = [];
  }
}
