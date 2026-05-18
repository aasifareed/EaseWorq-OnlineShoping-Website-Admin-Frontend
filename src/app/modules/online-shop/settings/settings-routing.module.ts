import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsShellComponent } from './settings-shell.component';

const routes: Routes = [
  { path: '', redirectTo: 'store-information', pathMatch: 'full' },
  { path: 'store-information', component: SettingsShellComponent },
  { path: 'storefront', component: SettingsShellComponent },
  { path: 'delivery', component: SettingsShellComponent },
  { path: 'payment', component: SettingsShellComponent },
  { path: 'invoice', component: SettingsShellComponent },
  { path: 'seo', component: SettingsShellComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
