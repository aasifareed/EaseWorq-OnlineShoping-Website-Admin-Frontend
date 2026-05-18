import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  ShippingCountryDetail,
  ShippingCountryListItem,
  ShippingRule,
} from './models/shipping.models';
import { SelectCountryModalComponent } from './select-country-modal/select-country-modal.component';
import { ShippingRuleModalComponent } from './shipping-rule-modal/shipping-rule-modal.component';

@Component({
  selector: 'app-shipping',
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.css'],
})
export class ShippingComponent implements OnInit {
  countries: ShippingCountryListItem[] = [];
  filteredCountries: ShippingCountryListItem[] = [];
  selectedCountry: ShippingCountryDetail | null = null;
  selectedCountryId: string | null = null;

  countriesLoading = true;
  rulesLoading = false;
  searchControl = new FormControl('');

  constructor(
    public globalDataService: GlobalDataService,
    private restService: RestService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.searchControl.valueChanges.pipe(debounceTime(200)).subscribe((value) => {
      this.applyCountryFilter(value);
    });
  }

  loadCountries(selectCountryId?: string): void {
    this.countriesLoading = true;
    this.restService.get(environment.urls.Shipping_GetAllCountries).subscribe({
      next: (res) => {
        this.countries = this.mapCountryList(res.result);
        this.applyCountryFilter(this.searchControl.value);
        this.countriesLoading = false;

        if (selectCountryId) {
          const found = this.countries.find((c) => c.id === selectCountryId);
          if (found) {
            this.selectCountry(found);
            return;
          }
        }

        if (this.selectedCountryId) {
          const stillExists = this.countries.some((c) => c.id === this.selectedCountryId);
          if (stillExists) {
            this.loadCountryDetail(this.selectedCountryId);
          } else {
            this.clearSelection();
          }
        }
      },
      error: () => {
        this.countriesLoading = false;
      },
    });
  }

  selectCountry(country: ShippingCountryListItem): void {
    if (this.selectedCountryId === country.id) {
      return;
    }
    this.selectedCountryId = country.id;
    this.loadCountryDetail(country.id);
  }

  clearSelection(): void {
    this.selectedCountryId = null;
    this.selectedCountry = null;
    this.rulesLoading = false;
  }

  openSelectCountryModal(): void {
    const modalRef = this.modalService.open(SelectCountryModalComponent, {
      size: 'md',
      backdrop: 'static',
      windowClass: 'addSectionModal selectCountryModal',
    });

    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.loadCountries(this.selectedCountryId);
        }
      },
      () => {},
    );
  }

  openAddRuleModal(rule?: ShippingRule): void {
    if (!this.selectedCountryId) {
      return;
    }

    const modalRef = this.modalService.open(ShippingRuleModalComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'addSectionModal shippingRuleModal',
    });
    modalRef.componentInstance.countryId = this.selectedCountryId;
    modalRef.componentInstance.rule = rule || null;

    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.loadCountryDetail(this.selectedCountryId);
          this.loadCountries();
        }
      },
      () => {},
    );
  }

  deleteCountry(country: ShippingCountryListItem, event?: Event): void {
    event?.stopPropagation();
    if (!confirm(this.translate.instant('Are you sure you want to delete this country?'))) {
      return;
    }

    this.restService
      .delete(`${environment.urls.Shipping_DeleteCountry}?id=${country.id}`)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant('Country removed.'),
            this.translate.instant('toaster_Heading_Success'),
            { progressBar: true },
          );
          if (this.selectedCountryId === country.id) {
            this.clearSelection();
          }
          this.loadCountries();
        },
        error: (error) => {
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  deleteRule(rule: ShippingRule): void {
    if (!confirm(this.translate.instant('Are you sure you want to delete this rule?'))) {
      return;
    }

    this.restService
      .delete(`${environment.urls.Shipping_DeleteRule}?id=${rule.id}`)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant('Rule deleted.'),
            this.translate.instant('toaster_Heading_Success'),
            { progressBar: true },
          );
          this.loadCountryDetail(this.selectedCountryId);
          this.loadCountries();
        },
        error: (error) => {
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  getRuleTypeLabel(ruleType: string): string {
    if (ruleType === 'base_on_price') {
      return 'Based on Price';
    }
    if (ruleType === 'base_on_weight') {
      return 'Based on Weight';
    }
    return ruleType;
  }

  getShippingTypeLabel(shippingType: string): string {
    if (shippingType === 'fixed') {
      return 'Fixed';
    }
    if (shippingType === 'percentage') {
      return 'Percentage';
    }
    if (shippingType === 'free') {
      return 'Free';
    }
    return shippingType;
  }

  formatAmount(rule: ShippingRule): string {
    if (rule.shippingType === 'free') {
      return '—';
    }
    if (rule.shippingType === 'percentage') {
      return `${rule.amount}%`;
    }
    return String(rule.amount);
  }

  private loadCountryDetail(countryId: string): void {
    this.rulesLoading = true;
    this.restService
      .get(`${environment.urls.Shipping_GetCountryForEdit}?id=${countryId}`)
      .subscribe({
        next: (res) => {
          this.selectedCountry = this.mapCountryDetail(res.result);
          this.rulesLoading = false;
        },
        error: () => {
          this.rulesLoading = false;
        },
      });
  }

  private applyCountryFilter(keyword: string): void {
    const term = (keyword || '').trim().toLowerCase();
    if (!term) {
      this.filteredCountries = [...this.countries];
      return;
    }
    this.filteredCountries = this.countries.filter(
      (c) =>
        c.countryName.toLowerCase().includes(term) ||
        c.countryCode.toLowerCase().includes(term),
    );
  }

  private mapCountryList(items: any[]): ShippingCountryListItem[] {
    return (items || []).map((x) => ({
      id: x.id ?? x.Id,
      countryName: x.countryName ?? x.CountryName,
      countryCode: x.countryCode ?? x.CountryCode,
      isActive: x.isActive ?? x.IsActive,
      ruleCount: x.ruleCount ?? x.RuleCount ?? 0,
    }));
  }

  private mapCountryDetail(data: any): ShippingCountryDetail {
    return {
      id: data.id ?? data.Id,
      countryName: data.countryName ?? data.CountryName,
      countryCode: data.countryCode ?? data.CountryCode,
      isActive: data.isActive ?? data.IsActive,
      shippingRules: (data.shippingRules ?? data.ShippingRules ?? []).map((r) => ({
        id: r.id ?? r.Id,
        onlineShopShippingCountryId:
          r.onlineShopShippingCountryId ?? r.OnlineShopShippingCountryId,
        name: r.name ?? r.Name,
        ruleType: r.ruleType ?? r.RuleType,
        min: r.min ?? r.Min,
        max: r.max ?? r.Max,
        shippingType: r.shippingType ?? r.ShippingType,
        amount: r.amount ?? r.Amount,
        isActive: r.isActive ?? r.IsActive,
      })),
    };
  }
}
