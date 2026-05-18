import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuShellComponent } from './menu/menu-shell.component';

const routes: Routes = [
  { path: '', redirectTo: 'dropdown-1', pathMatch: 'full' },
  { path: 'dropdown-1', component: MenuShellComponent },
  { path: 'dropdown-2', component: MenuShellComponent },
  { path: 'dropdown-3', component: MenuShellComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StorefrontRoutingModule {}
