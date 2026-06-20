import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { PaymentProviderEdit, PaymentProviderListItem } from '../models/provider.models';

@Injectable()
export class PaymentProviderService {
  constructor(private restService: RestService) {}

  getAll(): Observable<PaymentProviderListItem[]> {
    return this.restService
      .get(environment.urls.PaymentProvider_GetAll)
      .pipe(map((r) => this.normalizeList(r?.result)));
  }

  getForEdit(id?: string, providerCode?: string): Observable<PaymentProviderEdit> {
    let url = environment.urls.PaymentProvider_GetForEdit;
    const params: string[] = [];
    if (id) {
      params.push(`id=${id}`);
    }
    if (providerCode) {
      params.push(`providerCode=${encodeURIComponent(providerCode)}`);
    }
    if (params.length) {
      url += `?${params.join('&')}`;
    }
    return this.restService.get(url).pipe(map((r) => this.normalizeEdit(r?.result)));
  }

  save(input: PaymentProviderEdit): Observable<string> {
    return this.restService
      .postWithOutSpinner(environment.urls.PaymentProvider_CreateOrUpdate, input)
      .pipe(map((r) => (r?.result as string) || input.id || ''));
  }

  delete(id: string): Observable<void> {
    return this.restService
      .delete(`${environment.urls.PaymentProvider_Delete}?id=${id}`)
      .pipe(map(() => undefined));
  }

  enableDisable(id: string, isActive: boolean): Observable<void> {
    return this.restService
      .postWithOutSpinner(environment.urls.PaymentProvider_EnableDisable, { id, isActive })
      .pipe(map(() => undefined));
  }

  setDefault(id: string): Observable<void> {
    return this.restService
      .postWithOutSpinner(environment.urls.PaymentProvider_SetDefault, { id })
      .pipe(map(() => undefined));
  }

  updateApiEnabled(id: string, isApiEnabled: boolean): Observable<void> {
    return this.getForEdit(id).pipe(
      switchMap((edit) => {
        const payload: PaymentProviderEdit = {
          ...edit,
          isApiEnabled,
        };
        if (!payload.securedKey) {
          delete payload.securedKey;
        }
        return this.save(payload).pipe(map(() => undefined));
      }),
    );
  }

  private normalizeList(raw: unknown): PaymentProviderListItem[] {
    const rows = (raw as unknown[]) || [];
    return rows.map((row) => this.normalizeListItem(row as Record<string, unknown>));
  }

  private normalizeListItem(r: Record<string, unknown>): PaymentProviderListItem {
    return {
      id: String(r.id || r.Id || ''),
      providerName: String(r.providerName || r.ProviderName || ''),
      providerCode: String(r.providerCode || r.ProviderCode || ''),
      environment: (r.environment || r.Environment) as string,
      isActive: !!(r.isActive ?? r.IsActive),
      isApiEnabled: !!(r.isApiEnabled ?? r.IsApiEnabled),
      isDefault: !!(r.isDefault ?? r.IsDefault),
      sortOrder: (r.sortOrder ?? r.SortOrder) as number,
      merchantIdMasked: (r.merchantIdMasked || r.MerchantIdMasked) as string,
      securedKeyMasked: (r.securedKeyMasked || r.SecuredKeyMasked) as string,
      publicBaseUrl: (r.publicBaseUrl || r.PublicBaseUrl) as string,
      collectShippingChargesInAdvanceForCod: !!(
        r.collectShippingChargesInAdvanceForCod ?? r.CollectShippingChargesInAdvanceForCod
      ),
      lastError: (r.lastError || r.LastError) as string,
      lastTestedAt: (r.lastTestedAt || r.LastTestedAt) as string,
    };
  }

  private normalizeEdit(r: Record<string, unknown>): PaymentProviderEdit {
    return {
      id: (r.id || r.Id) as string,
      customStoreId: (r.customStoreId || r.CustomStoreId) as string,
      providerName: String(r.providerName || r.ProviderName || ''),
      providerCode: String(r.providerCode || r.ProviderCode || ''),
      environment: (r.environment || r.Environment) as string,
      baseUrl: (r.baseUrl || r.BaseUrl) as string,
      tokenApiUrl: (r.tokenApiUrl || r.TokenApiUrl) as string,
      formUrl: (r.formUrl || r.FormUrl) as string,
      merchantId: (r.merchantId || r.MerchantId) as string,
      securedKey: (r.securedKey || r.SecuredKey) as string,
      publicBaseUrl: (r.publicBaseUrl || r.PublicBaseUrl) as string,
      username: (r.username || r.Username) as string,
      password: (r.password || r.Password) as string,
      extraConfigJson: (r.extraConfigJson || r.ExtraConfigJson) as string,
      isActive: (r.isActive ?? r.IsActive) !== false,
      isApiEnabled: (r.isApiEnabled ?? r.IsApiEnabled) !== false,
      isDefault: !!(r.isDefault ?? r.IsDefault),
      sortOrder: (r.sortOrder ?? r.SortOrder) as number,
      collectShippingChargesInAdvanceForCod: !!(
        r.collectShippingChargesInAdvanceForCod ?? r.CollectShippingChargesInAdvanceForCod
      ),
    };
  }
}
