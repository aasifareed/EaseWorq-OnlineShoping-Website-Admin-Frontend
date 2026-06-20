import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { CourierProviderEdit, CourierProviderListItem } from '../models/provider.models';

@Injectable()
export class CourierProviderService {
  constructor(private restService: RestService) {}

  getAll(): Observable<CourierProviderListItem[]> {
    return this.restService
      .get(environment.urls.CourierProvider_GetAll)
      .pipe(map((r) => this.normalizeList(r?.result)));
  }

  getForEdit(id?: string): Observable<CourierProviderEdit> {
    const url = id
      ? `${environment.urls.CourierProvider_GetForEdit}?id=${id}`
      : environment.urls.CourierProvider_GetForEdit;
    return this.restService.get(url).pipe(map((r) => this.normalizeEdit(r?.result)));
  }

  save(input: CourierProviderEdit): Observable<string> {
    return this.restService
      .postWithOutSpinner(environment.urls.CourierProvider_CreateOrUpdate, input)
      .pipe(map((r) => (r?.result as string) || input.id || ''));
  }

  delete(id: string): Observable<void> {
    return this.restService
      .delete(`${environment.urls.CourierProvider_Delete}?id=${id}`)
      .pipe(map(() => undefined));
  }

  enableDisable(id: string, isActive: boolean): Observable<void> {
    return this.restService
      .postWithOutSpinner(environment.urls.CourierProvider_EnableDisable, { id, isActive })
      .pipe(map(() => undefined));
  }

  private normalizeList(raw: unknown): CourierProviderListItem[] {
    const rows = (raw as unknown[]) || [];
    return rows.map((row) => this.normalizeListItem(row as Record<string, unknown>));
  }

  private normalizeListItem(r: Record<string, unknown>): CourierProviderListItem {
    return {
      id: String(r.id || r.Id || ''),
      courierProvider: String(r.courierProvider || r.CourierProvider || ''),
      providerCode: String(r.providerCode || r.ProviderCode || ''),
      apiBaseUrl: String(r.apiBaseUrl || r.ApiBaseUrl || ''),
      isActive: !!(r.isActive ?? r.IsActive),
      isApiEnabled: !!(r.isApiEnabled ?? r.IsApiEnabled),
      isManualRateEnabled: !!(r.isManualRateEnabled ?? r.IsManualRateEnabled),
      clientIdMasked: (r.clientIdMasked || r.ClientIdMasked) as string,
      clientSecretMasked: (r.clientSecretMasked || r.ClientSecretMasked) as string,
      usernameMasked: (r.usernameMasked || r.UsernameMasked) as string,
      lastRefreshAt: (r.lastRefreshAt || r.LastRefreshAt) as string,
      lastError: (r.lastError || r.LastError) as string,
      hasAccessToken: !!(r.hasAccessToken ?? r.HasAccessToken),
    };
  }

  private normalizeEdit(r: Record<string, unknown>): CourierProviderEdit {
    return {
      id: (r.id || r.Id) as string,
      courierProvider: String(r.courierProvider || r.CourierProvider || ''),
      providerCode: String(r.providerCode || r.ProviderCode || ''),
      apiBaseUrl: String(r.apiBaseUrl || r.ApiBaseUrl || ''),
      clientId: (r.clientId || r.ClientId) as string,
      clientSecret: (r.clientSecret || r.ClientSecret) as string,
      username: (r.username || r.Username) as string,
      password: (r.password || r.Password) as string,
      accessToken: (r.accessToken || r.AccessToken) as string,
      isActive: (r.isActive ?? r.IsActive) !== false,
      isApiEnabled: (r.isApiEnabled ?? r.IsApiEnabled) !== false,
      isManualRateEnabled: !!(r.isManualRateEnabled ?? r.IsManualRateEnabled),
      expiry: (r.expiry || r.Expiry) as string,
    };
  }
}
