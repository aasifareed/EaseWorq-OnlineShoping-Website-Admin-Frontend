import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { appServiceUrls } from 'src/environments/environment.urls';
import {
  AdminProductCategoriesQuery,
  AdminProductCategoryListItem,
  UpdateAdminProductCategoryPayload,
} from '../models/product-category.models';

@Injectable()
export class ProductCategoriesService {
  constructor(private restService: RestService) {}

  getCategories(
    query: AdminProductCategoriesQuery,
  ): Observable<{ items: AdminProductCategoryListItem[]; totalCount: number }> {
    const params = new URLSearchParams();
    params.set('SkipCount', String(query.skipCount));
    params.set('MaxResultCount', String(query.maxResultCount));
    if (query.keyword) {
      params.set('Keyword', query.keyword);
    }
    if (query.sorting) {
      params.set('Sorting', query.sorting);
    }

    const url = `${appServiceUrls.OnlineShopProductCategory_GetAllForAdmin}?${params.toString()}`;

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

  updateForAdmin(payload: UpdateAdminProductCategoryPayload): Observable<AdminProductCategoryListItem> {
    const body: Record<string, string | boolean> = {
      ProductGroupId: payload.productGroupId,
    };
    if (payload.showCategoryOnline != null) {
      body.ShowCategoryOnline = payload.showCategoryOnline;
    }
    if (payload.isPopular != null) {
      body.IsPopular = payload.isPopular;
    }

    const url =
      appServiceUrls.OnlineShopProductCategory_UpdateForAdmin ||
      '/OnlineShopProductCategory/UpdateForAdmin';

    return this.restService.put(url, body).pipe(
      map((response) => {
        const result = (response?.result ?? response) as Record<string, unknown>;
        return this.mapRow(result);
      }),
    );
  }

  private mapRow(row: Record<string, unknown>): AdminProductCategoryListItem {
    return {
      id: String(row.id ?? row.Id ?? ''),
      name: String(row.name ?? row.Name ?? '—'),
      showCategoryOnline: Boolean(row.showCategoryOnline ?? row.ShowCategoryOnline ?? false),
      isPopular: Boolean(row.isPopular ?? row.IsPopular ?? false),
    };
  }
}
