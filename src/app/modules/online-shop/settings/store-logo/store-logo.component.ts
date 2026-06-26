import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { OnlineShopStoreLogo } from './store-logo.models';
import { StoreLogoService } from './store-logo.service';

@Component({
  selector: 'app-store-logo',
  templateUrl: './store-logo.component.html',
  styleUrls: ['./store-logo.component.css'],
})
export class StoreLogoComponent implements OnInit {
  logo: OnlineShopStoreLogo | null = null;
  loading = false;
  uploading = false;
  removing = false;
  dragOver = false;

  constructor(
    private storeLogoService: StoreLogoService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadLogo();
  }

  get hasLogo(): boolean {
    return !!this.logo?.url;
  }

  loadLogo(): void {
    this.loading = true;
    this.storeLogoService.getLogo().subscribe({
      next: (logo) => {
        this.loading = false;
        this.logo = logo;
      },
      error: (err) => {
        this.loading = false;
        const message = err?.error?.error?.message || 'Failed to load store logo.';
        this.toastr.error(message);
        this.logo = null;
      },
    });
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    input.value = '';
    if (!file || this.uploading || this.removing) {
      return;
    }
    this.uploadFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.uploading && !this.removing) {
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
    if (this.uploading || this.removing) {
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  removeLogo(): void {
    if (!this.hasLogo || this.uploading || this.removing) {
      return;
    }

    this.removing = true;
    this.storeLogoService.removeLogo().subscribe({
      next: () => {
        this.removing = false;
        this.logo = null;
        this.toastr.success('Store logo removed.');
      },
      error: (err) => {
        this.removing = false;
        const message = err?.error?.error?.message || 'Failed to remove store logo.';
        this.toastr.error(message);
      },
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logo.svg';
  }

  private uploadFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Please select an image file only.');
      return;
    }

    this.uploading = true;
    this.storeLogoService.uploadLogo(file).subscribe({
      next: () => {
        this.uploading = false;
        this.toastr.success('Store logo uploaded successfully.');
        this.loadLogo();
      },
      error: (err) => {
        this.uploading = false;
        const message = err?.error?.error?.message || 'Failed to upload store logo.';
        this.toastr.error(message);
      },
    });
  }
}
