import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { OnlineShopStoreGeoPoint } from './working-area.models';

@Injectable()
export class WorkingAreaService {
  constructor(private restService: RestService) {}

  getCurrentLocations(): Observable<OnlineShopStoreGeoPoint[]> {
    return this.restService.get(environment.urls.WorkingArea_GetCurrentStoreLocations).pipe(
      map((response) => this.mapPoints(response)),
    );
  }

  saveLocations(points: OnlineShopStoreGeoPoint[]): Observable<boolean> {
    return this.restService.post(environment.urls.WorkingArea_CreateLocation, points).pipe(
      map((response) => !!(response?.result ?? response)),
    );
  }

  private mapPoints(response: unknown): OnlineShopStoreGeoPoint[] {
    const result = (response as { result?: unknown })?.result ?? response;
    const rows = (Array.isArray(result) ? result : []) as Record<string, unknown>[];
    return rows
      .map((row, index) => ({
        latitude: Number(row.latitude ?? row.Latitude ?? 0),
        longitude: Number(row.longitude ?? row.Longitude ?? 0),
        sortOrder: Number(row.sortOrder ?? row.SortOrder ?? index),
      }))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
}
