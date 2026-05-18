import { Routes, RouterModule } from '@angular/router';
import { OnlineShopComponent } from './online-shop.component';
import { NgModule } from '@angular/core';
import { AuthGaurd } from 'src/app/shared/services/auth.gaurd';
// import { PermissionGuard } from 'src/app/shared/services/PermissionGuard';
// import { PermissionsEnum } from 'src/app/shared/enum/Permissions';

const routes: Routes = [
  {
    path: '',
    component: OnlineShopComponent,
    children: [
      {
        path: '',
        redirectTo: 'online-orders',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'online-orders',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./online-orders/online-orders.module').then(
        (m) => m.OnlineOrdersModule
      ),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
  {
    path: 'order-status',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./order-status/order-status.module').then(
        (m) => m.OrderStatusModule
      ),
    // data: { permission: PermissionsEnum.OrderStatusType },
  },
  {
    path: 'shipping',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./shipping/shipping.module').then((m) => m.ShippingModule),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
  {
    path: 'coupons',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./coupons/coupons.module').then((m) => m.CouponsModule),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
  {
    path: 'pages',
    canActivate: [AuthGaurd],
    loadChildren: () => import('./pages/pages.module').then((m) => m.PagesModule),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
  {
    path: 'settings',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./settings/settings.module').then((m) => m.SettingsModule),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
  {
    path: 'storefront',
    canActivate: [AuthGaurd],
    loadChildren: () =>
      import('./storefront/storefront.module').then((m) => m.StorefrontModule),
    // data: { permission: PermissionsEnum.OnlineOrderManagement },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnlineShopRoutingModule {}
