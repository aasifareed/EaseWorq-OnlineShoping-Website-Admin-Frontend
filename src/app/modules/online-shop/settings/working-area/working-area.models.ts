export interface OnlineShopStoreGeoPoint {
  latitude: number;
  longitude: number;
  sortOrder?: number;
  zoneId?: string | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  /** 1 = Main, 2 = Sub */
  level: number;
  parentZoneId?: string | null;
  sortOrder: number;
  isActive: boolean;
  /** .NET DayOfWeek: 0=Sunday … 6=Saturday */
  deliveryDays: number[];
  polygon: OnlineShopStoreGeoPoint[];
  subZones?: DeliveryZone[];
}

export const WEEK_DAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];
