import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LocalStoreService } from './local-store.service';
import { PermissionService } from './permission.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomUserStoreService } from './custom-user-store.service';
import { GlobalDataService } from './globalData.service';
//import { KeyBoardComponent } from 'src/app/modules/point-of-sale/make-sales/components/Key-board/Key-board.component';

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
    public _customUserStoreService:CustomUserStoreService,
   // public keyboard: KeyBoardComponent,
  ) { }

  canActivate() {
    if (this.auth.authenticated) {
      
     var permissions= this.store.getItem("permissions");
     this.permissionService.storePermissions(permissions)

     var setting= this.store.getItem("setting");
     var languages= this.store.getItem("languages");
     var defaultLanguage=this.store.getItem("defaultLanguage");
     var translationsData = this.store.getItem("languageTexts");


     var defaultStoreId = this.store.getItem("defaultStoreId");
        this._customUserStoreService.getUserStores();
        this._customUserStoreService.defaultStoreId = defaultStoreId;
        this._customUserStoreService.selectedStore = defaultStoreId;
  
      this.translate.setTranslation(defaultLanguage, translationsData);
      this.translate.setDefaultLang(defaultLanguage);
       
      if(languages)
        {
          if(defaultLanguage !=null){
            var rtl=languages.find(x=>x.name==defaultLanguage).rtl;
            var languageDisplayName=languages.find(x=>x.name==defaultLanguage).displayName;
            
            if(rtl==true){
              this.store.setItem("dir","rtl"); 
              document.getElementsByTagName("html")[0].setAttribute('lang', defaultLanguage);
              document.getElementsByTagName("body")[0].setAttribute('dir', 'rtl');
             // this.virtualKeyBoardService.setKeyboardLanguageLouts(languageDisplayName.toLowerCase());
            }else{
              this.store.setItem("dir","ltr"); 
              document.getElementsByTagName("html")[0].setAttribute('lang', defaultLanguage);
              document.getElementsByTagName("body")[0].setAttribute('dir', 'ltr');
             // this.virtualKeyBoardService.setKeyboardLanguageLouts(languageDisplayName.toLowerCase());
            }
           
          }
        }else{
          this.router.navigateByUrl('/sessions/signin');
        }


      return true;
    } else {
      this.router.navigateByUrl('/sessions/signin');
    }
  }
}
