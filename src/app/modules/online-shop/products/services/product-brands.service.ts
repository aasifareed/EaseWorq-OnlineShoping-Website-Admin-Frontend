import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { appServiceUrls } from 'src/environments/environment.urls';
import {
  AdminProductBrandListItem,
  AdminProductBrandsQuery,
  OnlineShopBrandImage,
  UpdateAdminProductBrandPayload,
} from '../models/product-brand.models';

@Injectable()
export class ProductBrandsService {
  constructor(private restService: RestService) {}

  getBrands(
    query: AdminProductBrandsQuery,
  ): Observable<{ items: AdminProductBrandListItem[]; totalCount: number }> {
    const params = new URLSearchParams();
    params.set('SkipCount', String(query.skipCount));
    params.set('MaxResultCount', String(query.maxResultCount));
    if (query.keyword) {
      params.set('Keyword', query.keyword);
    }
    if (query.sorting) {
      params.set('Sorting', query.sorting);
    }

    const url = `${appServiceUrls.OnlineShopBrand_GetAllForAdmin}?${params.toString()}`;

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

  updateForAdmin(payload: UpdateAdminProductBrandPayload): Observable<AdminProductBrandListItem> {
    const body: Record<string, string | boolean> = {
      BrandId: payload.brandId,
    };
    if (payload.isPopular != null) {
      body.IsPopular = payload.isPopular;
    }

    const url =
      appServiceUrls.OnlineShopBrand_UpdateForAdmin || '/OnlineShopBrand/UpdateForAdmin';

    return this.restService.put(url, body).pipe(
      map((response) => {
        const result = (response?.result ?? response) as Record<string, unknown>;
        return this.mapRow(result);
      }),
    );
  }

  getImage(posBrandId: string): Observable<OnlineShopBrandImage | null> {
    const url = `${appServiceUrls.OnlineShopBrandImage_Get}?posBrandId=${encodeURIComponent(posBrandId)}`;
    return this.restService.get(url).pipe(map((response) => this.mapImage(response)));
  }

  uploadImage(posBrandId: string, file: File): Observable<OnlineShopBrandImage | null> {
    const form = new FormData();
    form.append('PosBrandId', posBrandId);
    form.append('Files', file);
    return this.restService
      .postFormData(appServiceUrls.OnlineShopBrandImage_Upload, form)
      .pipe(map((response) => this.mapImage(response)));
  }

  removeImage(posBrandId: string): Observable<OnlineShopBrandImage | null> {
    return this.restService
      .post(appServiceUrls.OnlineShopBrandImage_Remove, { PosBrandId: posBrandId })
      .pipe(map((response) => this.mapImage(response)));
  }

  private mapImage(response: unknown): OnlineShopBrandImage | null {
    const result = (response as { result?: unknown })?.result ?? response;
    if (!result || typeof result !== 'object') {
      return null;
    }
    const row = result as Record<string, unknown>;
    const url = String(row.url ?? row.Url ?? '');
    if (!url) {
      return null;
    }
    return {
      attachmentId:
        row.attachmentId != null
          ? String(row.attachmentId)
          : row.AttachmentId != null
            ? String(row.AttachmentId)
            : undefined,
      url,
      canRemove: Boolean(row.canRemove ?? row.CanRemove ?? true),
    };
  }

  private mapRow(row: Record<string, unknown>): AdminProductBrandListItem {
    return {
      id: String(row.id ?? row.Id ?? ''),
      name: String(row.name ?? row.Name ?? '—'),
      isPopular: Boolean(row.isPopular ?? row.IsPopular ?? false),
      pictureUrl: String(row.pictureUrl ?? row.PictureUrl ?? ''),
    };
  }
}
