import { Injectable } from '@angular/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { LocalStoreService } from './local-store.service';
import { Router } from '@angular/router';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

@Injectable({
  providedIn: 'root'
})
export class CustomUserStoreService {

  allowMultipleStores = false;
  storeSelectorDisabled = true;

  selectedUserStore: any;
  customeStores: IOption[] = [];
  defaultStoreId: any;

  _selectedStoreIds;
  get selectedStore() {
    return this._selectedStoreIds;
  }

  private _selectedStoreSubject = new BehaviorSubject<any>(null);
  selectedStore$ = this._selectedStoreSubject.asObservable();

  set selectedStore(value) {
    this._selectedStoreIds = value;
    this._selectedStoreSubject.next(value);

    if (value) {
      this.selectedUserStore = value;
    }
  }

  constructor(
    private restService: RestService,
    private authService: AuthService,
    private store: LocalStoreService,
    private router: Router,
  ) {
  }

  loadUserStores(): Observable<boolean> {
    this.customeStores = [];
    const userid = this.authService.getuserId();
    if (!userid) {
      return of(false);
    }

    const url = `${environment.urls.get_User_Store_By_UserId}?userId=${userid}`;

    return this.restService.get(url).pipe(
      map((data) => {
        this.customeStores = [];
        if (!data?.result?.length) {
          return false;
        }

        data.result.forEach((store: { id: string; name: string }) => {
          this.customeStores.push({ value: store.id, label: store.name });
        });

        const onlineStoreId = this.customeStores[0]?.value;
        if (!onlineStoreId) {
          return false;
        }

        this.selectedStore = onlineStoreId;
        this.defaultStoreId = onlineStoreId;
        this.store.setItem('defaultStoreId', onlineStoreId);
        return true;
      }),
    );
  }

  getUserStores(): void {
    this.loadUserStores().subscribe((hasStore) => {
      if (!hasStore && !this.router.url.includes('store-not-found')) {
        this.router.navigateByUrl('/store-not-found');
      }
    });
  }

  getDefaultStoreId() {
    const defaultStoreId = this.store.getItem('defaultStoreId');
    if (!defaultStoreId || defaultStoreId === EMPTY_GUID) {
      return this.customeStores[0]?.value ?? null;
    }
    return defaultStoreId;
  }

  hasOnlineStore(): boolean {
    return this.customeStores?.length > 0;
  }

  isEmptyGuid(value: string | null | undefined): boolean {
    return !value || value === EMPTY_GUID;
  }
}
