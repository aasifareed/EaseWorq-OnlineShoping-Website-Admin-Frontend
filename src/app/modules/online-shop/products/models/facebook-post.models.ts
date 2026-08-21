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

export interface PublishSimpleMetaPagePostPayload {
  caption: string;
  linkUrl?: string;
  imageUrls?: string[];
}
