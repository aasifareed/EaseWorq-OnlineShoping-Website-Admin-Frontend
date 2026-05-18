import { Injectable } from '@angular/core';
import { IOption } from 'ng-select';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { LocalStoreService } from './local-store.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CustomUserStoreService {

  allowMultipleStores = true;

  selectedUserStore:any;
  customeStores;
  defaultStoreId:any;

  _selectedStoreIds;
  get selectedStore() {
    return this._selectedStoreIds;
  };

  // set selectedStore(value) {    
  //   this._selectedStoreIds = value;
  //   if (value) {
  //     this.selectedUserStore = value;
  //   }
  // }

  private _selectedStoreSubject = new BehaviorSubject<any>(null);
  selectedStore$ = this._selectedStoreSubject.asObservable();

  set selectedStore(value) {
    
        this._selectedStoreIds = value;
        this._selectedStoreSubject.next(value);

    if (value) {
      this.selectedUserStore = value;
    }
  }

  // set selectedStore(value) {    
  //   
  //   const currentUrl = this.router.url;
  //   if(currentUrl.includes("make-sales") || currentUrl.includes("purchase-order")){
  //     
  //     if(Array.isArray(value) && value.length > 1){
  //       this._selectedStoreIds = [];
  //       this.selectedUserStore = [];
  //     }
  //     else{
  //       this._selectedStoreIds = value;
  //       if (value) {
  //         this.selectedUserStore = value;
  //       }
  //     }
  //   }
  //   else{
  //     this._selectedStoreIds = value;
  //     if (value) {
  //       this.selectedUserStore = value;
  //     }
  //   }

  // }



constructor(
  private restService: RestService,
  private authService: AuthService,
  private store: LocalStoreService,
  private router: Router,
  ) {
  }

getUserStores(): void {
  this.customeStores = [];
  const userid = this.authService.getuserId();
  this.customeStores = new Array<IOption>();
  const url = `${environment.urls.get_User_Store_By_UserId}?userId=${userid}`;

  this.restService.get(url).subscribe(
    (data) => {
      if (data && data.result && data.result.length > 0) {
        this.customeStores.length = 0;
        data.result.forEach((store: { id: number; name: string }) => {
          this.customeStores.push({ value: store.id, label: store.name });
        });
      }
    }
  );
}

// getSelectedStoreIds(){
//   var storeIds = [];
  
//   if (Array.isArray(this.selectedUserStore)) {
//     storeIds = this.selectedUserStore;
//   } else {
//     // If selectedUserStore is not an array, treat it as a single item and put it into an array
//     storeIds = [this.selectedUserStore];
//   }
//   return storeIds;
// }

getDefaultStoreId(){
  var defaultStoreId = [this.store.getItem("defaultStoreId")];
  return defaultStoreId;
}


}
