import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
// import { UserListComponent } from './user/user-list/user-list.component'; // Commented out - component doesn't exist

const routes: Routes = [
    {
        path: 'profile',
        component: UserProfileComponent
    }
    // Commented out - UserListComponent doesn't exist
    // {
    //   path: 'user-list',
    //   component: UserListComponent
    // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
