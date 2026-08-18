import { HttpResponseBase } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { LocalStoreService } from './local-store.service';
import { NavigationService } from './navigation.service';
import { PermissionService } from './permission.service';
import { RestService } from './rest.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomUserStoreService } from './custom-user-store.service';
import { GlobalDataService } from './globalData.service';
import { ToastrService } from 'ngx-toastr';
import { GetSharedDataService } from './get-shared-data.service';
import { SignalRService } from './signal-r.service';
import { ChatHubService } from './chat-hub.service';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  currentUser;
  constructor(
    private authService: AuthService,
    private restService: RestService,
    private permissionService: PermissionService,
    private store: LocalStoreService,
    private router: Router,
    private navigationService:NavigationService,
    public _customUserStoreService:CustomUserStoreService,
    public globalDataService:GlobalDataService,
    public toaster: ToastrService,
    public getSharedDataService: GetSharedDataService,
    private signalRService: SignalRService,
    private chatHubService: ChatHubService
  ) {

  }

  getUser(): Observable<any> {
    const userId = this.authService.getuserId();
    return this.restService.getWithoutLoader(`${environment.urls.USER_GETBYID}?id=${userId}`).pipe(
      switchMap((response) => {
        this.currentUser = response.result;
        this.navigationService.currentUser = this.currentUser;
        this.permissionService.storePermissions(response.result.permissions);

        this.store.setItem('currentUser', response.result);
        this.store.setItem('permissions', response.result.permissions);
        this.store.setItem('defaultStoreId', response.result?.defaultStoreId);

        return this._customUserStoreService.loadUserStores().pipe(
          map((hasStore) => {
            if (!hasStore) {
              this.router.navigateByUrl('/store-not-found');
              return response;
            }

            const defaultStoreId = this._customUserStoreService.isEmptyGuid(response.result?.defaultStoreId)
              ? this._customUserStoreService.customeStores[0]?.value
              : response.result?.defaultStoreId;

            this._customUserStoreService.defaultStoreId = defaultStoreId;
            this._customUserStoreService.selectedStore = defaultStoreId;
            this.navigationService.resetMenu();
            return response;
          }),
        );
      }),
    );
  }


    isInRole(role: string) {
    if (this.currentUser) {
      return this.currentUser.roleNames.includes(role.toUpperCase())
    }
    else {
      return false;
    }
  }
signout() {
  this.performSignout();
}




   performSignout() {
  const tenantId = this.globalDataService.getCurrentTanantId();
  const tenantName = this.globalDataService.getCurrentTanantName();
  const lang = localStorage.getItem('lang');

  this.signalRService.disconnectOnLogout();
  this.chatHubService.disconnectOnLogout();

  this.authService.authenticated = false;
  this.currentUser = undefined;
  this.store.setItem("uis_login_status", false);
  localStorage.setItem('lang', lang);
  this.store.setItem("tenantName", tenantName);
  this.store.setItem("tenantId", tenantId);

  
  this.store.removeItem("allLookupsDatabyLanguage");
  this.getSharedDataService.lookupsCache$ = null;

  this.router.navigateByUrl("/sessions/signin");
}

 


}
