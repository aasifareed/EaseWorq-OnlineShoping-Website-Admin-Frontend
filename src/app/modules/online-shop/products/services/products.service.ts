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
    if (payload.isAvailable != null) {
      body.IsAvailable = payload.isAvailable;
    }
    if (payload.showProductOnline != null) {
      body.ShowProductOnline = payload.showProductOnline;
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
      categoryName: String(row.categoryName ?? row.CategoryName ?? '—'),
      brandName: String(row.brandName ?? row.BrandName ?? '—'),
      availableQuantity: Number(row.availableQuantity ?? row.AvailableQuantity ?? 0),
      unitStock: Number(row.unitStock ?? row.UnitStock ?? 0),
      actualSellPrice: Number(row.actualSellPrice ?? row.ActualSellPrice ?? 0),
      isAvailable: Boolean(row.isAvailable ?? row.IsAvailable ?? false),
      showProductOnline: Boolean(row.showProductOnline ?? row.ShowProductOnline ?? false),
      pictureUrl,
      pictureUrls: pictureUrls.length > 0 ? pictureUrls : pictureUrl ? [pictureUrl] : [],
    };
  }
}
