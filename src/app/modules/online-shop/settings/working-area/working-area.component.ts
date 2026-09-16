import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { DeliveryZone, OnlineShopStoreGeoPoint, WEEK_DAYS } from './working-area.models';
import { WorkingAreaService } from './working-area.service';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-working-area',
  templateUrl: './working-area.component.html',
  styleUrls: ['./working-area.component.css'],
})
export class WorkingAreaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: false }) private mapViewEl?: ElementRef<HTMLDivElement>;

  readonly weekDays = WEEK_DAYS;

  zones: DeliveryZone[] = [];
  selectedZoneId: string | null = null;
  zoneNameDraft = '';
  deliveryDaysDraft: number[] = [];
  isDrawingMode = false;
  isEditingPolygon = false;
  saving = false;
  loading = false;
  mapPolygons: any[] = [];

  private readonly mapCenter = { lat: 29.840612, lng: 71.545335 };
  private readonly mapZoom = 12;
  private map: any = null;
  private mapReady = false;
  private mapInitialized = false;
  private currentPolygonPoints: any[] = [];
  private currentPolygonLines: any[] = [];
  private currentPolygonMarkers: any[] = [];
  private clickTimeout: any = null;
  private mapClickListener: any = null;
  private mapDblClickListener: any = null;
  private zoneColors = ['#1565c0', '#c62828', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f'];

  constructor(
    private workingAreaService: WorkingAreaService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  get selectedZone(): DeliveryZone | null {
    if (!this.selectedZoneId) {
      return null;
    }
    return this.findZone(this.selectedZoneId);
  }

  get selectedHasPolygon(): boolean {
    return (this.selectedZone?.polygon?.length || 0) >= 3;
  }

  get canUndoDrawing(): boolean {
    return this.isDrawingMode && this.currentPolygonPoints.length > 0;
  }

  ngAfterViewInit(): void {
    this.tryInitializeMap();
  }

  ngOnDestroy(): void {
    this.clearManualDrawingListeners();
    this.clearMapPolygons();
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
  }

  selectZone(zone: DeliveryZone): void {
    if (this.isDrawingMode) {
      this.toastr.info(this.translate.instant('Finish or cancel drawing before switching zones.'));
      return;
    }
    if (this.isEditingPolygon) {
      this.cancelEditPolygon(false);
    }
    this.selectedZoneId = zone.id;
    this.zoneNameDraft = zone.name;
    this.deliveryDaysDraft = [...(zone.deliveryDays || [])];
    this.renderAllZonePolygons(true);
  }

  addMainZone(): void {
    const name = prompt(this.translate.instant('Main zone name'), 'Zone 1');
    if (!name?.trim()) {
      return;
    }
    this.workingAreaService.createZone({ name: name.trim(), deliveryDays: [] }).subscribe({
      next: (zone) => {
        this.reloadZones(zone.id);
        this.toastr.success(this.translate.instant('Main zone created.'));
      },
      error: () => this.toastr.error(this.translate.instant('Failed to create zone.')),
    });
  }

  addSubZone(parent: DeliveryZone): void {
    const name = prompt(this.translate.instant('Sub zone name'), `${parent.name} - Sub 1`);
    if (!name?.trim()) {
      return;
    }
    this.workingAreaService
      .createZone({ name: name.trim(), parentZoneId: parent.id, deliveryDays: [] })
      .subscribe({
        next: (zone) => {
          this.reloadZones(zone.id);
          this.toastr.success(this.translate.instant('Sub zone created.'));
        },
        error: () => this.toastr.error(this.translate.instant('Failed to create sub zone.')),
      });
  }

  saveZoneDetails(): void {
    const zone = this.selectedZone;
    if (!zone) {
      return;
    }
    if (!this.zoneNameDraft.trim()) {
      this.toastr.warning(this.translate.instant('Zone name is required.'));
      return;
    }

    this.saving = true;
    this.workingAreaService
      .updateZone({
        id: zone.id,
        name: this.zoneNameDraft.trim(),
        isActive: zone.isActive,
        deliveryDays: [...this.deliveryDaysDraft],
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.reloadZones(zone.id);
          this.toastr.success(this.translate.instant('Zone saved.'));
        },
        error: () => {
          this.saving = false;
          this.toastr.error(this.translate.instant('Failed to save zone.'));
        },
      });
  }

  deleteSelectedZone(): void {
    const zone = this.selectedZone;
    if (!zone) {
      return;
    }
    const msg =
      zone.level === 1
        ? this.translate.instant('Delete this main zone and all of its sub zones?')
        : this.translate.instant('Delete this sub zone?');
    if (!confirm(msg)) {
      return;
    }

    this.workingAreaService.deleteZone(zone.id).subscribe({
      next: () => {
        this.selectedZoneId = null;
        this.reloadZones();
        this.toastr.success(this.translate.instant('Zone deleted.'));
      },
      error: () => this.toastr.error(this.translate.instant('Failed to delete zone.')),
    });
  }

  toggleDay(day: number): void {
    if (this.deliveryDaysDraft.includes(day)) {
      this.deliveryDaysDraft = this.deliveryDaysDraft.filter((d) => d !== day);
    } else {
      this.deliveryDaysDraft = [...this.deliveryDaysDraft, day].sort((a, b) => a - b);
    }
  }

  isDaySelected(day: number): boolean {
    return this.deliveryDaysDraft.includes(day);
  }

  addPolygon(): void {
    if (!this.selectedZone) {
      this.toastr.warning(this.translate.instant('Select a zone first.'));
      return;
    }
    if (!this.mapReady || !this.map) {
      this.toastr.warning(this.translate.instant('Please wait for the map to load.'));
      return;
    }
    if (this.selectedHasPolygon) {
      this.toastr.info(this.translate.instant('Remove the existing polygon before adding a new one.'));
      return;
    }
    this.startManualPolygonDrawing();
  }

  removePolygon(): void {
    const zone = this.selectedZone;
    if (!zone) {
      return;
    }
    if (this.isDrawingMode) {
      this.cleanupManualDrawing();
      this.cdr.detectChanges();
      return;
    }
    if (this.isEditingPolygon) {
      this.cancelEditPolygon(false);
    }
    if (!this.selectedHasPolygon) {
      return;
    }

    this.saving = true;
    this.workingAreaService.clearZonePolygon(zone.id).subscribe({
      next: () => {
        this.saving = false;
        this.reloadZones(zone.id);
        this.toastr.success(this.translate.instant('Polygon removed.'));
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.translate.instant('Failed to remove polygon.'));
      },
    });
  }

  undoLastDrawingPoint(): void {
    if (!this.canUndoDrawing) {
      return;
    }

    this.currentPolygonPoints.pop();

    const marker = this.currentPolygonMarkers.pop();
    marker?.setMap?.(null);

    const line = this.currentPolygonLines.pop();
    line?.setMap?.(null);

    this.cdr.detectChanges();
  }

  editPolygon(): void {
    if (!this.selectedZone || !this.selectedHasPolygon) {
      this.toastr.warning(this.translate.instant('Select a zone with a polygon first.'));
      return;
    }
    if (this.isDrawingMode) {
      return;
    }

    this.isEditingPolygon = true;
    this.renderAllZonePolygons(true);
    this.toastr.info(
      this.translate.instant('Drag the white handles to reshape. Click Save Polygon when done.'),
    );
    this.cdr.detectChanges();
  }

  cancelEditPolygon(showToast = true): void {
    if (!this.isEditingPolygon) {
      return;
    }
    this.isEditingPolygon = false;
    const zoneId = this.selectedZoneId;
    this.reloadZones(zoneId);
    if (showToast) {
      this.toastr.info(this.translate.instant('Polygon edits cancelled.'));
    }
  }

  savePolygon(): void {
    const zone = this.selectedZone;
    if (!zone || (zone.polygon?.length || 0) < 3) {
      this.toastr.warning(this.translate.instant('No polygon to save.'));
      return;
    }

    this.syncSelectedPolygonFromMapIfNeeded();

    this.saving = true;
    this.workingAreaService.saveZonePolygon(zone.id, zone.polygon).subscribe({
      next: () => {
        this.saving = false;
        this.isEditingPolygon = false;
        this.reloadZones(zone.id);
        this.toastr.success(this.translate.instant('Polygon saved.'));
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.translate.instant('Failed to save polygon.'));
      },
    });
  }

  dayLabels(days: number[]): string {
    if (!days?.length) {
      return this.translate.instant('No delivery days');
    }
    return days
      .map((d) => this.weekDays.find((w) => w.value === d)?.short || String(d))
      .join(', ');
  }

  private reloadZones(selectId?: string | null): void {
    this.loading = true;
    this.workingAreaService.getZones().subscribe({
      next: (zones) => {
        this.loading = false;
        this.zones = zones || [];
        const preferred = selectId || this.selectedZoneId;
        const found = preferred ? this.findZone(preferred) : null;
        if (found) {
          this.selectedZoneId = found.id;
          this.zoneNameDraft = found.name;
          this.deliveryDaysDraft = [...(found.deliveryDays || [])];
        } else if (this.zones.length) {
          const first = this.zones[0];
          this.selectedZoneId = first.id;
          this.zoneNameDraft = first.name;
          this.deliveryDaysDraft = [...(first.deliveryDays || [])];
        } else {
          this.selectedZoneId = null;
          this.zoneNameDraft = '';
          this.deliveryDaysDraft = [];
        }
        this.renderAllZonePolygons(true);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load delivery zones.'));
        this.cdr.detectChanges();
      },
    });
  }

  private findZone(id: string): DeliveryZone | null {
    for (const main of this.zones) {
      if (main.id === id) {
        return main;
      }
      const sub = (main.subZones || []).find((s) => s.id === id);
      if (sub) {
        return sub;
      }
    }
    return null;
  }

  private tryInitializeMap(attempt = 0): void {
    if (this.mapInitialized) {
      return;
    }

    const el = this.mapViewEl?.nativeElement;
    if (!el) {
      if (attempt < 20) {
        setTimeout(() => this.tryInitializeMap(attempt + 1), 200);
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      if (attempt < 20) {
        setTimeout(() => this.tryInitializeMap(attempt + 1), 250);
      }
      return;
    }

    this.mapInitialized = true;
    void this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps(): Promise<void> {
    try {
      await this.loadGoogleMapsApi();
      const el = this.mapViewEl?.nativeElement;
      if (!el || !window.google?.maps) {
        throw new Error('Map container or Google Maps API missing');
      }

      this.map = new window.google.maps.Map(el, {
        center: this.mapCenter,
        zoom: this.mapZoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      window.google.maps.event.addListenerOnce(this.map, 'idle', () => {
        this.mapReady = true;
        this.reloadZones();
        this.cdr.detectChanges();
      });
    } catch {
      this.mapInitialized = false;
      this.toastr.error(this.translate.instant('Failed to load Google Maps.'));
    }
  }

  private loadGoogleMapsApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const existing = document.querySelector(
        'script[data-online-shop-google-maps="1"]',
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
        return;
      }

      const key = environment.googleMapsApiKey || '';
      if (!key) {
        reject(new Error('Google Maps API key is missing'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-online-shop-google-maps', '1');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    });
  }

  private renderAllZonePolygons(fitSelected: boolean): void {
    if (!this.map || !window.google?.maps) {
      return;
    }

    this.clearMapPolygons();
    const allZones: DeliveryZone[] = [];
    this.zones.forEach((main, index) => {
      allZones.push(main);
      (main.subZones || []).forEach((sub) => allZones.push(sub));
      void index;
    });

    let colorIndex = 0;
    const bounds = new window.google.maps.LatLngBounds();
    let hasBounds = false;

    for (const zone of allZones) {
      if ((zone.polygon?.length || 0) < 3) {
        colorIndex++;
        continue;
      }

      const color = this.zoneColors[colorIndex % this.zoneColors.length];
      colorIndex++;
      const isSelected = zone.id === this.selectedZoneId;
      const paths = zone.polygon.map((p) => ({ lat: p.latitude, lng: p.longitude }));
      const polygon = new window.google.maps.Polygon({
        paths,
        fillColor: color,
        fillOpacity: this.isDrawingMode ? 0.08 : isSelected ? 0.35 : 0.15,
        strokeWeight: isSelected ? 3 : 1.5,
        strokeColor: color,
        // While drawing, polygons must not capture clicks or sub-zones cannot be drawn on top.
        clickable: !this.isDrawingMode,
        editable: isSelected && !this.isDrawingMode && this.isEditingPolygon,
        map: this.map,
        zIndex: isSelected ? 10 : 1,
      });
      polygon.__zoneId = zone.id;

      if (!this.isDrawingMode) {
        polygon.addListener('click', () => this.selectZone(zone));
      }
      this.mapPolygons.push(polygon);

      if (isSelected || !this.selectedZoneId) {
        paths.forEach((p) => {
          bounds.extend(p);
          hasBounds = true;
        });
      }

      if (isSelected && this.isEditingPolygon && polygon.getPath) {
        window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
          this.syncSelectedPolygonFromMap(polygon);
        });
        window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
          this.syncSelectedPolygonFromMap(polygon);
        });
        window.google.maps.event.addListener(polygon.getPath(), 'remove_at', () => {
          this.syncSelectedPolygonFromMap(polygon);
        });
      }
    }

    if (fitSelected && hasBounds) {
      this.map.fitBounds(bounds);
    }
  }

  private syncSelectedPolygonFromMapIfNeeded(): void {
    if (!this.isEditingPolygon || !this.selectedZoneId || !this.mapPolygons?.length) {
      return;
    }
    const polygon = this.mapPolygons.find((p) => p?.__zoneId === this.selectedZoneId);
    if (polygon?.getPath) {
      this.syncSelectedPolygonFromMap(polygon);
    }
  }

  private syncSelectedPolygonFromMap(polygon: any): void {
    const zone = this.selectedZone;
    if (!zone) {
      return;
    }
    const path = polygon.getPath();
    const points: OnlineShopStoreGeoPoint[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      points.push({ latitude: point.lat(), longitude: point.lng(), sortOrder: i, zoneId: zone.id });
    }
    zone.polygon = points;
  }

  private startManualPolygonDrawing(): void {
    this.isDrawingMode = true;
    this.currentPolygonPoints = [];
    this.currentPolygonLines = [];
    this.currentPolygonMarkers = [];
    this.clearManualDrawingListeners();

    // Let map clicks pass through existing main/sub polygons so a nested sub-zone can be drawn.
    this.setExistingPolygonsInteractive(false);
    this.renderAllZonePolygons(false);

    this.map.setOptions({
      draggableCursor: 'crosshair',
      clickableIcons: false,
      disableDoubleClickZoom: true,
    });

    this.mapClickListener = window.google.maps.event.addListener(this.map, 'click', (event: any) => {
      if (!this.isDrawingMode) {
        return;
      }
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }
      this.clickTimeout = setTimeout(() => this.handleMapClick(event), 280);
    });

    this.mapDblClickListener = window.google.maps.event.addListener(this.map, 'dblclick', (event: any) => {
      if (this.isDrawingMode && this.currentPolygonPoints.length >= 3) {
        event?.stop?.();
        if (this.clickTimeout) {
          clearTimeout(this.clickTimeout);
          this.clickTimeout = null;
        }
        this.completeManualPolygon();
      }
    });
  }

  private handleMapClick(event: any): void {
    if (!this.isDrawingMode || !event?.latLng) {
      return;
    }

    const latLng = event.latLng;
    if (this.currentPolygonPoints.length >= 3) {
      const first = this.currentPolygonPoints[0];
      const distance = this.calculateDistance(latLng, first);
      if (distance < 0.001) {
        this.completeManualPolygon();
        return;
      }
    }

    this.currentPolygonPoints.push(latLng);

    const marker = new window.google.maps.Marker({
      position: { lat: latLng.lat(), lng: latLng.lng() },
      map: this.map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#FF0000',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 6,
      },
    });
    this.currentPolygonMarkers.push(marker);

    if (this.currentPolygonPoints.length > 1) {
      const prev = this.currentPolygonPoints[this.currentPolygonPoints.length - 2];
      const line = new window.google.maps.Polyline({
        path: [
          { lat: prev.lat(), lng: prev.lng() },
          { lat: latLng.lat(), lng: latLng.lng() },
        ],
        strokeColor: '#FF0000',
        strokeWeight: 3,
        map: this.map,
      });
      this.currentPolygonLines.push(line);
    }
  }

  private completeManualPolygon(): void {
    const zone = this.selectedZone;
    if (!zone) {
      return;
    }
    if (this.currentPolygonPoints.length < 3) {
      this.toastr.warning(this.translate.instant('Need at least 3 points to create a polygon.'));
      return;
    }

    const points: OnlineShopStoreGeoPoint[] = this.currentPolygonPoints.map((point, index) => ({
      latitude: point.lat(),
      longitude: point.lng(),
      sortOrder: index,
      zoneId: zone.id,
    }));

    this.cleanupManualDrawing();
    this.saving = true;
    this.workingAreaService.saveZonePolygon(zone.id, points).subscribe({
      next: () => {
        this.saving = false;
        this.reloadZones(zone.id);
        this.toastr.success(this.translate.instant('Polygon saved.'));
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.translate.instant('Failed to save polygon.'));
      },
    });
  }

  private cleanupManualDrawing(): void {
    this.clearManualDrawingListeners();
    this.currentPolygonLines.forEach((line) => line.setMap(null));
    this.currentPolygonMarkers.forEach((marker) => marker.setMap(null));
    this.currentPolygonLines = [];
    this.currentPolygonMarkers = [];
    this.currentPolygonPoints = [];
    this.isDrawingMode = false;

    if (this.map) {
      this.map.setOptions({
        draggableCursor: null,
        clickableIcons: true,
        disableDoubleClickZoom: false,
      });
    }

    this.renderAllZonePolygons(false);
  }

  private setExistingPolygonsInteractive(interactive: boolean): void {
    this.mapPolygons.forEach((polygon) => {
      polygon?.setOptions?.({
        clickable: interactive,
        editable: false,
      });
    });
  }

  private clearManualDrawingListeners(): void {
    if (this.mapClickListener) {
      window.google?.maps?.event?.removeListener?.(this.mapClickListener);
      this.mapClickListener = null;
    }
    if (this.mapDblClickListener) {
      window.google?.maps?.event?.removeListener?.(this.mapDblClickListener);
      this.mapDblClickListener = null;
    }
  }

  private clearMapPolygons(): void {
    this.mapPolygons.forEach((polygon) => polygon?.setMap?.(null));
    this.mapPolygons = [];
  }

  private calculateDistance(point1: any, point2: any): number {
    const latDiff = Math.abs(point1.lat() - point2.lat());
    const lngDiff = Math.abs(point1.lng() - point2.lng());
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }
}
