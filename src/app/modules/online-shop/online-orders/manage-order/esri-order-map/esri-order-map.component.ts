import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { environment } from 'src/environments/environment';

export interface EsriMapPoint {
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-esri-order-map',
  templateUrl: './esri-order-map.component.html',
  styleUrls: ['./esri-order-map.component.scss'],
})
export class EsriOrderMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() point: EsriMapPoint | null = null;
  /** Fallback when stored lat/lng is missing — geocoded via Google. */
  @Input() addressQuery: string | null = null;

  @ViewChild('mapViewNode', { static: true }) private viewNode!: ElementRef<HTMLDivElement>;

  private map: any = null;
  private marker: any = null;
  private initializing = false;
  private activePoint: EsriMapPoint | null = null;
  private lastGeocodeQuery = '';

  loadError: string | null = null;
  isLoading = true;
  statusMessage: string | null = null;

  ngOnInit(): void {
    void this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }
    if (changes.point || changes.addressQuery) {
      void this.resolveAndPlot();
    }
  }

  ngOnDestroy(): void {
    this.marker?.setMap(null);
    this.marker = null;
    this.map = null;
  }

  private async initializeMap(): Promise<void> {
    if (this.initializing || this.map) {
      return;
    }

    this.initializing = true;
    this.isLoading = true;
    this.loadError = null;

    try {
      await this.loadGoogleMapsApi();
      const center = this.resolveCenter(this.normalizePoint(this.point));

      this.map = new window.google.maps.Map(this.viewNode.nativeElement, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: this.point ? 18 : 14,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      });

      await this.resolveAndPlot();
      this.isLoading = false;

      setTimeout(() => {
        window.google?.maps?.event?.trigger(this.map, 'resize');
        if (this.activePoint) {
          this.map.setCenter({
            lat: this.activePoint.latitude,
            lng: this.activePoint.longitude,
          });
        }
      }, 50);
    } catch (err) {
      console.error('Failed to load Google order map', err);
      this.loadError = 'Unable to load Google Maps. Check the API key and enabled APIs.';
      this.isLoading = false;
    } finally {
      this.initializing = false;
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
        if (window.google?.maps) {
          resolve();
        }
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

  private async resolveAndPlot(): Promise<void> {
    const stored = this.normalizePoint(this.point);
    if (stored) {
      this.activePoint = stored;
      this.statusMessage = null;
      this.plotPoint(stored, 18);
      return;
    }

    const query = (this.addressQuery || '').trim();
    if (!query) {
      this.activePoint = null;
      this.statusMessage = 'Location coordinates are not available for this order.';
      this.clearMarker();
      return;
    }

    if (query === this.lastGeocodeQuery && this.activePoint) {
      this.plotPoint(this.activePoint, 18);
      return;
    }

    this.statusMessage = 'Finding street location…';
    const geocoded = await this.geocodeAddress(query);
    this.lastGeocodeQuery = query;

    if (!geocoded) {
      this.activePoint = null;
      this.statusMessage = 'Could not resolve street location for this address.';
      this.clearMarker();
      const fallback = this.resolveCenter(null);
      this.map?.setCenter({ lat: fallback.latitude, lng: fallback.longitude });
      this.map?.setZoom(14);
      return;
    }

    this.activePoint = geocoded;
    this.statusMessage = 'Location estimated from shipping address.';
    this.plotPoint(geocoded, 18);
  }

  private geocodeAddress(address: string): Promise<EsriMapPoint | null> {
    return new Promise((resolve) => {
      if (!window.google?.maps) {
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          address,
          componentRestrictions: { country: 'PK' },
        },
        (results: any[], status: string) => {
          if (status !== 'OK' || !results?.[0]?.geometry?.location) {
            resolve(null);
            return;
          }
          const loc = results[0].geometry.location;
          resolve(
            this.normalizePoint({
              latitude: Number(loc.lat()),
              longitude: Number(loc.lng()),
            }),
          );
        },
      );
    });
  }

  private resolveCenter(point: EsriMapPoint | null): EsriMapPoint {
    if (point) {
      return point;
    }
    return { latitude: 29.840612, longitude: 71.545335 };
  }

  private normalizePoint(point: EsriMapPoint | null | undefined): EsriMapPoint | null {
    if (!point) {
      return null;
    }

    let lat = Number(point.latitude);
    let lng = Number(point.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return null;
    }

    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      const swap = lat;
      lat = lng;
      lng = swap;
    }

    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }

    return { latitude: lat, longitude: lng };
  }

  private clearMarker(): void {
    this.marker?.setMap(null);
    this.marker = null;
  }

  private plotPoint(point: EsriMapPoint, zoom: number): void {
    if (!this.map || !window.google?.maps) {
      return;
    }

    const position = { lat: point.latitude, lng: point.longitude };
    if (!this.marker) {
      this.marker = new window.google.maps.Marker({
        map: this.map,
        position,
        title: 'Order delivery location',
      });
    } else {
      this.marker.setPosition(position);
      this.marker.setMap(this.map);
    }

    this.map.setCenter(position);
    this.map.setZoom(zoom);
  }
}
