import { Injectable } from '@angular/core';
import { IsTenantAvailableInput, TenantConfigurationInputDto } from 'src/app/SiteNotAvailable/IsTenantAvailableInput';
import { GlobalDataService } from './globalData.service';
import { RestService } from './rest.service';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LocalStoreService } from './local-store.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TenantService {

  loadingIndicator: boolean = true;

constructor(
  public globalDataService:GlobalDataService,
  private restService: RestService,
  private store: LocalStoreService,
  private translate: TranslateService,
  private http: HttpClient) { }




public isTenantAvailableInput={} as IsTenantAvailableInput;

checkTenantAvailability(tenantName: string): Observable<boolean> {
  this.isTenantAvailableInput.tenancyName = tenantName;

  return this.restService.post(`${environment.urls.Is_Tenant_Available}`, this.isTenantAvailableInput).pipe(
    map((response: any) => {
      
      if (response.success && response.result.tenantId != null) {
        this.store.setItem("tenantName",tenantName);
        this.store.setItem("tenantId",response.result.tenantId);
        return true;
      } else {
        return false;
      }
    }),
    catchError(() => {
      return of(false);
    })
  );

}


public isTenantAvailableInputOauth={} as TenantConfigurationInputDto;

checkTenantAvailabilityOauth(config: TenantConfigurationInputDto): Observable<any> {
    
  this.isTenantAvailableInputOauth.tenancyName = config.tenancyName;
  this.isTenantAvailableInputOauth.storeName = config.storeName;
  this.isTenantAvailableInputOauth.userNameOrEmailAddress = config.userNameOrEmailAddress;
  this.isTenantAvailableInputOauth.password = config.password;

  return this.restService.checkTenant(this.isTenantAvailableInputOauth).pipe(
    map((response: any) => {
         
      // Check the nested response structure
      if (response.success && response.result && response.result.success && response.result.result && response.result.result.tenantId != null) {
        this.store.setItem("tenantName",config.tenancyName);
        this.store.setItem("tenantId",response.result.result.tenantId);
        return response;
      } else {
        return response;
      }
    }),
    catchError((error) => {
      return of(error);
    })
  );
}

getTenanetSettings(){
  
  var tenantId= this.globalDataService.getCurrentTanantId();
  if(tenantId==null){
   tenantId=1;
  }
   this.restService.get(`${environment.urls.Get_Setting_By_TenantId}?tenantId=${tenantId}`).subscribe((response: any) => {
         
               
            if(response.result){
                              // Clear existing storage items
                    // Remove only specific items by setting them to null or an empty string
                    this.store.setItem("tenantSettings", null);
                    this.store.setItem("dir", null);
                    this.store.setItem("setting", null);
                    this.store.setItem("languages", null);
                    this.store.setItem("currentLanguageId", null);
                    this.store.setItem("defaultLanguage", null);
                    this.store.setItem("languageTexts", null);
                    this.store.setItem("logoPicture", null);
                    this.store.setItem("loaderPicture", null);
                    this.store.setItem("backgroundImage1PictureUrl", null);
                    this.store.setItem("backgroundImage2PictureUrl", null);
                    this.store.setItem("backgroundImage3PictureUrl", null);
                    this.store.setItem("backgroundImage4PictureUrl", null);
            }


         this.store.setItem("tenantSettings",response.result);
         const translationsData = {};  
         response.result.languageTexts.forEach(translationText => {
             translationsData[translationText.key] = translationText.value;
         });
 
         this.translate.setTranslation(response.result?.setting?.defaultLanguage, translationsData);
         this.translate.setDefaultLang(response.result?.setting?.defaultLanguage);
 
          
         var rtl=response.result.languages.find(x=>x.name==response.result?.setting?.defaultLanguage).rtl;
         var languageDisplayName=response.result.languages.find(x=>x.name==response.result?.setting?.defaultLanguage).displayName;
         if(rtl==true){
           this.store.setItem("dir","rtl"); 
           document.getElementsByTagName("html")[0].setAttribute('lang', response.result?.setting?.defaultLanguage);
           document.getElementsByTagName("body")[0].setAttribute('dir', 'rtl');
          // this.virtualKeyBoardService.setKeyboardLanguageLouts(languageDisplayName.toLowerCase());
         }else{
           this.store.setItem("dir","ltr"); 
           document.getElementsByTagName("html")[0].setAttribute('lang', response.result?.setting?.defaultLanguage);
           document.getElementsByTagName("body")[0].setAttribute('dir', 'ltr');
          // this.virtualKeyBoardService.setKeyboardLanguageLouts(languageDisplayName.toLowerCase());
         }
               
         this.store.setItem('setting', response?.result?.setting);
         this.store.setItem('languages', response.result.languages);
         
         this.store.setItem('defaultLanguage', response.result?.setting?.defaultLanguage);

         const getDefaultLanguageId = response.result.languages.find(x => x.name == response.result?.setting?.defaultLanguage).id;
         this.store.setItem('currentLanguageId', getDefaultLanguageId.toString());
         //this.translate.use(response.result?.setting?.defaultLanguage);

         this.store.setItem('languageTexts', translationsData);
         this.store.setItem('logoPicture', response.result?.setting?.logoPictureUrl);
         this.store.setItem('loaderPicture', response.result?.setting?.loaderPictureUrl);
         
         
         this.store.setItem('backgroundImage1PictureUrl', response.result?.setting?.backgroundImage1PictureUrl);
         this.store.setItem('backgroundImage2PictureUrl', response.result?.setting?.backgroundImage2PictureUrl);
         this.store.setItem('backgroundImage3PictureUrl', response.result?.setting?.backgroundImage3PictureUrl);
         this.store.setItem('backgroundImage4PictureUrl', response.result?.setting?.backgroundImage4PictureUrl);
          
         this.globalDataService.setBackgroundImagesOnTheLogInPage();
     });

 }



 setLocalTenanetSettings(result:any){
    

  const translationsData = {};  
    result.languageTexts.forEach(translationText => {
        translationsData[translationText.key] = translationText.value;
    });

    this.translate.setTranslation(result?.setting?.defaultLanguage, translationsData);
    this.translate.setDefaultLang(result?.setting?.defaultLanguage);

    var rtl=result.languages.find(x=>x.name==result?.setting?.defaultLanguage).rtl;
    var languageDisplayName=result.languages.find(x=>x.name==result?.setting?.defaultLanguage).displayName;
    if(rtl==true){
      document.getElementsByTagName("html")[0].setAttribute('lang', result?.setting?.defaultLanguage);
      document.getElementsByTagName("body")[0].setAttribute('dir', 'rtl');
    }else{
      document.getElementsByTagName("html")[0].setAttribute('lang', result?.setting?.defaultLanguage);
      document.getElementsByTagName("body")[0].setAttribute('dir', 'ltr');
    }                

this.globalDataService.setBackgroundImagesOnTheLogInPage();
}



}

