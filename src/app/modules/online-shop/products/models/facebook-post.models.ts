export interface MetaPagePostHistoryItem {
  id: string;
  platform: string;
  status: string;
  publishedAt?: string | null;
  creationTime: string;
  permalink?: string | null;
  errorMessage?: string | null;
}

export interface MetaPagePostImage {
  imageId: string;
  url: string;
  isPrimary: boolean;
  selected: boolean;
  canPublishToMeta: boolean;
  sortOrder: number;
  /** Client-side publish sequence for selected images (1 = first on Facebook). */
  publishOrder?: number;
}

export interface MetaPagePostDraft {
  productId: string;
  productInventoryId: string;
  productName: string;
  pageName: string;
  pageId?: string | null;
  caption: string;
  imageUrl?: string | null;
  productUrl: string;
  listPrice: number;
  sellingPrice: number;
  hasDiscount: boolean;
  canPublish: boolean;
  publishingEnabled: boolean;
  disabledReason?: string | null;
  isPriceChallengeEnabled?: boolean;
  includePriceChallenge?: boolean;
  priceChallengeUrl?: string | null;
  baseCaption?: string;
  baseCaptionUrdu?: string;
  defaultCaptionLanguage?: ReelVoiceLanguage;
  images: MetaPagePostImage[];
  recentPosts: MetaPagePostHistoryItem[];
}

export interface PublishMetaPageSelectedImage {
  imageId: string;
  order: number;
}

export interface PublishMetaPagePostPayload {
  productId: string;
  caption: string;
  imageUrl?: string;
  selectedImages: PublishMetaPageSelectedImage[];
  includePriceChallenge?: boolean;
  captionLanguage?: ReelVoiceLanguage;
}

export interface PublishMetaPagePostResult {
  success: boolean;
  socialMediaPostId: string;
  externalPostId?: string | null;
  permalink?: string | null;
  message?: string | null;
}

export interface SimpleMetaPagePostDraft {
  pageName: string;
  pageId?: string | null;
  caption: string;
  linkUrl?: string | null;
  canPublish: boolean;
  publishingEnabled: boolean;
  disabledReason?: string | null;
  recentPosts: MetaPagePostHistoryItem[];
}

export type ReelVoiceLanguage = 'English' | 'Urdu' | 'RomanUrdu';

export interface MetaPageReelDraft extends MetaPagePostDraft {
  reelSecondsPerSlide?: number;
  reelEstimatedTotalSeconds?: number;
  reelBuilderReady?: boolean;
  reelDisabledReason?: string | null;
  reelIncludesProductLink?: boolean;
  reelShoppingHost?: string | null;
  defaultReelVoiceLanguage?: ReelVoiceLanguage;
  defaultVoiceoverTextEn?: string;
  defaultVoiceoverTextUrdu?: string;
  defaultVoiceoverTextRomanUrdu?: string;
}

export interface PublishMetaPageReelPayload extends PublishMetaPagePostPayload {
  voiceLanguage?: ReelVoiceLanguage;
  voiceoverText?: string;
}

export interface MetaPageReelPreview {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
}

export interface PublishSimpleMetaPagePostPayload {
  caption: string;
  linkUrl?: string;
  imageUrls?: string[];
}
