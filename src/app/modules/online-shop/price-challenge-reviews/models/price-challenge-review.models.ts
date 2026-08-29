export interface PriceChallengeReviewListItem {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  status: string;
  decision: string;
  decisionReason?: string;
  ourRegularPriceAtChallenge: number;
  competitorComparablePriceAtDecision?: number | null;
  competitorDomain?: string | null;
  currency?: string;
  aiConfidenceScore?: number | null;
  productMatchConfidence?: number | null;
  creationTime: string;
}

export interface PriceChallengeEvidenceItem {
  id: string;
  priceChallengeId: string;
  chatMessageId: number;
  evidenceType: string;
  imageUrl?: string | null;
  competitorUrl?: string | null;
  manualCompetitorPrice?: number | null;
  submittedAt: string;
}

export interface PriceChallengeReviewChatMessage {
  id: number;
  message: string;
  fromAdmin: boolean;
  messageType?: string;
  timestamp: string;
}

export interface PriceChallengeReviewDetail extends PriceChallengeReviewListItem {
  guestChatUserId?: string | null;
  competitorUrl?: string | null;
  competitorName?: string | null;
  safeFloorPriceAtDecision?: number | null;
  suggestedOfferPrice?: number | null;
  offerExpiryMinutes?: number;
  quantityLimit?: number;
  evidence: PriceChallengeEvidenceItem[];
  chatMessages: PriceChallengeReviewChatMessage[];
}

export interface PriceChallengeApprovalResult {
  challengeId: string;
  productName?: string;
  couponCode: string;
  approvedOfferPrice: number;
  offerExpiresAt?: string | null;
  quantityLimit: number;
  currency?: string;
}

export const PRICE_CHALLENGE_DECISION_LABELS: Record<string, string> = {
  ManualReviewRequired: 'Low confidence',
  DifferentProduct: 'Product mismatch',
  CannotBeat: 'Cannot beat safely',
};
