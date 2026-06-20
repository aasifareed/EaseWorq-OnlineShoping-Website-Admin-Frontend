import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { OnlineShopSettingsStateService } from './services/online-shop-settings-state.service';

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  readonly?: boolean;
}

@Component({
  selector: 'app-settings-shell',
  templateUrl: './settings-shell.component.html',
  styleUrls: ['./settings-shell.component.css'],
})
export class SettingsShellComponent implements OnInit, OnDestroy {
  activeSectionId = 'store-information';
  pageTitle = 'Store Information';

  readonly navItems: SettingsNavItem[] = [
    {
      id: 'store-information',
      label: 'Store Information',
      icon: 'fa-info-circle',
      route: '/online-shop/settings/store-information',
      readonly: true,
    },
    {
      id: 'storefront',
      label: 'Storefront',
      icon: 'fa-store',
      route: '/online-shop/settings/storefront',
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: 'fa-shipping-fast',
      route: '/online-shop/settings/delivery',
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: 'fa-credit-card',
      route: '/online-shop/settings/payment',
    },
    {
      id: 'invoice',
      label: 'Invoice / Receipt',
      icon: 'fa-file-invoice',
      route: '/online-shop/settings/invoice',
    },
    {
      id: 'seo',
      label: 'SEO / Social',
      icon: 'fa-share-alt',
      route: '/online-shop/settings/seo',
    },
  ];

  readonly themeOptions = [
    { value: 'default', label: 'Default' },
    { value: 'multikart', label: 'Multikart' },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    public globalDataService: GlobalDataService,
    public state: OnlineShopSettingsStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.state.ensureLoaded();
    this.syncFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e: NavigationEnd) => this.syncFromUrl(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isActive(item: SettingsNavItem): boolean {
    return this.activeSectionId === item.id;
  }

  navigate(item: SettingsNavItem): void {
    this.router.navigate([item.route]);
  }

  save(): void {
    this.state.save().subscribe();
  }

  currencyDisplay(): string {
    const p = this.state.posInfo;
    if (!p?.currencyName && !p?.currencySymbol) {
      return this.state.displayValue(null);
    }
    const name = p.currencyName || '';
    const sym = p.currencySymbol ? ` (${p.currencySymbol})` : '';
    return `${name}${sym}`.trim() || this.state.displayValue(null);
  }

  get showSaveButton(): boolean {
    return this.activeSectionId !== 'store-information' && this.activeSectionId !== 'payment';
  }

  private syncFromUrl(url: string): void {
    const match = this.navItems.find((item) => url.includes(item.id));
    if (match) {
      this.activeSectionId = match.id;
      this.pageTitle = match.label;
    }
  }
}
