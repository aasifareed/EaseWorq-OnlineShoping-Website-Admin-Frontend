import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { appServiceUrls } from 'src/environments/environment.urls';
import { OnlineShopStoreLogo } from './store-logo.models';

@Injectable()
export class StoreLogoService {
  constructor(private restService: RestService) {}

  getLogo(): Observable<OnlineShopStoreLogo | null> {
    return this.restService.get(appServiceUrls.OnlineShopStoreLogo_GetLogo).pipe(
      map((response) => this.mapLogo(response)),
    );
  }

  uploadLogo(file: File): Observable<string> {
    const form = new FormData();
    form.append('File', file);
    return this.restService.postFormData(appServiceUrls.OnlineShopStoreLogo_UploadLogo, form).pipe(
      map((response) => {
        const result = response?.result ?? response;
        return typeof result === 'string' ? result : String((result as { url?: string; Url?: string })?.url ?? (result as { Url?: string })?.Url ?? '');
      }),
    );
  }

  removeLogo(): Observable<OnlineShopStoreLogo | null> {
    return this.restService.post(appServiceUrls.OnlineShopStoreLogo_RemoveLogo, {}).pipe(
      map((response) => this.mapLogo(response)),
    );
  }

  private mapLogo(response: unknown): OnlineShopStoreLogo | null {
    const result = (response as { result?: unknown })?.result ?? response;
    if (!result || typeof result !== 'object') {
      return null;
    }

    const row = result as Record<string, unknown>;
    const url = String(row.url ?? row.Url ?? '').trim();
    if (!url) {
      return { id: null, url: null, canRemove: false };
    }

    return {
      id: String(row.id ?? row.Id ?? '') || null,
      url,
      canRemove: row.canRemove ?? row.CanRemove ?? true,
    };
  }
}
