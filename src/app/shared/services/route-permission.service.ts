import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { PermissionService } from './permission.service';
// import { PermissionsEnum } from '../enum/Permissions';
// import { NavigationService } from './navigation.service';
// import { IMenuItem } from './navigation.service';

// interface RoutePermission {
//   path: string;
//   permission: PermissionsEnum;
// }

@Injectable({
  providedIn: 'root',
})
export class RoutePermissionService {
  // private allRoutePermissions: RoutePermission[] = [
  //   {
  //     path: '/online-shop/online-orders',
  //     permission: PermissionsEnum.OnlineOrderManagement,
  //   },
  //   {
  //     path: '/online-shop/order-status',
  //     permission: PermissionsEnum.OrderStatusType,
  //   },
  //   {
  //     path: '/online-shop/order-status/events',
  //     permission: PermissionsEnum.OrderStatusType,
  //   },
  // ];

  // private routePermissions: RoutePermission[] = [];

  private readonly defaultRoute = '/online-shop/online-orders';

  constructor(
    private router: Router,
    // private permissionService: PermissionService,
    // private navigationService: NavigationService
  ) {
    // this.filterRoutesBasedOnMenu();
  }

  // private filterRoutesBasedOnMenu(): void {
  //   const menu = this.navigationService.onlineShopMenu;
  //   if (!menu || menu.length === 0) {
  //     this.routePermissions = this.allRoutePermissions;
  //     return;
  //   }
  //   const disabledRoutes = new Set<string>();
  //   const collectDisabledRoutes = (menuItems: IMenuItem[]): void => {
  //     for (const item of menuItems) {
  //       if (item.disabled === true && item.state) {
  //         disabledRoutes.add(item.state);
  //       }
  //       if (item.sub?.length) {
  //         item.sub.forEach((subItem) => {
  //           if (subItem.state && item.disabled === true) {
  //             disabledRoutes.add(subItem.state);
  //           }
  //         });
  //       }
  //     }
  //   };
  //   collectDisabledRoutes(menu);
  //   this.routePermissions = this.allRoutePermissions.filter(
  //     (route) => !disabledRoutes.has(route.path)
  //   );
  // }

  getFirstAvailableRoute(): string | null {
    // for (const route of this.routePermissions) {
    //   if (this.permissionService.isPermitted(route.permission)) {
    //     return route.path;
    //   }
    // }
    // return null;
    return this.defaultRoute;
  }

  navigateToFirstAvailableRoute(): boolean {
    const route = this.getFirstAvailableRoute();
    if (route) {
      this.router.navigateByUrl(route);
      return true;
    }
    return false;
  }

  hasRoutePermission(_path: string): boolean {
    // const route = this.routePermissions.find((r) => r.path === path);
    // if (!route) {
    //   return false;
    // }
    // return this.permissionService.isPermitted(route.permission);
    return true;
  }
}
