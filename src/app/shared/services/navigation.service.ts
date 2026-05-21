import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Apps, AppsLegacyPosForm } from '../enum/Apps';
// import { PermissionsEnum } from '../enum/Permissions';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';
import { LocalStoreService } from './local-store.service';

export interface IMenuItem {
  id?: string;
  title?: string;
  description?: string;
  type: string;
  name?: string;
  state?: string;
  icon?: string;
  icontType?: string;
  tooltip?: string;
  disabled?: boolean;
  sub?: IChildItem[];
  badges?: IBadge[];
  active?: boolean;
  permission_required?: string;
}

export interface IChildItem {
  id?: string;
  parentId?: string;
  type?: string;
  name: string;
  state?: string;
  icon?: string;
  icontType?: string;
  sub?: IChildItem[];
  active?: boolean;
  permission_required?: string;
}

interface IBadge {
  color: string;
  value: string;
}

interface ISidebarState {
  sidenavOpen?: boolean;
  childnavOpen?: boolean;
}

export enum InconsTypeEnum {
  ICons_Inconsmind,
  ICons_FontAwesome,
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly SELECTED_APP_KEY = 'selectedApp';

  public sidebarState: ISidebarState = {
    sidenavOpen: true,
    childnavOpen: false,
  };

  currentUser: any;
  selectedItem: IMenuItem;
  onlineShopMenu: IMenuItem[] = [];

  menuItems = new BehaviorSubject<IMenuItem[]>([]);
  menuItems$ = this.menuItems.asObservable();

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
    private localStore: LocalStoreService
  ) {
    this.initializeMenu();
    this.restoreSelectedApp();
  }

  private normalizeApp(app: Apps | number | null | undefined): Apps {
    if (app === null || app === undefined || app === AppsLegacyPosForm || app === 14) {
      return Apps.ONLINE_SHOP;
    }
    return app as Apps;
  }

  setApplication(app: Apps, isNavigate = true) {
    const normalizedApp = this.normalizeApp(app);
    this.localStore.setItem(this.SELECTED_APP_KEY, normalizedApp);
    this.menuItems.next(this.onlineShopMenu);

    if (isNavigate) {
      this.router.navigateByUrl('/online-shop/online-orders');
    }
  }

  private restoreSelectedApp(): void {
    let currentUrl = this.router.url;
    if (!currentUrl || currentUrl === '/' || currentUrl === '') {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        currentUrl = hash.substring(1);
      }
    }

    if (this.isValidCurrentRoute(currentUrl)) {
      this.menuItems.next(this.onlineShopMenu);
      return;
    }

    this.setApplication(Apps.ONLINE_SHOP, true);
  }

  private isValidCurrentRoute(url: string): boolean {
    if (!url) {
      return false;
    }

    const cleanUrl = url.replace(/^#/, '').replace(/^\//, '').trim();
    if (!cleanUrl || cleanUrl === 'online-shop' || cleanUrl.startsWith('sessions/signin')) {
      return false;
    }

    return cleanUrl.startsWith('online-shop/');
  }

  initializeMenu() {
    this.onlineShopMenu = [
      {
        name: 'Online Orders',
        title: 'Online Orders',
        type: 'link',
        icon: 'assets/images/online-shopping.png',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/online-orders',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
      {
        name: 'Order Status',
        title: 'Order Status',
        type: 'link',
        icon: 'fa fa-tags',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/order-status',
        // permission_required: PermissionsEnum.OrderStatusType,
      },
      {
        name: 'Shipping',
        title: 'Shipping',
        type: 'link',
        icon: 'fa fa-truck',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/shipping',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
      {
        name: 'Coupons',
        title: 'Coupons',
        type: 'link',
        icon: 'fa fa-ticket',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/coupons',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
      {
        name: 'Products',
        title: 'Products',
        type: 'link',
        icon: 'fa fa-cube',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/products',
      },
      {
        name: 'Pages',
        title: 'Pages',
        type: 'link',
        icon: 'fa-solid fa-file-lines',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/pages',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
      {
        name: 'Store Front',
        title: 'Store Front',
        type: 'link',
        icon: 'fa fa-store',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/storefront',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
      {
        name: 'Settings',
        title: 'Settings',
        type: 'link',
        icon: 'fa fa-cog',
        icontType: InconsTypeEnum.ICons_FontAwesome.toString(),
        state: '/online-shop/settings',
        // permission_required: PermissionsEnum.OnlineOrder,
      },
    ];

    this.menuItems.next(this.onlineShopMenu);
  }

  resetMenu() {
    this.initializeMenu();
  }

  canAccess(_item) {
    // Menu permission checks disabled for now.
    // if (item['permission_required']) {
    //   return this.permissionService.isPermitted(item['permission_required']);
    // }
    return true;
  }

  getAllowedMenu(menus): IMenuItem[] {
    // return menus.filter((menu) => {
    //   if (menu.type === 'dropDown') {
    //     menu.sub = menu.sub.filter((child) => this.canAccess(child));
    //   }
    //   return this.canAccess(menu);
    // });
    return menus;
  }
}
