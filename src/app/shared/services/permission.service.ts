import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private myPermissions = [];
  constructor() { }

  storePermissions(permissions) {
    this.myPermissions = permissions
  }

  isPermitted(permission) {
    // Permissions disabled on frontend for now — re-enable when requirements are defined.
    // if (this.myPermissions) {
    //   return this.myPermissions.includes(permission);
    // }
    // return false;
    return true;
  }
}
