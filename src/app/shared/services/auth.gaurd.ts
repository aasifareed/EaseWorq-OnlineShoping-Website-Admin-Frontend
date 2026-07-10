import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalStoreService } from './local-store.service';
import { PermissionService } from './permission.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomUserStoreService } from './custom-user-store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGaurd implements CanActivate {

  constructor(
    private translate: TranslateService,
    private router: Router,
    private auth: AuthService,
    private store: LocalStoreService,
    private permissionService: PermissionService,
    public _customUserStoreService: CustomUserStoreService,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    if (!this.auth.authenticated) {
      this.router.navigateByUrl('/sessions/signin');
      return false;
    }

    if (state.url.includes('store-not-found')) {
      return true;
    }

    const permissions = this.store.getItem('permissions');
    this.permissionService.storePermissions(permissions);

    const languages = this.store.getItem('languages');
    const defaultLanguage = this.store.getItem('defaultLanguage');
    const translationsData = this.store.getItem('languageTexts');

    if (!languages) {
      this.router.navigateByUrl('/sessions/signin');
      return false;
    }

    this.translate.setTranslation(defaultLanguage, translationsData);
    this.translate.setDefaultLang(defaultLanguage);

    if (defaultLanguage != null) {
      const language = languages.find((x) => x.name == defaultLanguage);
      const rtl = language?.rtl;
      if (rtl == true) {
        this.store.setItem('dir', 'rtl');
        document.getElementsByTagName('html')[0].setAttribute('lang', defaultLanguage);
        document.getElementsByTagName('body')[0].setAttribute('dir', 'rtl');
      } else {
        this.store.setItem('dir', 'ltr');
        document.getElementsByTagName('html')[0].setAttribute('lang', defaultLanguage);
        document.getElementsByTagName('body')[0].setAttribute('dir', 'ltr');
      }
    }

    return this._customUserStoreService.loadUserStores().pipe(
      map((hasStore) => {
        if (!hasStore) {
          this.router.navigateByUrl('/store-not-found');
          return false;
        }

        const defaultStoreId = this.store.getItem('defaultStoreId');
        const resolvedStoreId = this._customUserStoreService.isEmptyGuid(defaultStoreId)
          ? this._customUserStoreService.customeStores[0]?.value
          : defaultStoreId;

        this._customUserStoreService.defaultStoreId = resolvedStoreId;
        this._customUserStoreService.selectedStore = resolvedStoreId;
        return true;
      }),
    );
  }
}
