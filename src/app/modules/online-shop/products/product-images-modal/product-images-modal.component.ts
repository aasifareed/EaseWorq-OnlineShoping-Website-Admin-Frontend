import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AdminProductListItem, OnlineShopProductImage } from '../models/product.models';
import { ProductsService } from '../services/products.service';

interface PreviewItem {
  objectUrl: string;
  safeUrl: SafeUrl;
}

@Component({
  selector: 'app-product-images-modal',
  templateUrl: './product-images-modal.component.html',
  styleUrls: ['./product-images-modal.component.css'],
})
export class ProductImagesModalComponent implements OnInit {
  @Input() product!: AdminProductListItem;

  existingImages: OnlineShopProductImage[] = [];
  selectedFiles: File[] = [];
  previewItems: PreviewItem[] = [];
  uploading = false;
  loadingImages = false;
  dragOver = false;
  removingImageKey: string | null = null;
  readonly skeletonSlots = [1, 2, 3, 4];
  private galleryChangedFlag = false;

  get galleryChanged(): boolean {
    return this.galleryChangedFlag;
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

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages(): void {
    if (!this.product?.productId) {
      return;
    }

    this.loadingImages = true;
    this.productsService.getImages(this.product.productId).subscribe({
      next: (images) => {
        this.loadingImages = false;
        this.existingImages = images.filter((img) => !!img.url);
      },
      error: (err) => {
        this.loadingImages = false;
        const message = err?.error?.error?.message || 'Failed to load images.';
        this.toastr.error(message);
        this.existingImages = this.fallbackImagesFromProduct();
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

  removeExisting(image: OnlineShopProductImage): void {
    if (!image.canRemove || !this.product?.productId) {
      return;
    }

    if (!image.attachmentId && !image.posAttachmentId) {
      return;
    }

    this.removingImageKey = image.posAttachmentId || image.attachmentId || null;
    this.productsService
      .removeImage(this.product.productId, {
        attachmentId: image.attachmentId,
        posAttachmentId: image.posAttachmentId,
      })
      .subscribe({
        next: (images) => {
          this.removingImageKey = null;
          this.existingImages = images.filter((img) => !!img.url);
          this.galleryChangedFlag = true;
          this.toastr.success(
            image.source === 'Pos' ? 'POS product image removed.' : 'Image removed.',
          );
        },
        error: (err) => {
          this.removingImageKey = null;
          const message = err?.error?.error?.message || 'Failed to remove image.';
          this.toastr.error(message);
        },
      });
  }

  upload(): void {
    if (!this.product?.productId || this.selectedFiles.length === 0) {
      this.toastr.warning('Select at least one image to upload.');
      return;
    }

    this.uploading = true;
    this.productsService.uploadImages(this.product.productId, this.selectedFiles).subscribe({
      next: () => {
        this.uploading = false;
        this.revokePreviews();
        this.selectedFiles = [];
        this.galleryChangedFlag = true;
        this.toastr.success('Images uploaded successfully.');
        this.productsService.getImages(this.product.productId).subscribe({
          next: (images) => {
            this.existingImages = images.filter((img) => !!img.url);
          },
        });
      },
      error: (err) => {
        this.uploading = false;
        const message = err?.error?.error?.message || 'Failed to upload images.';
        this.toastr.error(message);
      },
    });
  }

  close(): void {
    this.revokePreviews();
    if (this.galleryChangedFlag) {
      this.activeModal.close({
        uploaded: true,
        pictureUrls: this.existingImages.map((img) => img.url),
      });
      return;
    }
    this.activeModal.dismiss();
  }

  private addImageFiles(files: File[]): void {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      this.toastr.warning('Please select image files only.');
      return;
    }

    if (imageFiles.length < files.length) {
      this.toastr.warning('Some files were skipped (images only).');
    }

    const merged = [...this.selectedFiles];
    let addedCount = 0;

    for (const file of imageFiles) {
      const isDuplicate = merged.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );
      if (!isDuplicate) {
        merged.push(file);
        addedCount++;
      }
    }

    if (addedCount === 0) {
      this.toastr.info('Selected file(s) are already in the upload queue.');
      return;
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  isRemoving(image: OnlineShopProductImage): boolean {
    const key = image.posAttachmentId || image.attachmentId;
    return !!key && this.removingImageKey === key;
  }

  imageSourceLabel(image: OnlineShopProductImage): string {
    return image.source === 'Pos' ? 'POS' : '';
  }

  private fallbackImagesFromProduct(): OnlineShopProductImage[] {
    const urls = [...(this.product?.pictureUrls ?? [])];
    if (urls.length === 0 && this.product?.pictureUrl) {
      urls.push(this.product.pictureUrl);
    }
    return urls.map((url, index) => ({
      url,
      isPrimary: index === 0,
      canRemove: false,
    }));
  }

  private revokePreviews(): void {
    this.previewItems.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    this.previewItems = [];
  }
}
