import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';
import * as moment from 'moment';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import {
  PRICE_CHALLENGE_DECISION_LABELS,
  PriceChallengeReviewListItem,
} from './models/price-challenge-review.models';
import { PriceChallengeReviewModalComponent } from './price-challenge-review-modal/price-challenge-review-modal.component';
import { PriceChallengeReviewsService } from './services/price-challenge-reviews.service';

@Component({
  selector: 'app-price-challenge-reviews',
  templateUrl: './price-challenge-reviews.component.html',
  styleUrls: ['./price-challenge-reviews.component.css'],
})
export class PriceChallengeReviewsComponent implements OnInit {
  ColumnMode = ColumnMode;
  data: PriceChallengeReviewListItem[] = [];
  filteredData: PriceChallengeReviewListItem[] = [];
  searchControl = new FormControl();
  gridHeight = '100%';
  loadingIndicator = false;
  filter: Record<string, unknown> = {};
  page = new Page();

  constructor(
    private reviewsService: PriceChallengeReviewsService,
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

  refreshTable(): void {
    this.page.pageNumber = 0;
    this.getData();
  }

  getData(): void {
    this.loadingIndicator = true;
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;

    this.reviewsService.getReviews(this.filter).subscribe({
      next: (response) => {
        this.page.totalElements = response.totalCount;
        this.data = response.items;
        this.filteredData = [...this.data];
        this.loadingIndicator = false;
      },
      error: (err) => {
        this.loadingIndicator = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Failed to load price challenge reviews.');
        this.toastr.error(message);
      },
    });
  }

  setPage(event: { offset: number }): void {
    this.page.pageNumber = event.offset;
    this.getData();
  }

  openReview(row: PriceChallengeReviewListItem): void {
    const modalRef = this.modalService.open(PriceChallengeReviewModalComponent, {
      backdrop: 'static',
      scrollable: false,
      windowClass: 'addSectionModal pageFormModal pc-review-modal-window',
    });
    modalRef.componentInstance.challengeId = row.id;
    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.getData();
        }
      },
      () => undefined,
    );
  }

  decisionLabel(decision: string): string {
    return PRICE_CHALLENGE_DECISION_LABELS[decision] || decision;
  }

  formatMoney(row: PriceChallengeReviewListItem, value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
      return '—';
    }
    const symbol = row.currency?.trim() || 'Rs.';
    return `${symbol} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }
    const m = moment(value);
    return m.isValid() ? m.format('DD MMM YYYY, HH:mm') : value;
  }
}
