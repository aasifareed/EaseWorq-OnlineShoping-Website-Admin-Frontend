import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from './shared/components/layouts/auth-layout/auth-layout.component';
import { AuthGaurd } from './shared/services/auth.gaurd';
import { BlankLayoutComponent } from './shared/components/layouts/blank-layout/blank-layout.component';
import { AdminLayoutSidebarLargeComponent } from './shared/components/layouts/admin-layout-sidebar-large/admin-layout-sidebar-large.component';
import { SiteNotAvailableComponent } from './SiteNotAvailable/SiteNotAvailable.component';

const adminRoutes: Routes = [
  {
    path: 'online-shop',
    loadChildren: () => import('./modules/online-shop/online-shop.module').then(m => m.OnlineShopModule)
  },
];

const routes: Routes = [
  {
    path: '',
    redirectTo: 'online-shop',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'sessions',
        loadChildren: () => import('./modules/sessions/sessions.module').then(m => m.SessionsModule)
      }
    ]
  },
  // {
  //   path: '',
  //   component: HomepageCardComponent,
  //   children: [

  //     {
  //       path: 'dashboard-app',
  //       loadChildren: () => import('./views/others/others.module').then(m => m.OthersModule)
  //     },
  //   ]
  // },
  // {
  //   path: '',
  //   component: HomepageMapComponent,
  //   children: [

  //     {
  //       path: 'layouts',
  //       canActivate: [AuthGaurd],
  //       loadChildren: () => import('./views/others/others.module').then(m => m.OthersModule)
  //     },
  //   ]
  // },
  // {
  //   path: '',
  //   component: BlankLayoutComponent,
  //   children: [

  //     {
  //       path: 'others',
  //       loadChildren: () => import('./views/others/others.module').then(m => m.OthersModule)
  //     },

  //     // {
  //     //   path: 'dashboard-map',
  //     //   component: HomepageCardComponent
  //     // }
  //   ]
  // },
  {
    path: '',
    component: AdminLayoutSidebarLargeComponent,
    canActivate: [AuthGaurd],
    children: adminRoutes
  },

  {
    path: '**',
    redirectTo: 'others/404'
  },
  { path: 'site-not-available', component: SiteNotAvailableComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
