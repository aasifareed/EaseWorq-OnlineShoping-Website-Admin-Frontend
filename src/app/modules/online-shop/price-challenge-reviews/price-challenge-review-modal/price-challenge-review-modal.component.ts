import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import {
  PRICE_CHALLENGE_DECISION_LABELS,
  PriceChallengeApprovalResult,
  PriceChallengeReviewDetail,
} from '../models/price-challenge-review.models';
import { PriceChallengeReviewsService } from '../services/price-challenge-reviews.service';
import { ChatHubService } from 'src/app/shared/services/chat-hub.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-price-challenge-review-modal',
  templateUrl: './price-challenge-review-modal.component.html',
  styleUrls: ['./price-challenge-review-modal.component.css'],
})
export class PriceChallengeReviewModalComponent implements OnInit, OnDestroy {
  @Input() challengeId!: string;

  loading = true;
  saving = false;
  detail: PriceChallengeReviewDetail | null = null;
  approvedOfferPrice: number | null = null;
  adminNote = '';
  declineReason = '';
  showDeclineForm = false;
  sendingCounterOffer = false;
  approvalResult: PriceChallengeApprovalResult | null = null;
  approvalCustomerDraft = '';
  resendingOffer = false;
  private chatRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly hubSub = new Subscription();

  constructor(
    public activeModal: NgbActiveModal,
    private reviewsService: PriceChallengeReviewsService,
    private chatHub: ChatHubService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.chatHub.startConnection();
    this.hubSub.add(
      this.chatHub.privateMessage$.subscribe((payload) => {
        if (this.approvalResult || this.loading || this.saving) {
          return;
        }
        const customerId = this.detail?.guestChatUserId?.toLowerCase();
        if (!customerId || payload.userId?.toLowerCase() !== customerId || payload.fromAdmin) {
          return;
        }
        this.loadDetail(true);
      }),
    );
    this.loadDetail();
    this.startChatRefresh();
  }

  ngOnDestroy(): void {
    this.stopChatRefresh();
    this.hubSub.unsubscribe();
  }

  get decisionLabel(): string {
    if (!this.detail?.decision) {
      return '';
    }
    return PRICE_CHALLENGE_DECISION_LABELS[this.detail.decision] || this.detail.decision;
  }

  get currencySymbol(): string {
    return this.approvalResult?.currency?.trim() || this.detail?.currency?.trim() || 'Rs.';
  }

  get competitorGap(): number | null {
    if (!this.detail) {
      return null;
    }
    const our = this.detail.ourRegularPriceAtChallenge;
    const competitor = this.detail.competitorComparablePriceAtDecision;
    if (!Number.isFinite(our) || !Number.isFinite(competitor)) {
      return null;
    }
    return our - competitor;
  }

  get suggestedSavings(): number | null {
    if (!this.detail?.suggestedOfferPrice) {
      return null;
    }
    const our = this.detail.ourRegularPriceAtChallenge;
    const suggested = this.detail.suggestedOfferPrice;
    if (!Number.isFinite(our) || !Number.isFinite(suggested)) {
      return null;
    }
    return our - suggested;
  }

  loadDetail(refreshOnly = false): void {
    if (!refreshOnly) {
      this.loading = true;
    }
    this.reviewsService.getReviewDetail(this.challengeId).subscribe({
      next: (detail) => {
        this.detail = detail;
        if (!refreshOnly) {
          this.approvedOfferPrice = detail.suggestedOfferPrice ?? null;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Failed to load price challenge review.');
        this.toastr.error(message);
        this.activeModal.dismiss();
      },
    });
  }

  useSuggestedPrice(): void {
    if (this.detail?.suggestedOfferPrice != null) {
      this.approvedOfferPrice = this.detail.suggestedOfferPrice;
    }
  }

  useCustomerPrice(): void {
    if (this.detail?.competitorComparablePriceAtDecision != null) {
      this.approvedOfferPrice = this.detail.competitorComparablePriceAtDecision;
    }
  }

  private validateCounterOfferPrice(): number | null {
    if (!this.detail) {
      return null;
    }
    const price = Number(this.approvedOfferPrice);
    if (!Number.isFinite(price) || price <= 0) {
      this.toastr.warning(this.translate.instant('Enter a valid counter offer price.'));
      return null;
    }
    if (price >= this.detail.ourRegularPriceAtChallenge) {
      this.toastr.warning(this.translate.instant('Counter offer must be lower than our regular price.'));
      return null;
    }
    return price;
  }

  approve(): void {
    if (!this.detail || this.saving) {
      return;
    }
    const price = this.validateCounterOfferPrice();
    if (price == null) {
      return;
    }

    this.saving = true;
    const customerDraft = this.adminNote.trim();
    this.reviewsService.approve(this.detail.id, price, customerDraft || undefined).subscribe({
      next: (result) => {
        this.saving = false;
        this.approvalResult = result;
        this.approvalCustomerDraft = customerDraft;
        this.toastr.success(this.translate.instant('Offer approved. Customer can tap Buy Now in challenge chat.'));
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Failed to approve price challenge.');
        this.toastr.error(message);
      },
    });
  }

  sendCounterOffer(): void {
    if (!this.detail || this.saving || this.sendingCounterOffer) {
      return;
    }
    const note = this.adminNote.trim();
    if (!note) {
      this.toastr.warning(this.translate.instant('Enter your message to the customer.'));
      return;
    }
    const price = this.validateCounterOfferPrice();
    if (price == null) {
      return;
    }

    this.sendingCounterOffer = true;
    this.reviewsService
      .sendCounterOffer(this.detail.id, price, note)
      .subscribe({
        next: () => {
          this.sendingCounterOffer = false;
          this.toastr.success(this.translate.instant('Counter offer sent in challenge chat.'));
          this.loadDetail(true);
        },
        error: (err) => {
          this.sendingCounterOffer = false;
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Failed to send counter offer.');
          this.toastr.error(message);
        },
      });
  }

  negotiateInChat(): void {
    this.openLiveChat(this.buildNegotiationDraft());
  }

  private buildNegotiationDraft(): string {
    return this.adminNote.trim();
  }

  decline(): void {
    if (!this.detail || this.saving) {
      return;
    }
    const message = this.declineReason.trim();
    if (!message) {
      this.toastr.warning(this.translate.instant('Enter your decline message to the customer.'));
      return;
    }

    this.saving = true;
    this.reviewsService.decline(this.detail.id, message).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('Challenge declined. Customer will return to support chat shortly.'));
        this.activeModal.close(true);
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Failed to decline price challenge.');
        this.toastr.error(message);
      },
    });
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
      return '—';
    }
    return `${this.currencySymbol} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
      return '—';
    }
    const pct = value <= 1 ? value * 100 : value;
    return `${pct.toFixed(0)}%`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    return d.toLocaleString();
  }

  isImageEvidence(type: string): boolean {
    return (type || '').toLowerCase() === 'image';
  }

  isUrlEvidence(type: string): boolean {
    return (type || '').toLowerCase() === 'url';
  }

  evidenceTypeLabel(item: { evidenceType?: string; manualCompetitorPrice?: number | null }): string {
    const type = (item.evidenceType || '').toLowerCase();
    if (type === 'image') {
      return 'Screenshot';
    }
    if (type === 'url') {
      return 'Competitor link';
    }
    if (type === 'manualprice' || item.manualCompetitorPrice != null) {
      return 'Manual price';
    }
    return item.evidenceType || 'Evidence';
  }

  truncateUrl(url: string | null | undefined, maxLength = 72): string {
    const value = (url || '').trim();
    if (!value) {
      return '';
    }
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength)}…`;
  }

  isLikelyUrl(message: string | null | undefined): boolean {
    const value = (message || '').trim();
    return /^https?:\/\//i.test(value);
  }

  openLiveChat(draft?: string): void {
    const userId = this.detail?.guestChatUserId?.trim();
    const params = new URLSearchParams();
    if (userId) {
      params.set('userId', userId);
    }
    const draftText = (draft || '').trim();
    if (draftText) {
      params.set('draft', draftText);
    }
    const query = params.toString();
    const url = query ? `/#/online-shop/live-chat?${query}` : '/#/online-shop/live-chat';
    window.open(url, '_blank');
  }

  closeAfterApproval(): void {
    this.activeModal.close(true);
  }

  copyCouponCode(): void {
    const code = this.approvalResult?.couponCode?.trim();
    if (!code) {
      return;
    }
    void this.copyText(code, this.translate.instant('Internal reference copied.'));
  }

  copyCustomerMessage(): void {
    const message = this.approvalCustomerDraft.trim();
    if (!message) {
      return;
    }
    void this.copyText(message, this.translate.instant('Customer message copied.'));
  }

  messageCustomerAfterApproval(): void {
    this.openLiveChat(this.approvalCustomerDraft);
  }

  resendBuyNowToChallengeChat(): void {
    const challengeId = this.approvalResult?.challengeId;
    if (!challengeId || this.resendingOffer) {
      return;
    }

    this.resendingOffer = true;
    this.reviewsService.resendApprovedOfferToChat(challengeId).subscribe({
      next: () => {
        this.resendingOffer = false;
        this.toastr.success(this.translate.instant('Buy Now offer sent to challenge chat.'));
      },
      error: (err) => {
        this.resendingOffer = false;
        const message =
          err?.error?.error?.message ||
          this.translate.instant('Failed to resend offer to challenge chat.');
        this.toastr.error(message);
      },
    });
  }

  private async copyText(text: string, successMessage: string): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.toastr.success(successMessage);
    } catch {
      this.toastr.error(this.translate.instant('Could not copy to clipboard.'));
    }
  }

  private startChatRefresh(): void {
    this.stopChatRefresh();
    this.chatRefreshTimer = setInterval(() => {
      if (!this.approvalResult && !this.loading && !this.saving && this.detail) {
        this.loadDetail(true);
      }
    }, 8000);
  }

  private stopChatRefresh(): void {
    if (this.chatRefreshTimer) {
      clearInterval(this.chatRefreshTimer);
      this.chatRefreshTimer = null;
    }
  }
}
