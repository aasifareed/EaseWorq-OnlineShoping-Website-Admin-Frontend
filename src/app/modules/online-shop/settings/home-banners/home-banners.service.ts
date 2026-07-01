import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { appServiceUrls } from 'src/environments/environment.urls';
import { OnlineShopHomeBanner } from './home-banner.models';

@Injectable()
export class HomeBannersService {
  constructor(private restService: RestService) {}

  getBanners(): Observable<OnlineShopHomeBanner[]> {
    return this.restService.get(appServiceUrls.OnlineShopHomeBanner_GetBanners).pipe(
      map((response) => this.mapBanners(response)),
    );
  }

  uploadBanners(files: File[]): Observable<string[]> {
    const form = new FormData();
    files.forEach((file) => form.append('Files', file));
    return this.restService.postFormData(appServiceUrls.OnlineShopHomeBanner_UploadBanners, form).pipe(
      map((response) => {
        const result = response?.result ?? response;
        return (Array.isArray(result) ? result : []) as string[];
      }),
    );
  }

  removeBanner(bannerId: string): Observable<OnlineShopHomeBanner[]> {
    return this.restService
      .post(appServiceUrls.OnlineShopHomeBanner_RemoveBanner, { BannerId: bannerId })
      .pipe(map((response) => this.mapBanners(response)));
  }

  private mapBanners(response: unknown): OnlineShopHomeBanner[] {
    const result = (response as { result?: unknown })?.result ?? response;
    const rows = (Array.isArray(result) ? result : []) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id ?? row.Id ?? ''),
      url: String(row.url ?? row.Url ?? ''),
      sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
      isActive: (row.isActive ?? row.IsActive ?? true) as boolean,
      title: (row.title ?? row.Title) as string | undefined,
      linkUrl: (row.linkUrl ?? row.LinkUrl) as string | undefined,
      canRemove: (row.canRemove ?? row.CanRemove ?? true) as boolean,
    }));
  }
}
