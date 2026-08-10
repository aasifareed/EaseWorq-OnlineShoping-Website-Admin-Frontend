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
import { OnlineShopStoreGeoPoint } from './working-area.models';
import { WorkingAreaService } from './working-area.service';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-working-area',
  templateUrl: './working-area.component.html',
  styleUrls: ['./working-area.component.css'],
})
export class WorkingAreaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: false }) private mapViewEl?: ElementRef<HTMLDivElement>;

  isDrawingMode = false;
  saving = false;
  loading = false;
  polygons: any[] = [];

  private readonly mapCenter = { lat: 29.840612, lng: 71.545335 };
  private readonly mapZoom = 12;
  private map: any = null;
  private mapReady = false;
  private mapInitialized = false;
  private currentPolygonPoints: any[] = [];
  private currentPolygonLines: any[] = [];
  private currentPolygonMarkers: any[] = [];
  private clickTimeout: any = null;
  private lastClickTime = 0;
  private mapClickListener: any = null;
  private mapDblClickListener: any = null;

  constructor(
    private workingAreaService: WorkingAreaService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.tryInitializeMap();
  }

  ngOnDestroy(): void {
    this.clearManualDrawingListeners();
    this.clearAllPolygons();
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
  }

  addPolygon(): void {
    if (!this.mapReady || !this.map) {
      this.toastr.warning(this.translate.instant('Please wait for the map to load.'));
      return;
    }
    if (this.polygons.length > 0) {
      this.toastr.info(this.translate.instant('Remove the existing polygon before adding a new one.'));
      return;
    }
    this.startManualPolygonDrawing();
  }

  removePolygon(): void {
    if (this.polygons.length === 0) {
      return;
    }
    const last = this.polygons.pop();
    last?.setMap?.(null);
    this.cleanupManualDrawing();
  }

  savePolygon(): void {
    if (this.polygons.length === 0) {
      this.toastr.warning(this.translate.instant('No polygon to save.'));
      return;
    }

    const polygon = this.polygons[this.polygons.length - 1];
    const path = polygon.getPath();
    const coordinates: OnlineShopStoreGeoPoint[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        latitude: point.lat(),
        longitude: point.lng(),
      });
    }

    if (coordinates.length < 3) {
      this.toastr.warning(this.translate.instant('A working area needs at least 3 points.'));
      return;
    }

    this.saving = true;
    this.workingAreaService.saveLocations(coordinates).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('Working area saved.'));
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.translate.instant('Failed to save working area.'));
      },
    });
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
        this.loadExistingPolygons();
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

      const existing = document.querySelector('script[data-online-shop-google-maps="1"]') as HTMLScriptElement | null;
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

  private loadExistingPolygons(): void {
    this.loading = true;
    this.workingAreaService.getCurrentLocations().subscribe({
      next: (points) => {
        this.loading = false;
        if (points.length >= 3) {
          this.createPolygonFromBackendData(points);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load working area.'));
        this.cdr.detectChanges();
      },
    });
  }

  private createPolygonFromBackendData(points: OnlineShopStoreGeoPoint[]): void {
    if (!this.map || !window.google?.maps) {
      return;
    }

    const paths = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    const polygon = new window.google.maps.Polygon({
      paths,
      fillColor: '#FF0000',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#FF0000',
      clickable: true,
      editable: true,
      map: this.map,
    });

    this.polygons = [polygon];
    this.fitMapToPolygon(paths);
  }

  private fitMapToPolygon(paths: Array<{ lat: number; lng: number }>): void {
    if (!this.map || !paths.length) {
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    paths.forEach((p) => bounds.extend(p));
    this.map.fitBounds(bounds);
  }

  private startManualPolygonDrawing(): void {
    this.isDrawingMode = true;
    this.currentPolygonPoints = [];
    this.currentPolygonLines = [];
    this.currentPolygonMarkers = [];
    this.clearManualDrawingListeners();

    this.map.setOptions({
      draggableCursor: 'crosshair',
      clickableIcons: false,
      disableDoubleClickZoom: true,
    });

    this.mapClickListener = window.google.maps.event.addListener(this.map, 'click', (event: any) => {
      if (!this.isDrawingMode) {
        return;
      }
      const currentTime = Date.now();
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }
      this.clickTimeout = setTimeout(() => this.handleMapClick(event), 280);
      this.lastClickTime = currentTime;
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
    if (this.currentPolygonPoints.length < 3) {
      this.toastr.warning(this.translate.instant('Need at least 3 points to create a polygon.'));
      return;
    }

    const paths = this.currentPolygonPoints.map((point) => ({
      lat: point.lat(),
      lng: point.lng(),
    }));

    const polygon = new window.google.maps.Polygon({
      paths,
      fillColor: '#FF0000',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#FF0000',
      clickable: true,
      editable: true,
      map: this.map,
    });

    this.cleanupManualDrawing();
    this.polygons = [polygon];
    this.cdr.detectChanges();
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

  private clearAllPolygons(): void {
    this.polygons.forEach((polygon) => polygon?.setMap?.(null));
    this.polygons = [];
  }

  private calculateDistance(point1: any, point2: any): number {
    const latDiff = Math.abs(point1.lat() - point2.lat());
    const lngDiff = Math.abs(point1.lng() - point2.lng());
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }
}
