import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
// import { PermissionService } from './permission.service';
// import { PermissionsEnum } from '../enum/Permissions';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    // private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    // Route permission checks disabled for now — re-enable when requirements are defined.
    // let requiredPermission = next.data?.permission as PermissionsEnum;
    // if (!requiredPermission && next.parent) {
    //   requiredPermission = next.parent.data?.permission as PermissionsEnum;
    // }
    // if (!requiredPermission) {
    //   let parent = next.parent;
    //   while (parent && !requiredPermission) {
    //     requiredPermission = parent.data?.permission as PermissionsEnum;
    //     parent = parent.parent;
    //   }
    // }
    // if (!requiredPermission) {
    //   return true;
    // }
    // if (this.permissionService.isPermitted(requiredPermission)) {
    //   return true;
    // }
    // this.router.navigateByUrl('/sessions/signin');
    // return false;

    return true;
  }
}
