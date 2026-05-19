import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { HeaderMenuStateService } from './services/header-menu-state.service';

export interface MenuNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  formControlName: string;
}

@Component({
  selector: 'app-menu-shell',
  templateUrl: './menu-shell.component.html',
  styleUrls: ['./menu-shell.component.css'],
})
export class MenuShellComponent implements OnInit, OnDestroy {
  activeSectionId = 'dropdown-1';
  pageTitle = 'Header Dropdown 1';

  readonly navItems: MenuNavItem[] = [
    {
      id: 'dropdown-1',
      label: 'Header Dropdown 1',
      icon: 'fa-bars',
      route: '/online-shop/storefront/dropdown-1',
      formControlName: 'headerDropdown1ProductGroupId',
    },
    {
      id: 'dropdown-2',
      label: 'Header Dropdown 2',
      icon: 'fa-bars',
      route: '/online-shop/storefront/dropdown-2',
      formControlName: 'headerDropdown2ProductGroupId',
    },
    {
      id: 'dropdown-3',
      label: 'Header Dropdown 3',
      icon: 'fa-bars',
      route: '/online-shop/storefront/dropdown-3',
      formControlName: 'headerDropdown3ProductGroupId',
    },
    {
      id: 'dropdown-4',
      label: 'Header Dropdown 4',
      icon: 'fa-bars',
      route: '/online-shop/storefront/dropdown-4',
      formControlName: 'headerDropdown4ProductGroupId',
    },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    public globalDataService: GlobalDataService,
    public state: HeaderMenuStateService,
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

  get activeNavItem(): MenuNavItem | undefined {
    return this.navItems.find((x) => x.id === this.activeSectionId);
  }

  isActive(item: MenuNavItem): boolean {
    return this.activeSectionId === item.id;
  }

  navigate(item: MenuNavItem): void {
    this.router.navigate([item.route]);
  }

  save(): void {
    this.state.save().subscribe();
  }

  private syncFromUrl(url: string): void {
    const match = this.navItems.find((item) => url.includes(item.id));
    if (match) {
      this.activeSectionId = match.id;
      this.pageTitle = match.label;
    }
  }
}
