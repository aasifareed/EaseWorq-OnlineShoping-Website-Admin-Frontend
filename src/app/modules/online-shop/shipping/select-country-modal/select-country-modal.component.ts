import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { ShippingCountryOption } from '../models/shipping.models';

@Component({
  selector: 'app-select-country-modal',
  templateUrl: './select-country-modal.component.html',
  styleUrls: ['./select-country-modal.component.css'],
})
export class SelectCountryModalComponent implements OnInit {
  form: FormGroup;
  submitted = false;
  isLoading = false;
  availableCountries: ShippingCountryOption[] = [];
  selectedCountries: ShippingCountryOption[] = [];

  dropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'countryCode',
    textField: 'countryName',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 5,
    allowSearchFilter: true,
  };

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {
    this.form = this.fb.group({
      countries: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.dropdownSettings = {
      ...this.dropdownSettings,
      selectAllText: this.translate.instant('Select All'),
      unSelectAllText: this.translate.instant('UnSelect All'),
      searchPlaceholderText: this.translate.instant('Search'),
      noDataAvailablePlaceholderText: this.translate.instant('No data available'),
    };
    this.loadAvailableCountries();
  }

  loadAvailableCountries(): void {
    this.restService
      .getWithoutLoader(environment.urls.Shipping_GetAvailableCountries)
      .subscribe({
        next: (res) => {
          this.availableCountries = (res.result || []).map((x) => ({
            countryCode: x.countryCode ?? x.CountryCode,
            countryName: x.countryName ?? x.CountryName,
          }));
        },
      });
  }

  submit(): void {
    this.submitted = true;
    if (!this.selectedCountries?.length) {
      return;
    }

    const payload = {
      countries: this.selectedCountries.map((c) => ({
        countryCode: c.countryCode,
        countryName: c.countryName,
      })),
    };

    this.isLoading = true;
    this.restService
      .postWithOutSpinner(environment.urls.Shipping_CreateCountries, payload)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant('Countries added.'),
            this.translate.instant('toaster_Heading_Success'),
            { progressBar: true },
          );
          this.activeModal.close(true);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(
            this.translate.instant(error?.error?.error?.message ?? 'Error'),
            this.translate.instant('toaster_Heading_Error'),
            { progressBar: true },
          );
        },
      });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
