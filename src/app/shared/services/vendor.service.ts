import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

constructor() { }

private isNewVendorAddedFromPurchaseProduct = new BehaviorSubject<boolean>(false);
isNewVendorAddedFromPurchaseProduct$ = this.isNewVendorAddedFromPurchaseProduct.asObservable();

setNewVendorStatusFromPurchaseProduct(status: boolean) {
  this.isNewVendorAddedFromPurchaseProduct.next(status);
}

}
