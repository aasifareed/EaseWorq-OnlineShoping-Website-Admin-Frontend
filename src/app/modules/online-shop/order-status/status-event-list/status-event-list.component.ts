import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { CreateEditStatusEventComponent } from '../create-edit-status-event/create-edit-status-event.component';
import { StatusEventDto } from '../models/statusEventDto';

@Component({
  selector: 'app-status-event-list',
  templateUrl: './status-event-list.component.html',
  styleUrls: ['./status-event-list.component.css'],
})
export class StatusEventListComponent implements OnInit {
  ColumnMode = ColumnMode;
  data: StatusEventDto[] = [];
  filteredData: StatusEventDto[] = [];
  searchControl = new FormControl();
  gridHeight = '100%';
  loadingIndicator = false;
  isLoading = false;
  filter: Record<string, unknown> = {};

  page = new Page();

  constructor(
    private restService: RestService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private translate: TranslateService,
    public globalDataService: GlobalDataService,
  ) {
    this.page.pageNumber = 0;
  }

  ngOnInit(): void {
    this.calculatePageSize();
    this.getData();
    this.searchControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value) => {
        this.page.pageNumber = 0;
        this.filter['keyword'] = value;
        this.getData();
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculatePageSize();
  }

  calculatePageSize(): void {
    const rowHeight = 40;
    const headerFooterHeight = 120;
    const availableHeight = window.innerHeight - headerFooterHeight;
    this.page.size = Math.max(Math.floor(availableHeight / rowHeight), 5);
  }

  getData(): void {
    this.isLoading = true;
    this.loadingIndicator = true;
    let url = environment.urls.StatusEvent_GetAll;
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;
    url += this.setFilterURL();

    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        if (response?.result?.items) {
          this.page.totalElements = response.result.totalCount;
          this.data = [...response.result.items];
          this.filteredData = response.result.items;
        } else {
          this.data = [];
          this.filteredData = [];
          this.page.totalElements = 0;
        }
        this.isLoading = false;
        this.loadingIndicator = false;
      },
      error: () => {
        this.isLoading = false;
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
        path += `${key}=${value}`;
      }
    });
    return path;
  }

  setPage(pageInfo: { offset: number }): void {
    this.loadingIndicator = true;
    this.page.pageNumber = pageInfo.offset;
    this.getData();
  }

  onSort(event: { sorts: { prop: string; dir: string }[] }): void {
    if (!event.sorts?.length) {
      return;
    }
    this.loadingIndicator = true;
    this.page.pageNumber = 0;
    this.filter['sorting'] = `${event.sorts[0].prop} ${event.sorts[0].dir}`;
    this.getData();
  }

  openStatusEventDialog(model?: StatusEventDto): void {
    const modalRef = this.modalService.open(CreateEditStatusEventComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'addSectionModal',
    });
    modalRef.componentInstance.id = model?.id ?? null;
    modalRef.result.then((saved) => {
      if (saved) {
        this.getData();
      }
    });
  }

  formatEventLabel(event: string): string {
    if (!event) {
      return '';
    }
    const labels: Record<string, string> = {
      CreateOnlineOrderCashOnDelivery: 'Create order (Cash on delivery)',
      CreateOnlineOrderGoPayFast: 'Create order (GoPayFast)',
      GoPayFastPaymentSuccess: 'GoPayFast payment success',
      GoPayFastPaymentFailed: 'GoPayFast payment failed',
      ConfirmCashOnDeliveryOrder: 'Confirm cash on delivery order',
      CancelOnlineOrder: 'Cancel online order',
      OrderDelivered: 'Mark order delivered',
    };
    return labels[event] || event.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }

  async delete(id: string): Promise<void> {
    const result = await Swal.fire({
      title: this.translate.instant('Please Confirm'),
      text: this.translate.instant('Do you really want to delete this status event?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Yes'),
      cancelButtonText: this.translate.instant('No'),
    });

    if (!result.value) {
      return;
    }

    this.isLoading = true;
    this.restService
      .delete(`${environment.urls.StatusEvent_Delete}?id=${id}`)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant('Status Event deleted.'),
            this.translate.instant('toaster_Heading_Success'),
            { progressBar: true },
          );
          this.getData();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }
}
