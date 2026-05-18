import { Component, HostListener, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { PageFormModalComponent } from '../pages/page-form-modal/page-form-modal.component';
import { PageViewModalComponent } from '../pages/page-view-modal/page-view-modal.component';
import { PageListItem } from '../pages/models/page.models';

@Component({
  selector: 'app-storefront',
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.css'],
})
export class StorefrontComponent implements OnInit {
  ColumnMode = ColumnMode;
  filteredData: PageListItem[] = [];
  gridHeight = '100%';
  loadingIndicator = false;
  filter: Record<string, unknown> = { sorting: 'Title asc' };
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
    const headerFooterHeight = 320;
    const availableHeight = window.innerHeight - headerFooterHeight;
    this.page.size = Math.max(Math.floor(availableHeight / rowHeight), 5);
  }

  get publishedCount(): number {
    return this.filteredData.filter((p) => p.isActive).length;
  }

  getData(): void {
    this.loadingIndicator = true;
    let url = environment.urls.Page_GetAll;
    this.filter['maxResultCount'] = 200;
    this.filter['skipCount'] = 0;
    url += this.setFilterURL();

    this.restService.get(url).subscribe({
      next: (response) => {
        if (response?.result?.items) {
          this.filteredData = response.result.items.map((x: Record<string, unknown>) => this.mapRow(x));
          this.page.totalElements = this.filteredData.length;
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

  editContent(row: PageListItem): void {
    const modalRef = this.modalService.open(PageFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'addSectionModal pageFormModal',
      scrollable: true,
    });
    modalRef.componentInstance.pageId = row.id;
    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.getData();
        }
      },
      () => {},
    );
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
