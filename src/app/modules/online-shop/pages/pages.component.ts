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
import { PageFormModalComponent } from './page-form-modal/page-form-modal.component';
import { PageViewModalComponent } from './page-view-modal/page-view-modal.component';
import { PageListItem } from './models/page.models';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.css'],
})
export class PagesComponent implements OnInit {
  ColumnMode = ColumnMode;
  filteredData: PageListItem[] = [];
  searchControl = new FormControl();
  gridHeight = '100%';
  loadingIndicator = false;
  filter: Record<string, unknown> = {};
  page = new Page();
  private readonly storefrontUrl = environment.onlineShopStorefrontUrl || '';

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
    let url = environment.urls.Page_GetAll;
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;
    url += this.setFilterURL();

    this.restService.get(url).subscribe({
      next: (response) => {
        if (response?.result?.items) {
          this.page.totalElements = response.result.totalCount;
          this.filteredData = response.result.items.map((x: Record<string, unknown>) => this.mapRow(x));
        } else {
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

  openEditModal(row: PageListItem): void {
    this.openFormModal(row.id);
  }

  viewOnWebsite(row: PageListItem): void {
    const base = this.storefrontUrl?.replace(/\/$/, '');
    if (base) {
      window.open(`${base}/page/${row.slug}`, '_blank');
      return;
    }
    this.previewPage(row);
  }

  previewPage(row: PageListItem): void {
    const modalRef = this.modalService.open(PageViewModalComponent, {
      size: 'lg',
      backdrop: true,
      windowClass: 'addSectionModal pageViewModal',
      scrollable: true,
    });
    modalRef.componentInstance.pageId = row.id;
  }

  onStatusToggle(row: PageListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isActive = input.checked;

    this.restService
      .postWithOutSpinner(environment.urls.Page_UpdateStatus, { id: row.id, isActive })
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

  deletePage(row: PageListItem): void {
    if (!confirm(this.translate.instant('Are you sure you want to delete this page?'))) {
      return;
    }

    this.restService.delete(`${environment.urls.Page_Delete}?id=${row.id}`).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant('Page deleted.'),
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

  formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    return moment(value).format('DD MMM YYYY hh:mm A');
  }

  private openFormModal(pageId: string | null): void {
    const modalRef = this.modalService.open(PageFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'addSectionModal pageFormModal',
      scrollable: true,
    });
    modalRef.componentInstance.pageId = pageId;

    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.getData();
        }
      },
      () => {},
    );
  }

  private mapRow(x: Record<string, unknown>): PageListItem {
    return {
      id: String(x.id ?? x.Id),
      title: String(x.title ?? x.Title ?? ''),
      slug: String(x.slug ?? x.Slug ?? ''),
      isActive: Boolean(x.isActive ?? x.IsActive),
      creationTime: String(x.creationTime ?? x.CreationTime ?? ''),
    };
  }
}
