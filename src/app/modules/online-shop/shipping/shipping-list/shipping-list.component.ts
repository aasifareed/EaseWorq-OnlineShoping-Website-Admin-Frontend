import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { SelectCountryModalComponent } from '../select-country-modal/select-country-modal.component';
import { ShippingCountryListItem } from '../models/shipping.models';
import { ShippingStateService } from '../shipping-state.service';

@Component({
  selector: 'app-shipping-list',
  templateUrl: './shipping-list.component.html',
  styleUrls: ['./shipping-list.component.scss'],
})
export class ShippingListComponent implements OnInit {
  countries: ShippingCountryListItem[] = [];
  loading = true;

  constructor(
    private restService: RestService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
    private shippingState: ShippingStateService,
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  editCountry(country: ShippingCountryListItem): void {
    this.shippingState.openRulesTab(country.id, country.countryName);
  }

  loadCountries(): void {
    this.loading = true;
    this.restService.get(environment.urls.Shipping_GetAllCountries).subscribe({
      next: (res) => {
        this.countries = this.mapCountryList(res.result);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
          this.loadCountries();
        }
      },
      () => {},
    );
  }

  deleteCountry(country: ShippingCountryListItem): void {
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

  private mapCountryList(items: any[]): ShippingCountryListItem[] {
    return (items || []).map((x) => ({
      id: x.id ?? x.Id,
      countryName: x.countryName ?? x.CountryName,
      countryCode: x.countryCode ?? x.CountryCode,
      isActive: x.isActive ?? x.IsActive,
      ruleCount: x.ruleCount ?? x.RuleCount ?? 0,
    }));
  }
}
