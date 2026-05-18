import { Injectable } from '@angular/core';
import { LocalStoreService } from './local-store.service';
import { log } from 'console';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { PermissionService } from './permission.service';
import { PermissionsEnum } from '../enum/Permissions';



@Injectable({
  providedIn: 'root'
})
export class GlobalDataService {
constructor(private store: LocalStoreService,
  private permissionService: PermissionService,
) { }




  images = [
  //   { url: '../../../../../assets/images/bg1.png', delay: '0s' },
  //   { url: '../../../../../assets/images/bg2.png', delay: '5s' },
  //  { url: '../../../../../assets/images/bg3.png', delay: '10s' },
  //   { url: '../../../../../assets/images/bg4.png', delay: '15s' }
  ];

    setBackgroundImagesOnTheLogInPage(){
      let tempImages = [];
      
      var bg1 = this.getbackgroundImage1Picture();
      var backgroundImage1PictureUrl = {} as backgroundPictures;
      backgroundImage1PictureUrl.url = bg1;
      backgroundImage1PictureUrl.delay = '0s';
      tempImages.push(backgroundImage1PictureUrl);
  
      var bg2 = this.getbackgroundImage2Picture();
      var backgroundImage2PictureUrl = {} as backgroundPictures;
      backgroundImage2PictureUrl.url = bg2;
      backgroundImage2PictureUrl.delay = '5s';
      tempImages.push(backgroundImage2PictureUrl);
  
      var bg3 = this.getbackgroundImage3Picture();
      var backgroundImage3PictureUrl = {} as backgroundPictures;
      backgroundImage3PictureUrl.url = bg3;
      backgroundImage3PictureUrl.delay = '10s';
      tempImages.push(backgroundImage3PictureUrl);
      
      var bg4 = this.getbackgroundImage4Picture();
      var backgroundImage4PictureUrl = {} as backgroundPictures;
      backgroundImage4PictureUrl.url = bg4;
      backgroundImage4PictureUrl.delay = '15s';
      tempImages.push(backgroundImage4PictureUrl);


      this.images = [...tempImages];
    }


getdir(){
 return this.store?.getItem("dir"); 
}

getCurrencySymbol(){
  let setting = this.store.getItem("setting");
  return setting?.currencySymbol
}

getAppName(){
  let setting = this.store.getItem("setting");
  return setting?.appName
}

getCopyright(){
  let setting = this.store.getItem("setting");
  return setting?.copyright
}

getCurrentTanantName(){
  let tenantName=this.store?.getItem("tenantName");
  
  return tenantName;
}

getCurrentTanantId(){
  let tenantId=this.store?.getItem("tenantId");
  return tenantId;
}
getLogoPicture(){
  let logo=this.store?.getItem("logoPicture");
  return logo;
}

getLoaderPicture(){
  let loaderlogo=this.store?.getItem("loaderPicture");
  return loaderlogo;
}

getbackgroundImage1Picture(){
  let bg1=this.store?.getItem("backgroundImage1PictureUrl");
  return bg1;
}

getbackgroundImage2Picture(){
  let bg2=this.store?.getItem("backgroundImage2PictureUrl");
  return bg2;
}

getbackgroundImage3Picture(){
  let bg3=this.store?.getItem("backgroundImage3PictureUrl");
  return bg3;
}

getbackgroundImage4Picture(){
  let bg4=this.store?.getItem("backgroundImage4PictureUrl");
  return bg4;
}


getTenantSettings(){
  let tenantSettings=this.store?.getItem("tenantSettings");
  return tenantSettings;
}


getTodayFormatedDate()
{
  const today = new Date();
  const year = today.getFullYear().toString(); // Get the last two digits of the year
  const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Add leading zero if needed
  const day = today.getDate().toString().padStart(2, "0"); // Add leading zero if needed
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

getCurrentFormatedDateInUTC()
{
  
  const today = new Date();
  const dateInUTC = moment(today, 'YYYY-MM-DD')
  .utc()
  .format('YYYY-MM-DD');
  
  return dateInUTC;
}

setTenantName(name: string) {
  this.store?.setItem('tenantName', name);
}

setTenantId(id: number) {
  this.store?.setItem('tenantId', id.toString());
}


preventTyping(event: KeyboardEvent) {
  event.preventDefault();
}

getFormatedSelectedDate(selectDate:any)
{
  const today = selectDate;
  const year = today.getFullYear().toString(); // Get the last two digits of the year
  const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Add leading zero if needed
  const day = today.getDate().toString().padStart(2, "0"); // Add leading zero if needed
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}


  isPermitted(_permission){
    // Permissions disabled on frontend for now.
    // return this.permissionService.isPermitted(permission);
    return true;
  }

  get permissions(){
      return PermissionsEnum;
    }

}


export interface backgroundPictures{
  url:string;
  delay:string;
}