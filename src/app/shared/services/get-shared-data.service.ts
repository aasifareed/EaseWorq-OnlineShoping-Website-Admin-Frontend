import { Injectable } from "@angular/core";
import { RestService } from "./rest.service";
import { environment } from "src/environments/environment";
import { LocalStoreService } from "./local-store.service";
import { Observable, BehaviorSubject, of } from "rxjs";
import { LookUpsEntityItemNames } from "../enum/LookUpsEntityItemNames.enum";
import { tap, map, shareReplay, switchMap, take } from "rxjs/operators";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: "root",
})
export class GetSharedDataService {
  public LookUpsEntityItemNameEnum = LookUpsEntityItemNames;
  private currentLanguageId: string = "";
  public lookupsCache$: Observable<any> | null = null;

  constructor(
    private restService: RestService,
    private store: LocalStoreService,
    private translate: TranslateService
  ) {
    // Subscribe to language changes
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.store.removeItem("allLookupsDatabyLanguage");
      this.currentLanguageId = this.store.getItem("currentLanguageId");
      this.lookupsCache$ = null; // Reset cache when language changes
    });
  }

  private fetchLookups(): Observable<any> {
    if (!this.lookupsCache$ && this.currentLanguageId) {
      this.lookupsCache$ = this.restService
        .get(
          `${environment.urls.Get_All_LookUps_Dropdown}?languageId=${this.currentLanguageId}`
        )
        .pipe(
          tap((response: any) => {
            this.store.setItem("allLookupsDatabyLanguage", response.result);
          }),
          shareReplay(1)
        );
    }
    return this.lookupsCache$;
  }

  GetAllLookUpsDropdown(
    lookUpEntityName: string,
    storeId?: string | string[]
  ): Observable<any> {
    
    this.currentLanguageId = this.store.getItem("currentLanguageId");

    const storageKey = "allLookupsDatabyLanguage";

    // Handle storeId if it's an array
const storeIdToUse = !storeId || (typeof storeId === 'string' && storeId.trim() === '')
  ? []
  : Array.isArray(storeId)
    ? storeId
    : [storeId];

    // Check if data exists in local storage
    const cachedData = this.store.getItem(storageKey);
    if (cachedData) {
      // If data exists, filter by lookUpEntityName and storeId
      const filteredData = cachedData.filter(
        (item: any) =>
          item.lookUpEntityName === lookUpEntityName &&
          (storeIdToUse.length > 0
            ? storeIdToUse.includes(item.storeId)
            : item.storeId === null)
      );

      return new Observable((observer) => {
        observer.next({ result: filteredData });
        observer.complete();
      });
    }

    if (this.currentLanguageId) {
      // If not in cache, use shared observable
      return this.fetchLookups().pipe(
        map((response: any) => {
          const filteredData = response.result.filter(
            (item: any) =>
              item.lookUpEntityName === lookUpEntityName &&
              (storeIdToUse.length > 0
                ? storeIdToUse.includes(item.storeId)
                : item.storeId === null)
          );

          return { result: filteredData };
        })
      );
    } else {
      return new Observable((observer) => {
        observer.next({ result: [] });
        observer.complete();
      });
    }
  }
}
