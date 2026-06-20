import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CourierProviderListItem } from '../models/provider.models';
import { CourierProviderService } from '../services/courier-provider.service';
import { CourierProviderModalComponent } from './courier-provider-modal.component';

@Component({
  selector: 'app-courier-providers',
  templateUrl: './courier-providers.component.html',
  styleUrls: ['./courier-providers.component.css'],
})
export class CourierProvidersComponent implements OnInit {
  providers: CourierProviderListItem[] = [];
  loading = false;

  constructor(
    private courierService: CourierProviderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.courierService.getAll().subscribe({
      next: (rows) => {
        this.providers = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load courier providers'));
      },
    });
  }

  openCreate(): void {
    this.openModal();
  }

  openEdit(item: CourierProviderListItem): void {
    this.openModal(item.id);
  }

  toggleActive(item: CourierProviderListItem): void {
    const next = !item.isActive;
    this.courierService.enableDisable(item.id, next).subscribe({
      next: () => {
        item.isActive = next;
        this.toastr.success(
          next
            ? this.translate.instant('Courier provider enabled')
            : this.translate.instant('Courier provider disabled'),
        );
      },
      error: (err) => {
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to update courier provider');
        this.toastr.error(message);
      },
    });
  }

  delete(item: CourierProviderListItem): void {
    if (!confirm(this.translate.instant('Delete this courier provider configuration?'))) {
      return;
    }

    this.courierService.delete(item.id).subscribe({
      next: () => {
        this.toastr.success(this.translate.instant('Courier provider deleted'));
        this.load();
      },
      error: (err) => {
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to delete courier provider');
        this.toastr.error(message);
      },
    });
  }

  private openModal(providerId?: string): void {
    const modalRef = this.modalService.open(CourierProviderModalComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    modalRef.componentInstance.providerId = providerId;
    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.load();
        }
      },
      () => undefined,
    );
  }
}
