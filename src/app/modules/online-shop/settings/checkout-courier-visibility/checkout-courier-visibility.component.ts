import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CheckoutCourierOption, CourierSelectionItem } from '../models/courier-setting.models';
import { CourierSettingsService } from '../services/courier-settings.service';

@Component({
  selector: 'app-checkout-courier-visibility',
  templateUrl: './checkout-courier-visibility.component.html',
  styleUrls: ['./checkout-courier-visibility.component.css'],
})
export class CheckoutCourierVisibilityComponent implements OnInit {
  couriers: CheckoutCourierOption[] = [];
  loading = false;
  saving = false;
  loadError: string | null = null;

  constructor(
    private courierSettingsService: CourierSettingsService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;

    this.courierSettingsService.getFlashipCouriersForAdmin().subscribe({
      next: (rows) => {
        this.couriers = rows.map((row) => ({
          courierName: row.courierName,
          courierCode: row.courierCode,
          isSelected: row.isSelected,
          selected: row.isSelected,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.couriers = [];
        this.loadError =
          err?.error?.error?.message
          || this.translate.instant('Failed to load Flaship courier list. Ensure Flaship is configured above.');
        this.toastr.error(this.loadError);
      },
    });
  }

  toggleCourier(courier: CheckoutCourierOption, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    courier.selected = checked;
    courier.isSelected = checked;
  }

  selectAll(): void {
    this.couriers.forEach((courier) => {
      courier.selected = true;
      courier.isSelected = true;
    });
  }

  clearAll(): void {
    this.couriers.forEach((courier) => {
      courier.selected = false;
      courier.isSelected = false;
    });
  }

  save(): void {
    const payload = this.buildPayload();

    if (!payload.length) {
      const confirmed = confirm(
        this.translate.instant(
          'No couriers are selected. Customers will see all available Flaship couriers at checkout. Continue?',
        ),
      );
      if (!confirmed) {
        return;
      }
    }

    this.saving = true;
    this.courierSettingsService.saveCourierSettings(payload).subscribe({
      next: () => {
        this.saving = false;
        this.couriers.forEach((courier) => {
          courier.isSelected = courier.selected;
        });
        this.toastr.success(
          this.translate.instant('Checkout courier visibility saved successfully'),
          this.translate.instant('Success'),
        );
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.error?.message
          || this.translate.instant('Failed to save checkout courier visibility');
        this.toastr.error(message);
      },
    });
  }

  get selectedCount(): number {
    return this.couriers.filter((courier) => courier.selected).length;
  }

  private buildPayload(): CourierSelectionItem[] {
    return this.couriers
      .filter((courier) => courier.selected)
      .map((courier) => ({
        courierName: courier.courierName,
        courierCode: courier.courierCode,
      }));
  }
}
