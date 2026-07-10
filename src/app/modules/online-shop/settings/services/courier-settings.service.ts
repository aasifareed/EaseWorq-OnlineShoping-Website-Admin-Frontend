import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { AdminCourierListItem, CourierSelectionItem } from '../models/courier-setting.models';

@Injectable()
export class CourierSettingsService {
  constructor(private restService: RestService) {}

  getFlashipCouriersForAdmin(): Observable<AdminCourierListItem[]> {
    return this.restService
      .get(environment.urls.Settings_GetFlashipCouriersForAdmin)
      .pipe(map((response) => this.normalizeList(response?.result)));
  }

  saveCourierSettings(selections: CourierSelectionItem[]): Observable<void> {
    return this.restService
      .postWithOutSpinner(environment.urls.Settings_SaveCourierSettings, { selections })
      .pipe(map(() => undefined));
  }

  private normalizeList(raw: unknown): AdminCourierListItem[] {
    const rows = (raw as unknown[]) || [];
    return rows.map((row) => this.normalizeItem(row as Record<string, unknown>));
  }

  private normalizeItem(row: Record<string, unknown>): AdminCourierListItem {
    return {
      courierName: String(row.courierName || row.CourierName || ''),
      courierCode: String(row.courierCode || row.CourierCode || ''),
      isSelected: !!(row.isSelected ?? row.IsSelected),
    };
  }
}
