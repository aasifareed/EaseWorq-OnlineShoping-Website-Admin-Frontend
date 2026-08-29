import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { OnlineShopSettingsStateService } from './services/online-shop-settings-state.service';
import {
  computePriceChallengeDesiredBeatPrice,
  PRICE_CHALLENGE_BEAT_STRATEGIES,
  PRICE_CHALLENGE_UNSAFE_BEAT_ACTIONS,
  PriceChallengeBeatStrategy,
} from './models/price-challenge-settings.util';

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
      id: 'working-area',
      label: 'Working Area',
      icon: 'fa-map-marked-alt',
      route: '/online-shop/settings/working-area',
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: 'fa-credit-card',
      route: '/online-shop/settings/payment',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: 'fa-tags',
      route: '/online-shop/settings/pricing',
    },
    {
      id: 'price-challenge',
      label: 'Sasta Price Challenge',
      icon: 'fa-comments',
      route: '/online-shop/settings/price-challenge',
    },
    {
      id: 'invoice',
      label: 'Invoice / Receipt',
      icon: 'fa-file-invoice',
      route: '/online-shop/settings/invoice',
    },
    {
      id: 'home-banners',
      label: 'Home Page Banners',
      icon: 'fa-image',
      route: '/online-shop/settings/home-banners',
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

  readonly priceChallengeBeatStrategies = PRICE_CHALLENGE_BEAT_STRATEGIES;
  readonly priceChallengeUnsafeBeatActions = PRICE_CHALLENGE_UNSAFE_BEAT_ACTIONS;
  readonly priceChallengeExampleCompetitorPrice = 2000;

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
    return this.activeSectionId !== 'store-information'
      && this.activeSectionId !== 'payment'
      && this.activeSectionId !== 'home-banners'
      && this.activeSectionId !== 'delivery'
      && this.activeSectionId !== 'working-area';
  }

  get saveButtonLabel(): string {
    return 'Save Settings';
  }

  get isSaving(): boolean {
    return this.state.saving;
  }

  priceChallengeCurrencySymbol(): string {
    return this.state.posInfo?.currencySymbol?.trim() || 'Rs';
  }

  priceChallengeBeatStrategyHelp(): string {
    const strategy = this.state.form.get('priceChallengeBeatStrategy')?.value as PriceChallengeBeatStrategy;
    return this.priceChallengeBeatStrategies.find((item) => item.value === strategy)?.help || '';
  }

  priceChallengeExampleBeatDescription(): string {
    const strategy = this.state.form.get('priceChallengeBeatStrategy')?.value as PriceChallengeBeatStrategy;
    const amount = Number(this.state.form.get('priceChallengeBeatByAmount')?.value);
    const percent = Number(this.state.form.get('priceChallengeBeatByPercent')?.value);
    const symbol = this.priceChallengeCurrencySymbol();

    if (strategy === 'percent' && Number.isFinite(percent) && percent > 0) {
      return `${percent}% below competitor`;
    }
    if (strategy === 'both') {
      const parts: string[] = [];
      if (Number.isFinite(amount) && amount > 0) {
        parts.push(`${symbol} ${this.formatPriceChallengeMoney(amount)} below`);
      }
      if (Number.isFinite(percent) && percent > 0) {
        parts.push(`${percent}% below`);
      }
      if (parts.length) {
        return `${parts.join(' and ')} (we use whichever beats more)`;
      }
    }
    if (Number.isFinite(amount) && amount > 0) {
      return `${symbol} ${this.formatPriceChallengeMoney(amount)} below competitor`;
    }
    return `${symbol} 0 below competitor`;
  }

  priceChallengeExampleOfferPrice(): number {
    const strategy = this.state.form.get('priceChallengeBeatStrategy')?.value as PriceChallengeBeatStrategy;
    const amountRaw = this.state.form.get('priceChallengeBeatByAmount')?.value;
    const percentRaw = this.state.form.get('priceChallengeBeatByPercent')?.value;
    const amount = strategy === 'percent' ? null : Number(amountRaw);
    const percent = strategy === 'amount' ? null : Number(percentRaw);

    return computePriceChallengeDesiredBeatPrice(
      this.priceChallengeExampleCompetitorPrice,
      Number.isFinite(amount) && amount > 0 ? amount : null,
      Number.isFinite(percent) && percent > 0 ? percent : null,
    );
  }

  formatPriceChallengeMoney(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  private syncFromUrl(url: string): void {
    const match = this.navItems.find((item) => url.includes(item.id));
    if (match) {
      this.activeSectionId = match.id;
      this.pageTitle = match.label;
    }
  }
}
