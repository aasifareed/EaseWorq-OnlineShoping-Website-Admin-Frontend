import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { ShippingStateService } from '../shipping-state.service';
import { environment } from 'src/environments/environment';
import { ShippingRuleModalComponent } from '../shipping-rule-modal/shipping-rule-modal.component';
import { ShippingCountryDetail, ShippingRule } from '../models/shipping.models';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import {
  formatRuleDiscount,
  ruleLimitUnit,
  ruleTypeLabel,
  shippingTypeLabel,
} from '../utils/shipping-rule-format.util';

@Component({
  selector: 'app-shipping-country',
  templateUrl: './shipping-country.component.html',
  styleUrls: ['./shipping-country.component.scss'],
})
export class ShippingCountryComponent implements OnInit {
  @Input() countryId: string;

  country: ShippingCountryDetail;
  loading = true;

  constructor(
    private restService: RestService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService,
    private shippingState: ShippingStateService,
    private globalDataService: GlobalDataService,
  ) {}

  ngOnInit(): void {
    if (this.countryId) {
      this.loadCountry();
    }
  }

  loadCountry(): void {
    if (!this.countryId) {
      return;
    }
    this.loading = true;
    this.restService
      .get(`${environment.urls.Shipping_GetCountryForEdit}?id=${this.countryId}`)
      .subscribe({
        next: (res) => {
          this.country = this.mapCountryDetail(res.result);
          this.shippingState.setEditing(this.country.id, this.country.countryName);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  openAddRuleModal(rule?: ShippingRule): void {
    const modalRef = this.modalService.open(ShippingRuleModalComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'addSectionModal shippingRuleModal',
    });
    modalRef.componentInstance.countryId = this.countryId;
    modalRef.componentInstance.rule = rule || null;

    modalRef.result.then(
      (saved) => {
        if (saved) {
          this.loadCountry();
        }
      },
      () => {},
    );
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
          this.loadCountry();
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
    return ruleTypeLabel(ruleType);
  }

  getShippingTypeLabel(shippingType: string): string {
    return shippingTypeLabel(shippingType);
  }

  /** Limits carry their unit, since a weight rule's "2" is 2 kg and a price rule's is 2 rupees. */
  limitUnit(rule: ShippingRule): string {
    return ruleLimitUnit(rule.ruleType, this.globalDataService.getCurrencySymbol());
  }

  formatDiscount(rule: ShippingRule): string {
    return formatRuleDiscount(rule, this.globalDataService.getCurrencySymbol());
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
        max: r.max ?? r.Max ?? null,
        shippingType: r.shippingType ?? r.ShippingType,
        amount: r.amount ?? r.Amount,
        isActive: r.isActive ?? r.IsActive,
      })),
    };
  }
}
