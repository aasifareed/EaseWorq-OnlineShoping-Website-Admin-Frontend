import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { DeliveryZone, OnlineShopStoreGeoPoint } from './working-area.models';

@Injectable()
export class WorkingAreaService {
  constructor(private restService: RestService) {}

  getZones(): Observable<DeliveryZone[]> {
    return this.restService.get(environment.urls.WorkingArea_GetZones).pipe(
      map((response) => this.mapZones(response)),
    );
  }

  createZone(payload: {
    name: string;
    parentZoneId?: string | null;
    deliveryDays: number[];
  }): Observable<DeliveryZone> {
    return this.restService.post(environment.urls.WorkingArea_CreateZone, payload).pipe(
      map((response) => this.mapZone((response as any)?.result ?? response)),
    );
  }

  updateZone(payload: {
    id: string;
    name: string;
    isActive: boolean;
    deliveryDays: number[];
  }): Observable<DeliveryZone> {
    return this.restService.put(environment.urls.WorkingArea_UpdateZone, payload).pipe(
      map((response) => this.mapZone((response as any)?.result ?? response)),
    );
  }

  deleteZone(id: string): Observable<boolean> {
    return this.restService.delete(`${environment.urls.WorkingArea_DeleteZone}?id=${encodeURIComponent(id)}`).pipe(
      map((response) => !!(response?.result ?? response)),
    );
  }

  saveZonePolygon(zoneId: string, points: OnlineShopStoreGeoPoint[]): Observable<boolean> {
    return this.restService.post(environment.urls.WorkingArea_SaveZonePolygon, {
      zoneId,
      points: points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    }).pipe(
      map((response) => !!(response?.result ?? response)),
    );
  }

  clearZonePolygon(zoneId: string): Observable<boolean> {
    return this.restService.post(
      `${environment.urls.WorkingArea_ClearZonePolygon}?zoneId=${encodeURIComponent(zoneId)}`,
      {},
    ).pipe(
      map((response) => !!(response?.result ?? response)),
    );
  }

  /** @deprecated Prefer zone APIs; kept for older callers. */
  getCurrentLocations(): Observable<OnlineShopStoreGeoPoint[]> {
    return this.restService.get(environment.urls.WorkingArea_GetCurrentStoreLocations).pipe(
      map((response) => this.mapPoints(response)),
    );
  }

  /** @deprecated Prefer saveZonePolygon. */
  saveLocations(points: OnlineShopStoreGeoPoint[]): Observable<boolean> {
    return this.restService.post(environment.urls.WorkingArea_CreateLocation, points).pipe(
      map((response) => !!(response?.result ?? response)),
    );
  }

  private mapZones(response: unknown): DeliveryZone[] {
    const result = (response as { result?: unknown })?.result ?? response;
    const rows = (Array.isArray(result) ? result : []) as Record<string, unknown>[];
    return rows.map((row) => this.mapZone(row));
  }

  private mapZone(row: Record<string, unknown> | any): DeliveryZone {
    const subRaw = (row.subZones ?? row.SubZones ?? []) as Record<string, unknown>[];
    return {
      id: String(row.id ?? row.Id ?? ''),
      name: String(row.name ?? row.Name ?? ''),
      level: Number(row.level ?? row.Level ?? 1),
      parentZoneId: (row.parentZoneId ?? row.ParentZoneId ?? null) as string | null,
      sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
      isActive: !!(row.isActive ?? row.IsActive ?? true),
      deliveryDays: this.mapDays(row.deliveryDays ?? row.DeliveryDays),
      polygon: this.mapPoints({ result: row.polygon ?? row.Polygon ?? [] }),
      subZones: Array.isArray(subRaw) ? subRaw.map((s) => this.mapZone(s)) : [],
    };
  }

  private mapDays(raw: unknown): number[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((d) => Number(d))
      .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
  }

  private mapPoints(response: unknown): OnlineShopStoreGeoPoint[] {
    const result = (response as { result?: unknown })?.result ?? response;
    const rows = (Array.isArray(result) ? result : []) as Record<string, unknown>[];
    return rows
      .map((row, index) => ({
        latitude: Number(row.latitude ?? row.Latitude ?? 0),
        longitude: Number(row.longitude ?? row.Longitude ?? 0),
        sortOrder: Number(row.sortOrder ?? row.SortOrder ?? index),
        zoneId: (row.zoneId ?? row.ZoneId ?? null) as string | null,
      }))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
}
