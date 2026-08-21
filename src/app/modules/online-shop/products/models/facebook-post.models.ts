export interface MetaPagePostHistoryItem {
  id: string;
  platform: string;
  status: string;
  publishedAt?: string | null;
  creationTime: string;
  permalink?: string | null;
  errorMessage?: string | null;
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
  recentPosts: MetaPagePostHistoryItem[];
}

export interface PublishMetaPagePostPayload {
  productId: string;
  caption: string;
  imageUrl?: string;
}

export interface PublishMetaPagePostResult {
  success: boolean;
  socialMediaPostId: string;
  externalPostId?: string | null;
  permalink?: string | null;
  message?: string | null;
}
