import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import * as moment from 'moment';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { CouponFormModalComponent } from './coupon-form-modal/coupon-form-modal.component';
import { CouponListItem } from './models/coupon.models';

@Component({
  selector: 'app-coupons',
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.css'],
})
export class CouponsComponent implements OnInit {
  ColumnMode = ColumnMode;
  data: CouponListItem[] = [];
  filteredData: CouponListItem[] = [];
  searchControl = new FormControl();
  gridHeight = '100%';
  loadingIndicator = false;
  filter: Record<string, unknown> = {};
  page = new Page();

  constructor(
    private restService: RestService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
    public globalDataService: GlobalDataService,
  ) {
    this.page.pageNumber = 0;
  }

  ngOnInit(): void {
    this.calculatePageSize();
    this.getData();
    this.searchControl.valueChanges.pipe(debounceTime(200)).subscribe((value) => {
      this.page.pageNumber = 0;
      this.filter['keyword'] = value;
      this.getData();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    const previousSize = this.page.size;
    this.calculatePageSize();
    if (previousSize !== this.page.size) {
      this.page.pageNumber = 0;
      this.getData();
    }
  }

  calculatePageSize(): void {
    const rowHeight = 40;
    const headerFooterHeight = 280;
    const availableHeight = window.innerHeight - headerFooterHeight;
    this.page.size = Math.max(Math.floor(availableHeight / rowHeight), 5);
  }

  getData(): void {
    this.loadingIndicator = true;
    let url = environment.urls.Coupon_GetAll;
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;
    url += this.setFilterURL();

    this.restService.get(url).subscribe({
      next: (response) => {
        if (response?.result?.items) {
          this.page.totalElements = response.result.totalCount;
          this.data = response.result.items.map((x) => this.mapRow(x));
          this.filteredData = [...this.data];
        } else {
          this.data = [];
          this.filteredData = [];
          this.page.totalElements = 0;
        }
        this.loadingIndicator = false;
      },
      error: () => {
        this.loadingIndicator = false;
      },
    });
  }

  setFilterURL(): string {
    let path = '';
    Object.keys(this.filter).forEach((key) => {
      const value = this.filter[key];
      if (value !== null && value !== undefined && value !== '') {
        path = path ? `${path}&` : '?';
        path += `${key}=${encodeURIComponent(String(value))}`;
      }
    });
    return path;
  }

  setPage(pageInfo: { offset: number }): void {
    this.page.pageNumber = pageInfo.offset;
    this.getData();
  }

  openAddModal(): void {
    this.openFormModal(null);
  }

  openEditModal(row: CouponListItem): void {
    this.openFormModal(row.id);
  }

  onStatusToggle(row: CouponListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isActive = input.checked;

    this.restService
      .postWithOutSpinner(environment.urls.Coupon_UpdateStatus, { id: row.id, isActive })
      .subscribe({
        next: () => {
          row.isActive = isActive;
        },
        error: (error) => {
          input.checked = !isActive;
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  deleteCoupon(row: CouponListItem): void {
    if (!confirm(this.translate.instant('Are you sure you want to delete this coupon?'))) {
      return;
    }

    this.restService.delete(`${environment.urls.Coupon_Delete}?id=${row.id}`).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant('Coupon deleted.'),
          this.translate.instant('toaster_Heading_Success'),
          { progressBar: true },
        );
        this.getData();
      },
      error: (error) => {
        this.toastr.error(
          this.translate.instant(error?.error?.error?.message ?? 'Error'),
          this.translate.instant('toaster_Heading_Error'),
          { progressBar: true },
        );
      },
    });
  }

  getTypeLabel(type: string): string {
    if (type === 'percentage') {
      return 'Percentage';
    }
    if (type === 'fixed') {
      return 'Fixed';
    }
    if (type === 'free_shipping') {
      return 'Free Shipping';
    }
    return type;
  }

  formatAmount(row: CouponListItem): string {
    if (row.type === 'free_shipping') {
      return '—';
    }
    if (row.type === 'percentage') {
      return `${row.amount}%`;
    }
    return row.amount != null ? String(row.amount) : '—';
  }

  formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    return moment(value).format('DD MMM YYYY hh:mm A');
  }

  private openFormModal(couponId: string | null): void {
    const modalRef = this.modalService.open(CouponFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'addSectionModal couponFormModal',
      scrollable: true,
    });
    modalRef.componentInstance.couponId = couponId;

    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.getData();
        }
      },
      () => {},
    );
  }

  private mapRow(x: any): CouponListItem {
    return {
      id: x.id ?? x.Id,
      title: x.title ?? x.Title,
      code: x.code ?? x.Code,
      type: x.type ?? x.Type,
      amount: x.amount ?? x.Amount,
      isActive: x.isActive ?? x.IsActive,
      creationTime: x.creationTime ?? x.CreationTime,
    };
  }
}
