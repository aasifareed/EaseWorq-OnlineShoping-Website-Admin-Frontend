import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  PriceChallengeApprovalResult,
  PriceChallengeEvidenceItem,
  PriceChallengeReviewChatMessage,
  PriceChallengeReviewDetail,
  PriceChallengeReviewListItem,
} from '../models/price-challenge-review.models';

@Injectable()
export class PriceChallengeReviewsService {
  constructor(private restService: RestService) {}

  getReviews(params: Record<string, unknown>): Observable<{ items: PriceChallengeReviewListItem[]; totalCount: number }> {
    const url = environment.urls.PriceChallengeAdmin_GetReviewsForAdmin + this.buildQuery(params);
    return this.restService.get(url).pipe(
      map((response) => ({
        items: (response?.result?.items ?? []).map((row: Record<string, unknown>) => this.mapListItem(row)),
        totalCount: Number(response?.result?.totalCount ?? 0),
      })),
    );
  }

  getReviewDetail(id: string): Observable<PriceChallengeReviewDetail> {
    const url = `${environment.urls.PriceChallengeAdmin_GetReviewDetailForAdmin}?id=${encodeURIComponent(id)}`;
    return this.restService.get(url).pipe(map((response) => this.mapDetail(response?.result ?? {})));
  }

  approve(challengeId: string, approvedOfferPrice: number, adminNote?: string): Observable<PriceChallengeApprovalResult> {
    return this.restService
      .post(environment.urls.PriceChallengeAdmin_ApproveManualReview, {
        ChallengeId: challengeId,
        ApprovedOfferPrice: approvedOfferPrice,
        AdminNote: adminNote || undefined,
      })
      .pipe(map((response) => this.mapApprovalResult(response?.result ?? {})));
  }

  decline(challengeId: string, reason?: string): Observable<void> {
    return this.restService
      .post(environment.urls.PriceChallengeAdmin_DeclineManualReview, {
        ChallengeId: challengeId,
        Reason: reason || undefined,
      })
      .pipe(map(() => undefined));
  }

  sendCounterOffer(challengeId: string, counterOfferPrice: number, adminNote?: string): Observable<void> {
    return this.restService
      .post(environment.urls.PriceChallengeAdmin_SendCounterOfferForManualReview, {
        ChallengeId: challengeId,
        CounterOfferPrice: counterOfferPrice,
        AdminNote: adminNote || undefined,
      })
      .pipe(map(() => undefined));
  }

  resendApprovedOfferToChat(challengeId: string): Observable<void> {
    return this.restService
      .post(environment.urls.PriceChallengeAdmin_ResendApprovedOfferToCustomerChat, {
        ChallengeId: challengeId,
      })
      .pipe(map(() => undefined));
  }

  private mapApprovalResult(row: Record<string, unknown>): PriceChallengeApprovalResult {
    return {
      challengeId: String(row.challengeId ?? row.ChallengeId ?? ''),
      productName: row.productName != null ? String(row.productName) : row.ProductName != null ? String(row.ProductName) : undefined,
      couponCode: String(row.couponCode ?? row.CouponCode ?? ''),
      approvedOfferPrice: Number(row.approvedOfferPrice ?? row.ApprovedOfferPrice ?? 0),
      offerExpiresAt: row.offerExpiresAt != null ? String(row.offerExpiresAt) : row.OfferExpiresAt != null ? String(row.OfferExpiresAt) : null,
      quantityLimit: Number(row.quantityLimit ?? row.QuantityLimit ?? 1),
      currency: row.currency != null ? String(row.currency) : row.Currency != null ? String(row.Currency) : undefined,
    };
  }

  private buildQuery(params: Record<string, unknown>): string {
    const parts: string[] = [];
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    return parts.length ? `?${parts.join('&')}` : '';
  }

  private mapListItem(row: Record<string, unknown>): PriceChallengeReviewListItem {
    return {
      id: String(row.id ?? row.Id ?? ''),
      productId: String(row.productId ?? row.ProductId ?? ''),
      productName: String(row.productName ?? row.ProductName ?? ''),
      productSlug: row.productSlug != null ? String(row.productSlug) : row.ProductSlug != null ? String(row.ProductSlug) : undefined,
      status: String(row.status ?? row.Status ?? ''),
      decision: String(row.decision ?? row.Decision ?? ''),
      decisionReason: row.decisionReason != null ? String(row.decisionReason) : row.DecisionReason != null ? String(row.DecisionReason) : undefined,
      ourRegularPriceAtChallenge: Number(row.ourRegularPriceAtChallenge ?? row.OurRegularPriceAtChallenge ?? 0),
      competitorComparablePriceAtDecision: this.toOptionalNumber(row.competitorComparablePriceAtDecision ?? row.CompetitorComparablePriceAtDecision),
      competitorDomain: row.competitorDomain != null ? String(row.competitorDomain) : row.CompetitorDomain != null ? String(row.CompetitorDomain) : null,
      currency: row.currency != null ? String(row.currency) : row.Currency != null ? String(row.Currency) : undefined,
      aiConfidenceScore: this.toOptionalNumber(row.aiConfidenceScore ?? row.AiConfidenceScore),
      productMatchConfidence: this.toOptionalNumber(row.productMatchConfidence ?? row.ProductMatchConfidence),
      creationTime: String(row.creationTime ?? row.CreationTime ?? ''),
    };
  }

  private mapDetail(row: Record<string, unknown>): PriceChallengeReviewDetail {
    const base = this.mapListItem(row);
    const evidenceRaw = (row.evidence ?? row.Evidence ?? []) as Record<string, unknown>[];
    const chatRaw = (row.chatMessages ?? row.ChatMessages ?? []) as Record<string, unknown>[];

    return {
      ...base,
      guestChatUserId: row.guestChatUserId != null ? String(row.guestChatUserId) : row.GuestChatUserId != null ? String(row.GuestChatUserId) : null,
      competitorUrl: row.competitorUrl != null ? String(row.competitorUrl) : row.CompetitorUrl != null ? String(row.CompetitorUrl) : null,
      competitorName: row.competitorName != null ? String(row.competitorName) : row.CompetitorName != null ? String(row.CompetitorName) : null,
      safeFloorPriceAtDecision: this.toOptionalNumber(row.safeFloorPriceAtDecision ?? row.SafeFloorPriceAtDecision),
      suggestedOfferPrice: this.toOptionalNumber(row.suggestedOfferPrice ?? row.SuggestedOfferPrice),
      offerExpiryMinutes: Number(row.offerExpiryMinutes ?? row.OfferExpiryMinutes ?? 30),
      quantityLimit: Number(row.quantityLimit ?? row.QuantityLimit ?? 1),
      evidence: evidenceRaw.map((item) => this.mapEvidence(item)),
      chatMessages: chatRaw.map((item) => this.mapChatMessage(item)),
    };
  }

  private mapEvidence(row: Record<string, unknown>): PriceChallengeEvidenceItem {
    return {
      id: String(row.id ?? row.Id ?? ''),
      priceChallengeId: String(row.priceChallengeId ?? row.PriceChallengeId ?? ''),
      chatMessageId: Number(row.chatMessageId ?? row.ChatMessageId ?? 0),
      evidenceType: String(row.evidenceType ?? row.EvidenceType ?? ''),
      imageUrl: row.imageUrl != null ? String(row.imageUrl) : row.ImageUrl != null ? String(row.ImageUrl) : null,
      competitorUrl: row.competitorUrl != null ? String(row.competitorUrl) : row.CompetitorUrl != null ? String(row.CompetitorUrl) : null,
      manualCompetitorPrice: this.toOptionalNumber(row.manualCompetitorPrice ?? row.ManualCompetitorPrice),
      submittedAt: String(row.submittedAt ?? row.SubmittedAt ?? ''),
    };
  }

  private mapChatMessage(row: Record<string, unknown>): PriceChallengeReviewChatMessage {
    return {
      id: Number(row.id ?? row.Id ?? 0),
      message: String(row.message ?? row.Message ?? ''),
      fromAdmin: Boolean(row.fromAdmin ?? row.FromAdmin ?? false),
      messageType: row.messageType != null ? String(row.messageType) : row.MessageType != null ? String(row.MessageType) : undefined,
      timestamp: String(row.timestamp ?? row.Timestamp ?? ''),
    };
  }

  private toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
