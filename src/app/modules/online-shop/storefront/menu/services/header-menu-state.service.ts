import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  OnlineShopHeaderMenu,
  OnlineShopHeaderMenuForEdit,
  ProductCategoryOption,
} from '../models/header-menu.models';

@Injectable()
export class HeaderMenuStateService {
  readonly form: FormGroup;
  private readonly categoriesSubject = new BehaviorSubject<ProductCategoryOption[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly savingSubject = new BehaviorSubject<boolean>(false);
  private loaded = false;

  readonly categories$ = this.categoriesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly saving$ = this.savingSubject.asObservable();

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({
      id: [null],
      customStoreId: [null],
      headerDropdown1ProductGroupId: [null],
      headerDropdown2ProductGroupId: [null],
      headerDropdown3ProductGroupId: [null],
      headerDropdown4ProductGroupId: [null],
    });
  }

  get categories(): ProductCategoryOption[] {
    return this.categoriesSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get saving(): boolean {
    return this.savingSubject.value;
  }

  ensureLoaded(): void {
    if (!this.loaded && !this.loading) {
      this.load();
    }
  }

  load(): void {
    this.loadingSubject.next(true);
    this.restService.get(environment.urls.HeaderMenu_GetForEdit).subscribe({
      next: (response) => {
        this.loadingSubject.next(false);
        if (response?.result) {
          this.applyResponse(this.normalizeForEdit(response.result));
          this.loaded = true;
        }
      },
      error: () => {
        this.loadingSubject.next(false);
        this.toastr.error(this.translate.instant('Failed to load header menu'));
      },
    });
  }

  save(): Observable<boolean> {
    return new Observable((observer) => {
      const payload = { menu: this.buildPayload() };
      this.savingSubject.next(true);
      this.restService.postWithOutSpinner(environment.urls.HeaderMenu_Save, payload).subscribe({
        next: () => {
          this.savingSubject.next(false);
          this.toastr.success(this.translate.instant('Header menu saved successfully'));
          this.load();
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          this.savingSubject.next(false);
          const message =
            err?.error?.error?.message ||
            this.translate.instant('Failed to save header menu');
          this.toastr.error(message);
          observer.next(false);
          observer.complete();
        },
      });
    });
  }

  getSelectedCategoryName(controlName: string): string {
    const id = this.form.get(controlName)?.value;
    if (!id) {
      return '';
    }
    return this.categories.find((c) => c.id === id)?.name || '';
  }

  private applyResponse(data: OnlineShopHeaderMenuForEdit): void {
    this.categoriesSubject.next(data.categories || []);
    const m = data.menu;
    this.form.patchValue({
      id: m.id || null,
      customStoreId: m.customStoreId || null,
      headerDropdown1ProductGroupId: m.headerDropdown1ProductGroupId || null,
      headerDropdown2ProductGroupId: m.headerDropdown2ProductGroupId || null,
      headerDropdown3ProductGroupId: m.headerDropdown3ProductGroupId || null,
      headerDropdown4ProductGroupId: m.headerDropdown4ProductGroupId || null,
    });
  }

  private buildPayload(): OnlineShopHeaderMenu {
    const v = this.form.getRawValue();
    return {
      id: v.id || undefined,
      customStoreId: v.customStoreId || undefined,
      headerDropdown1ProductGroupId: this.normalizeCategoryId(v.headerDropdown1ProductGroupId),
      headerDropdown2ProductGroupId: this.normalizeCategoryId(v.headerDropdown2ProductGroupId),
      headerDropdown3ProductGroupId: this.normalizeCategoryId(v.headerDropdown3ProductGroupId),
      headerDropdown4ProductGroupId: this.normalizeCategoryId(v.headerDropdown4ProductGroupId),
    };
  }

  private normalizeCategoryId(value: unknown): string | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    return String(value);
  }

  private normalizeForEdit(raw: Record<string, unknown>): OnlineShopHeaderMenuForEdit {
    const categoriesRaw = (raw.categories || raw.Categories) as Record<string, unknown>[] | undefined;
    const menuRaw = (raw.menu || raw.Menu || {}) as Record<string, unknown>;

    return {
      categories: (categoriesRaw || []).map((c) => ({
        id: String(c.id ?? c.Id ?? ''),
        name: String(c.name ?? c.Name ?? ''),
      })),
      menu: {
        id: (menuRaw.id || menuRaw.Id) as string,
        customStoreId: (menuRaw.customStoreId || menuRaw.CustomStoreId) as string,
        headerDropdown1ProductGroupId: (menuRaw.headerDropdown1ProductGroupId ||
          menuRaw.HeaderDropdown1ProductGroupId) as string,
        headerDropdown2ProductGroupId: (menuRaw.headerDropdown2ProductGroupId ||
          menuRaw.HeaderDropdown2ProductGroupId) as string,
        headerDropdown3ProductGroupId: (menuRaw.headerDropdown3ProductGroupId ||
          menuRaw.HeaderDropdown3ProductGroupId) as string,
        headerDropdown4ProductGroupId: (menuRaw.headerDropdown4ProductGroupId ||
          menuRaw.HeaderDropdown4ProductGroupId) as string,
      },
    };
  }
}
