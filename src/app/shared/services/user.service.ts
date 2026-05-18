import { HttpResponseBase } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
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
    private signalRService: SignalRService
  ) {

  }

  getUser(): Observable<any> {
    // if (this.currentUser) {
    //  return of(this.currentUser);
    // }
    //   else
      {
        
        let userId = this.authService.getuserId();
        return this.restService.getWithoutLoader(`${environment.urls.USER_GETBYID}?id=${userId}`).map(response => {
           
          this.currentUser = response.result;
          this.navigationService.currentUser = this.currentUser;
          this.permissionService.storePermissions(response.result.permissions);
          
          

          this.store.setItem('currentUser', response.result);
          
          this.store.setItem('permissions', response.result.permissions);
          

        //const translationsData = { HELLO: 'Hello World' };        
        // Populate translationsData object from the translationsList
        //this.translate.setTranslation('en', translationsData);
        //this.translate.setDefaultLang('en');

        this.store.setItem('defaultStoreId', response.result?.defaultStoreId);

        
        this._customUserStoreService.getUserStores();
        this._customUserStoreService.defaultStoreId = response.result?.defaultStoreId;
        this._customUserStoreService.selectedStore = response.result?.defaultStoreId;

        this.navigationService.resetMenu();
        return response
      })
    }
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
