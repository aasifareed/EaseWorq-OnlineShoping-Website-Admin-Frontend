import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  AdminProductCategoryListItem,
  OnlineShopCategoryImage,
} from '../models/product-category.models';
import { ProductCategoriesService } from '../services/product-categories.service';

@Component({
  selector: 'app-category-image-modal',
  templateUrl: './category-image-modal.component.html',
  styleUrls: [
    '../product-images-modal/product-images-modal.component.css',
    './category-image-modal.component.css',
  ],
})
export class CategoryImageModalComponent implements OnInit {
  @Input() category!: AdminProductCategoryListItem;

  existingImage: OnlineShopCategoryImage | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  previewSafeUrl: SafeUrl | null = null;
  uploading = false;
  loadingImage = false;
  dragOver = false;
  removing = false;
  private changedFlag = false;

  get changed(): boolean {
    return this.changedFlag;
  }

  get uploadButtonLabel(): string {
    if (this.uploading) {
      return 'Uploading…';
    }
    return this.existingImage ? 'Replace image' : 'Upload';
  }

  constructor(
    public activeModal: NgbActiveModal,
    private categoriesService: ProductCategoriesService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadImage();
  }

  loadImage(): void {
    if (!this.category?.id) {
      return;
    }

    this.loadingImage = true;
    this.categoriesService.getImage(this.category.id).subscribe({
      next: (image) => {
        this.loadingImage = false;
        this.existingImage = image;
      },
      error: (err) => {
        this.loadingImage = false;
        const message = err?.error?.error?.message || 'Failed to load image.';
        this.toastr.error(message);
        this.existingImage = this.category.pictureUrl
          ? { url: this.category.pictureUrl, canRemove: true }
          : null;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.setFile(file);
    }
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
    if (this.uploading) {
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.setFile(file);
    }
  }

  clearSelected(): void {
    this.revokePreview();
    this.selectedFile = null;
  }

  removeExisting(): void {
    if (!this.existingImage?.canRemove || !this.category?.id) {
      return;
    }

    this.removing = true;
    this.categoriesService.removeImage(this.category.id).subscribe({
      next: () => {
        this.removing = false;
        this.existingImage = null;
        this.changedFlag = true;
        this.toastr.success('Category image removed.');
      },
      error: (err) => {
        this.removing = false;
        const message = err?.error?.error?.message || 'Failed to remove image.';
        this.toastr.error(message);
      },
    });
  }

  upload(): void {
    if (!this.category?.id || !this.selectedFile) {
      this.toastr.warning('Select an image to upload.');
      return;
    }

    this.uploading = true;
    this.categoriesService.uploadImage(this.category.id, this.selectedFile).subscribe({
      next: (image) => {
        this.uploading = false;
        this.clearSelected();
        this.existingImage = image;
        this.changedFlag = true;
        this.toastr.success('Category image uploaded successfully.');
      },
      error: (err) => {
        this.uploading = false;
        const message = err?.error?.error?.message || 'Failed to upload image.';
        this.toastr.error(message);
      },
    });
  }

  close(): void {
    this.clearSelected();
    if (this.changedFlag) {
      this.activeModal.close({
        changed: true,
        pictureUrl: this.existingImage?.url ?? '',
      });
      return;
    }
    this.activeModal.dismiss();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  private setFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Please select an image file.');
      return;
    }
    this.revokePreview();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.previewSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.previewUrl);
  }

  private revokePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.previewSafeUrl = null;
  }
}
