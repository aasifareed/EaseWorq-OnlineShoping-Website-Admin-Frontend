import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { appServiceUrls } from 'src/environments/environment.urls';
import {
  AdminProductListItem,
  AdminProductsQuery,
  OnlineShopProductImage,
  UpdateAdminProductPayload,
} from '../models/product.models';
import { MetaCatalogSyncProgress } from '../models/meta-catalog-sync.models';
import {
  MetaPagePostDraft,
  MetaPagePostHistoryItem,
  MetaPagePostImage,
  PublishMetaPagePostPayload,
  PublishMetaPagePostResult,
  PublishSimpleMetaPagePostPayload,
  SimpleMetaPagePostDraft,
} from '../models/facebook-post.models';

@Injectable()
export class ProductsService {
  constructor(private restService: RestService) {}

  getProducts(query: AdminProductsQuery): Observable<{ items: AdminProductListItem[]; totalCount: number }> {
    const params = new URLSearchParams();
    params.set('SkipCount', String(query.skipCount));
    params.set('MaxResultCount', String(query.maxResultCount));
    if (query.keyword) {
      params.set('Keyword', query.keyword);
    }
    if (query.sorting) {
      params.set('Sorting', query.sorting);
    }

    const url = `${appServiceUrls.OnlineShopProduct_GetAllForAdmin}?${params.toString()}`;

    return this.restService.get(url).pipe(
      map((response) => {
        const result = response?.result ?? response;
        const items = (result?.items ?? result?.Items ?? []) as Record<string, unknown>[];
        const totalCount = (result?.totalCount ?? result?.TotalCount ?? 0) as number;
        return {
          items: items.map((row) => this.mapRow(row)),
          totalCount,
        };
      }),
    );
  }

  getImages(posProductId: string): Observable<OnlineShopProductImage[]> {
    const url = `${appServiceUrls.OnlineShopProduct_GetImages}?posProductId=${encodeURIComponent(posProductId)}`;
    return this.restService.get(url).pipe(map((response) => this.mapImages(response)));
  }

  removeImage(
    posProductId: string,
    options: { attachmentId?: string; posAttachmentId?: string },
  ): Observable<OnlineShopProductImage[]> {
    const url = appServiceUrls.OnlineShopProduct_RemoveImage || '/OnlineShopProductUpload/RemoveImage';
    const body: Record<string, string> = { PosProductId: posProductId };
    if (options.attachmentId) {
      body.AttachmentId = options.attachmentId;
    }
    if (options.posAttachmentId) {
      body.PosAttachmentId = options.posAttachmentId;
    }
    return this.restService.post(url, body).pipe(map((response) => this.mapImages(response)));
  }

  updateForAdmin(payload: UpdateAdminProductPayload): Observable<AdminProductListItem> {
    const body: Record<string, string | number | boolean> = {
      ProductInventoryId: payload.productInventoryId,
      ProductId: payload.productId,
    };
    if (payload.actualSellPrice != null) {
      body.ActualSellPrice = payload.actualSellPrice;
    }
    if (payload.discountPercent != null) {
      body.DiscountPercent = payload.discountPercent;
    }
    if (payload.slug !== undefined) {
      body.Slug = payload.slug ?? '';
    }
    if (payload.displayName !== undefined) {
      body.DisplayName = payload.displayName ?? '';
    }
    if (payload.description !== undefined) {
      body.Description = payload.description ?? '';
    }
    if (payload.productWeightKg != null) {
      body.ProductWeight = payload.productWeightKg;
    }
    if (payload.isAvailable != null) {
      body.IsAvailable = payload.isAvailable;
    }
    if (payload.showProductOnline != null) {
      body.ShowProductOnline = payload.showProductOnline;
    }
    if (payload.showOnMeta != null) {
      body.ShowOnMeta = payload.showOnMeta;
    }

    const url = appServiceUrls.OnlineShopProduct_UpdateForAdmin || '/OnlineShopProduct/UpdateForAdmin';
    return this.restService.put(url, body).pipe(
      map((response) => {
        const result = (response?.result ?? response) as Record<string, unknown>;
        return this.mapRow(result);
      }),
    );
  }

  uploadImages(posProductId: string, files: File[]): Observable<string[]> {
    const form = new FormData();
    form.append('PosProductId', posProductId);
    files.forEach((file) => form.append('Files', file));

    const uploadPath =
      appServiceUrls.OnlineShopProduct_UploadImages || '/OnlineShopProductUpload/UploadImages';

    return this.restService.postFormData(uploadPath, form).pipe(
      map((response) => {
        const result = response?.result ?? response;
        if (Array.isArray(result)) {
          return result as string[];
        }
        return [];
      }),
    );
  }

  getFacebookPostDraft(productId: string): Observable<MetaPagePostDraft> {
    const url = `${appServiceUrls.OnlineShopMetaPagePublish_GetDraft}?productId=${encodeURIComponent(productId)}`;
    return this.restService.get(url).pipe(
      map((response) => this.mapFacebookDraft((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  getFacebookPostHistory(productId: string): Observable<MetaPagePostHistoryItem[]> {
    const url = `${appServiceUrls.OnlineShopMetaPagePublish_GetHistory}?productId=${encodeURIComponent(productId)}`;
    return this.restService.get(url).pipe(
      map((response) => {
        const result = response?.result ?? response;
        const items = Array.isArray(result) ? result : [];
        return items.map((row) => this.mapFacebookHistoryItem(row as Record<string, unknown>));
      }),
    );
  }

  publishFacebookPost(payload: PublishMetaPagePostPayload): Observable<PublishMetaPagePostResult> {
    const url = appServiceUrls.OnlineShopMetaPagePublish_Publish;
    const body: Record<string, unknown> = {
      ProductId: payload.productId,
      Caption: payload.caption,
      SelectedImages: (payload.selectedImages ?? []).map((img) => ({
        ImageId: img.imageId,
        Order: img.order,
      })),
    };
    if (payload.imageUrl) {
      body.ImageUrl = payload.imageUrl;
    }
    return this.restService.post(url, body).pipe(
      map((response) => this.mapPublishResult((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  getSimpleFacebookPostDraft(): Observable<SimpleMetaPagePostDraft> {
    const url = appServiceUrls.OnlineShopMetaPagePublish_GetSimpleDraft;
    return this.restService.get(url).pipe(
      map((response) => this.mapSimpleFacebookDraft((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  publishSimpleFacebookPost(payload: PublishSimpleMetaPagePostPayload): Observable<PublishMetaPagePostResult> {
    const url = appServiceUrls.OnlineShopMetaPagePublish_PublishSimple;
    const body: Record<string, unknown> = {
      Caption: payload.caption,
      LinkUrl: payload.linkUrl || null,
      ImageUrls: payload.imageUrls ?? [],
    };
    return this.restService.post(url, body).pipe(
      map((response) => this.mapPublishResult((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  private mapPublishResult(result: Record<string, unknown>): PublishMetaPagePostResult {
    return {
      success: Boolean(result.success ?? result.Success ?? false),
      socialMediaPostId: String(result.socialMediaPostId ?? result.SocialMediaPostId ?? ''),
      externalPostId:
        result.externalPostId != null
          ? String(result.externalPostId)
          : result.ExternalPostId != null
            ? String(result.ExternalPostId)
            : null,
      permalink:
        result.permalink != null
          ? String(result.permalink)
          : result.Permalink != null
            ? String(result.Permalink)
            : null,
      message:
        result.message != null
          ? String(result.message)
          : result.Message != null
            ? String(result.Message)
            : null,
    };
  }

  private mapSimpleFacebookDraft(row: Record<string, unknown>): SimpleMetaPagePostDraft {
    const recentRaw = row.recentPosts ?? row.RecentPosts;
    const recent = Array.isArray(recentRaw)
      ? recentRaw.map((item) => this.mapFacebookHistoryItem(item as Record<string, unknown>))
      : [];

    return {
      pageName: String(row.pageName ?? row.PageName ?? 'Facebook Page'),
      pageId:
        row.pageId != null
          ? String(row.pageId)
          : row.PageId != null
            ? String(row.PageId)
            : null,
      caption: String(row.caption ?? row.Caption ?? ''),
      linkUrl:
        row.linkUrl != null
          ? String(row.linkUrl)
          : row.LinkUrl != null
            ? String(row.LinkUrl)
            : null,
      canPublish: Boolean(row.canPublish ?? row.CanPublish ?? false),
      publishingEnabled: Boolean(row.publishingEnabled ?? row.PublishingEnabled ?? false),
      disabledReason:
        row.disabledReason != null
          ? String(row.disabledReason)
          : row.DisabledReason != null
            ? String(row.DisabledReason)
            : null,
      recentPosts: recent,
    };
  }

  startMetaCatalogSync(): Observable<MetaCatalogSyncProgress> {
    const url = appServiceUrls.OnlineShopProduct_StartMetaCatalogSync;
    return this.restService.post(url, {}).pipe(
      map((response) => this.mapMetaSyncProgress((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  getMetaCatalogSyncProgress(): Observable<MetaCatalogSyncProgress> {
    const url = appServiceUrls.OnlineShopProduct_GetMetaCatalogSyncProgress;
    return this.restService.get(url).pipe(
      map((response) => this.mapMetaSyncProgress((response?.result ?? response) as Record<string, unknown>)),
    );
  }

  private mapMetaSyncProgress(row: Record<string, unknown>): MetaCatalogSyncProgress {
    return {
      isRunning: Boolean(row.isRunning ?? row.IsRunning ?? false),
      status: String(row.status ?? row.Status ?? 'Idle'),
      total: Number(row.total ?? row.Total ?? 0),
      processed: Number(row.processed ?? row.Processed ?? 0),
      succeeded: Number(row.succeeded ?? row.Succeeded ?? 0),
      failed: Number(row.failed ?? row.Failed ?? 0),
      remaining: Number(row.remaining ?? row.Remaining ?? 0),
      percent: Number(row.percent ?? row.Percent ?? 0),
      message:
        row.message != null
          ? String(row.message)
          : row.Message != null
            ? String(row.Message)
            : null,
      startedAt:
        row.startedAt != null
          ? String(row.startedAt)
          : row.StartedAt != null
            ? String(row.StartedAt)
            : null,
      completedAt:
        row.completedAt != null
          ? String(row.completedAt)
          : row.CompletedAt != null
            ? String(row.CompletedAt)
            : null,
    };
  }

  private mapFacebookDraft(row: Record<string, unknown>): MetaPagePostDraft {
    const recentRaw = row.recentPosts ?? row.RecentPosts;
    const recent = Array.isArray(recentRaw)
      ? recentRaw.map((item) => this.mapFacebookHistoryItem(item as Record<string, unknown>))
      : [];

    const imagesRaw = row.images ?? row.Images;
    const images = Array.isArray(imagesRaw)
      ? imagesRaw.map((item) => this.mapFacebookImage(item as Record<string, unknown>))
      : [];

    return {
      productId: String(row.productId ?? row.ProductId ?? ''),
      productInventoryId: String(row.productInventoryId ?? row.ProductInventoryId ?? ''),
      productName: String(row.productName ?? row.ProductName ?? ''),
      pageName: String(row.pageName ?? row.PageName ?? 'Facebook Page'),
      pageId:
        row.pageId != null
          ? String(row.pageId)
          : row.PageId != null
            ? String(row.PageId)
            : null,
      caption: String(row.caption ?? row.Caption ?? ''),
      imageUrl:
        row.imageUrl != null
          ? String(row.imageUrl)
          : row.ImageUrl != null
            ? String(row.ImageUrl)
            : null,
      productUrl: String(row.productUrl ?? row.ProductUrl ?? ''),
      listPrice: Number(row.listPrice ?? row.ListPrice ?? 0),
      sellingPrice: Number(row.sellingPrice ?? row.SellingPrice ?? 0),
      hasDiscount: Boolean(row.hasDiscount ?? row.HasDiscount ?? false),
      canPublish: Boolean(row.canPublish ?? row.CanPublish ?? false),
      publishingEnabled: Boolean(row.publishingEnabled ?? row.PublishingEnabled ?? false),
      disabledReason:
        row.disabledReason != null
          ? String(row.disabledReason)
          : row.DisabledReason != null
            ? String(row.DisabledReason)
            : null,
      images,
      recentPosts: recent,
    };
  }

  private mapFacebookImage(row: Record<string, unknown>): MetaPagePostImage {
    return {
      imageId: String(row.imageId ?? row.ImageId ?? ''),
      url: String(row.url ?? row.Url ?? ''),
      isPrimary: Boolean(row.isPrimary ?? row.IsPrimary ?? false),
      selected: Boolean(row.selected ?? row.Selected ?? false),
      canPublishToMeta: Boolean(row.canPublishToMeta ?? row.CanPublishToMeta ?? true),
      sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    };
  }

  private mapFacebookHistoryItem(row: Record<string, unknown>): MetaPagePostHistoryItem {
    return {
      id: String(row.id ?? row.Id ?? ''),
      platform: String(row.platform ?? row.Platform ?? 'Facebook'),
      status: String(row.status ?? row.Status ?? ''),
      publishedAt:
        row.publishedAt != null
          ? String(row.publishedAt)
          : row.PublishedAt != null
            ? String(row.PublishedAt)
            : null,
      creationTime: String(row.creationTime ?? row.CreationTime ?? ''),
      permalink:
        row.permalink != null
          ? String(row.permalink)
          : row.Permalink != null
            ? String(row.Permalink)
            : null,
      errorMessage:
        row.errorMessage != null
          ? String(row.errorMessage)
          : row.ErrorMessage != null
            ? String(row.ErrorMessage)
            : null,
    };
  }

  private mapImages(response: unknown): OnlineShopProductImage[] {
    const result = (response as { result?: unknown })?.result ?? response;
    const items = Array.isArray(result) ? result : [];
    return items.map((row: Record<string, unknown>) => {
      const sourceRaw = String(row.source ?? row.Source ?? '');
      const source =
        sourceRaw.toLowerCase() === 'pos' ? ('Pos' as const) : sourceRaw.toLowerCase() === 'onlineshop' ? ('OnlineShop' as const) : undefined;

      return {
        attachmentId:
          row.attachmentId != null
            ? String(row.attachmentId)
            : row.AttachmentId != null
              ? String(row.AttachmentId)
              : undefined,
        posAttachmentId:
          row.posAttachmentId != null
            ? String(row.posAttachmentId)
            : row.PosAttachmentId != null
              ? String(row.PosAttachmentId)
              : undefined,
        source,
        url: String(row.url ?? row.Url ?? ''),
        isPrimary: Boolean(row.isPrimary ?? row.IsPrimary ?? false),
        canRemove: Boolean(row.canRemove ?? row.CanRemove ?? false),
      };
    });
  }

  private mapRow(row: Record<string, unknown>): AdminProductListItem {
    const pictureUrlsRaw = row.pictureUrls ?? row.PictureUrls;
    const pictureUrls = Array.isArray(pictureUrlsRaw)
      ? (pictureUrlsRaw as unknown[]).map((u) => String(u))
      : [];

    const pictureUrl = String(row.pictureUrl ?? row.PictureUrl ?? '');

    return {
      id: String(row.id ?? row.Id ?? ''),
      productId: String(row.productId ?? row.ProductId ?? ''),
      productIdTag: String(row.productIdTag ?? row.ProductIdTag ?? ''),
      productName: String(row.productName ?? row.ProductName ?? '—'),
      displayName: this.mapOptionalText(row.displayName ?? row.DisplayName),
      description: this.mapOptionalText(row.description ?? row.Description),
      categoryName: String(row.categoryName ?? row.CategoryName ?? '—'),
      brandName: String(row.brandName ?? row.BrandName ?? '—'),
      slug: String(row.slug ?? row.Slug ?? '').trim(),
      availableQuantity: Number(row.availableQuantity ?? row.AvailableQuantity ?? 0),
      unitStock: Number(row.unitStock ?? row.UnitStock ?? 0),
      actualSellPrice: Number(row.actualSellPrice ?? row.ActualSellPrice ?? 0),
      discountPercent: Number(row.discountPercent ?? row.DiscountPercent ?? 0),
      productWeightKg: Number(row.productWeight ?? row.ProductWeight ?? 0),
      isAvailable: Boolean(row.isAvailable ?? row.IsAvailable ?? false),
      showProductOnline: Boolean(row.showProductOnline ?? row.ShowProductOnline ?? false),
      showOnMeta: Boolean(row.showOnMeta ?? row.ShowOnMeta ?? false),
      pictureUrl,
      pictureUrls: pictureUrls.length > 0 ? pictureUrls : pictureUrl ? [pictureUrl] : [],
    };
  }

  private mapOptionalText(value: unknown): string | null {
    if (value == null) {
      return null;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }
}
