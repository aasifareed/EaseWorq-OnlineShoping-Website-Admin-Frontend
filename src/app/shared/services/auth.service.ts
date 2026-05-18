import { Injectable } from "@angular/core";
import { LocalStoreService } from "./local-store.service";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { RestService } from "./rest.service";
import { UrlHelperService } from "./url-helper.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import 'rxjs/add/operator/map'
import { environment } from "src/environments/environment";
import { RolesEnum } from "../enum/Roles";
import * as moment from "moment";
import { ToastrService } from "ngx-toastr";
import { LoaderService } from "./loader.service";
@Injectable({
  providedIn: "root"
})
export class AuthService {
  //Only for demo purpose
  authenticated = false;

  private superAdminRoles: string[] = [
    RolesEnum.DepartmentManager,
  ]


  constructor(
    private store: LocalStoreService,
    private router: Router,
    private urlHelper: UrlHelperService,
    private restService: RestService,
    private httpClient: HttpClient,
    private toastr: ToastrService,
    private loaderService: LoaderService,
    ) {
    this.checkAuth();
  }

  checkAuth() {
    
     this.authenticated = this.store.getItem("uis_login_status") && this.isLoggedIn();
   // this.authenticated = this.isLoggedIn();
  }

  public isLoggedIn() {
    return moment().isBefore(this.getExpiration());
  }

  getuser() {
    return this.store.getItem("firstName") + " " + this.store.getItem("lastName");
  }

  getcurrentUser() {
    return this.store.getItem('currentUser');
  }

  getcurrentUserProfilePicture() {
    
    var currentUser= this.store.getItem('currentUser');
    return currentUser?.userProfilePictureUrl;
    
  }

  getuserId() {
    return this.store.getItem("userId")
  }
  getuserRole() {
    return this.store.getItem("roleIds")
  }


  getAgencyId() {
    return this.store.getItem("agencyId")
  }

  signin(credentials) {
    const url = this.urlHelper.getUrl('oauth');
  
    const headers = new HttpHeaders().set('X-App-Request-Source', 'web-app');

    return this.httpClient.post(url, credentials, { headers }).map(
      (response) =>
      {
      
      let result = response['result'];
      Object.keys(result).forEach(key => {
        this.store.setItem(key, result[key]);
      });
      this.authenticated = true;
      this.store.setItem("uis_login_status", true);
      this.setSession(result['expireInSeconds'])
    })
    // return of({}).pipe(delay(1500));
  }
 
  impersonateSignin(payload) {
    const url = this.urlHelper.getUrl('impersonateOauth');

    const headers = new HttpHeaders().set('X-App-Request-Source', 'web-app');

    return this.httpClient.post(url, payload, { headers }).map((response) => {
      const result = response['result'];
      Object.keys(result).forEach(key => {
        this.store.setItem(key, result[key]);
      });
      this.authenticated = true;
      this.store.setItem("uis_login_status", true);
      this.setSession(result['expireInSeconds']);
    });
  }

  getToken() {
    return this.store.getItem('accessToken');
  }

  getEncryptedToken() {
    return this.store.getItem('encryptedAccessToken');
  }

  roles(): string[] {
    let arr = this.store.getItem('roleIds');
    if (arr) {
      //let roles = arr.split(",");
      // return roles;
    }
    return arr;
    // return [''];
  }


  isSuperAdmin(): boolean {
    let rolesMatched = this.roles().filter(value => -1 !== this.superAdminRoles.indexOf(value));
    if (rolesMatched.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }



  private setSession(expiresIn) {
    const expiresAt = moment().add(expiresIn, 'second');
    localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()));
  }

  getExpiration() {
    const expiration = localStorage.getItem("expires_at");
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }




  

}
