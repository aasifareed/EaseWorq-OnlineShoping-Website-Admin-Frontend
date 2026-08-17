import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import {
  ProfitMarginReportRow,
  ProfitMarginReportSummary,
  ReportFilterState,
  SaleOrdersReportRow,
  SaleOrdersReportSummary,
} from '../models/report.models';

@Injectable()
export class ReportsService {
  constructor(private restService: RestService) {}

  getSaleOrdersReport(
    storeId: string | null,
    filter: ReportFilterState,
    paging: { skipCount: number; maxResultCount: number; sorting?: string },
  ) {
    const params = this.buildBaseParams(storeId, filter, paging);
    const url = `${environment.urls.OnlineShopReporting_GetSaleOrdersReport}?${params.toString()}`;
    return this.restService.get(url);
  }

  getProfitMarginReport(
    storeId: string | null,
    filter: ReportFilterState,
    paging: { skipCount: number; maxResultCount: number; sorting?: string },
  ) {
    const params = this.buildBaseParams(storeId, filter, paging);
    if (filter.externalProductId) {
      params.set('ExternalProductId', filter.externalProductId);
    }
    if (filter.brandName?.trim()) {
      params.set('BrandName', filter.brandName.trim());
    }
    if (filter.categoryName?.trim()) {
      params.set('CategoryName', filter.categoryName.trim());
    }
    const url = `${environment.urls.OnlineShopReporting_GetProfitMarginReport}?${params.toString()}`;
    return this.restService.get(url);
  }

  mapSaleOrderRow(raw: Record<string, unknown>): SaleOrdersReportRow {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      orderNumber: String(raw.orderNumber ?? raw.OrderNumber ?? ''),
      customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
      orderDate: String(raw.orderDate ?? raw.OrderDate ?? ''),
      paymentMethodName: String(raw.paymentMethodName ?? raw.PaymentMethodName ?? ''),
      shippingMethodName: String(raw.shippingMethodName ?? raw.ShippingMethodName ?? ''),
      orderStatusName: String(raw.orderStatusName ?? raw.OrderStatusName ?? ''),
      originalSubTotalAmount: Number(raw.originalSubTotalAmount ?? raw.OriginalSubTotalAmount ?? 0),
      productDiscountAmount: Number(raw.productDiscountAmount ?? raw.ProductDiscountAmount ?? 0),
      subTotalAmount: Number(raw.subTotalAmount ?? raw.SubTotalAmount ?? 0),
      orderDiscountAmount: Number(raw.orderDiscountAmount ?? raw.OrderDiscountAmount ?? 0),
      netMerchandiseAmount: Number(raw.netMerchandiseAmount ?? raw.NetMerchandiseAmount ?? 0),
      taxAmount: Number(raw.taxAmount ?? raw.TaxAmount ?? 0),
      originalShippingAmount: Number(raw.originalShippingAmount ?? raw.OriginalShippingAmount ?? 0),
      shippingDiscountAmount: Number(raw.shippingDiscountAmount ?? raw.ShippingDiscountAmount ?? 0),
      shippingCharges: Number(raw.shippingCharges ?? raw.ShippingCharges ?? 0),
      courierCost: Number(raw.courierCost ?? raw.CourierCost ?? 0),
      shippingProfit: Number(raw.shippingProfit ?? raw.ShippingProfit ?? 0),
      totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
      paidAmount: Number(raw.paidAmount ?? raw.PaidAmount ?? 0),
      remainingAmount: Number(raw.remainingAmount ?? raw.RemainingAmount ?? 0),
      productCost: Number(raw.productCost ?? raw.ProductCost ?? 0),
      productProfit: Number(raw.productProfit ?? raw.ProductProfit ?? 0),
      grossProfit: Number(raw.grossProfit ?? raw.GrossProfit ?? 0),
    };
  }

  mapSaleOrderSummary(raw: Record<string, unknown>): SaleOrdersReportSummary {
    return {
      originalSubTotalAmountSum: Number(raw.originalSubTotalAmountSum ?? raw.OriginalSubTotalAmountSum ?? 0),
      productDiscountAmountSum: Number(raw.productDiscountAmountSum ?? raw.ProductDiscountAmountSum ?? 0),
      subTotalAmountSum: Number(raw.subTotalAmountSum ?? raw.SubTotalAmountSum ?? 0),
      orderDiscountAmountSum: Number(raw.orderDiscountAmountSum ?? raw.OrderDiscountAmountSum ?? 0),
      netMerchandiseAmountSum: Number(raw.netMerchandiseAmountSum ?? raw.NetMerchandiseAmountSum ?? 0),
      taxAmountSum: Number(raw.taxAmountSum ?? raw.TaxAmountSum ?? 0),
      originalShippingAmountSum: Number(raw.originalShippingAmountSum ?? raw.OriginalShippingAmountSum ?? 0),
      shippingDiscountAmountSum: Number(raw.shippingDiscountAmountSum ?? raw.ShippingDiscountAmountSum ?? 0),
      shippingChargesSum: Number(raw.shippingChargesSum ?? raw.ShippingChargesSum ?? 0),
      courierCostSum: Number(raw.courierCostSum ?? raw.CourierCostSum ?? 0),
      shippingProfitSum: Number(raw.shippingProfitSum ?? raw.ShippingProfitSum ?? 0),
      totalAmountSum: Number(raw.totalAmountSum ?? raw.TotalAmountSum ?? 0),
      paidAmountSum: Number(raw.paidAmountSum ?? raw.PaidAmountSum ?? 0),
      remainingAmountSum: Number(raw.remainingAmountSum ?? raw.RemainingAmountSum ?? 0),
      productCostSum: Number(raw.productCostSum ?? raw.ProductCostSum ?? 0),
      productProfitSum: Number(raw.productProfitSum ?? raw.ProductProfitSum ?? 0),
      grossProfitSum: Number(raw.grossProfitSum ?? raw.GrossProfitSum ?? 0),
    };
  }

  mapProfitMarginRow(raw: Record<string, unknown>): ProfitMarginReportRow {
    return {
      productId: String(raw.productId ?? raw.ProductId ?? ''),
      productName: String(raw.productName ?? raw.ProductName ?? ''),
      productSku: String(raw.productSku ?? raw.ProductSku ?? ''),
      brandName: String(raw.brandName ?? raw.BrandName ?? ''),
      categoryName: String(raw.categoryName ?? raw.CategoryName ?? ''),
      quantity: Number(raw.quantity ?? raw.Quantity ?? 0),
      revenue: Number(raw.revenue ?? raw.Revenue ?? 0),
      cost: Number(raw.cost ?? raw.Cost ?? 0),
      profit: Number(raw.profit ?? raw.Profit ?? 0),
      margin: Number(raw.margin ?? raw.Margin ?? 0),
    };
  }

  mapProfitMarginSummary(raw: Record<string, unknown>): ProfitMarginReportSummary {
    return {
      quantitySum: Number(raw.quantitySum ?? raw.QuantitySum ?? 0),
      revenueSum: Number(raw.revenueSum ?? raw.RevenueSum ?? 0),
      costSum: Number(raw.costSum ?? raw.CostSum ?? 0),
      profitSum: Number(raw.profitSum ?? raw.ProfitSum ?? 0),
      shippingChargesSum: Number(raw.shippingChargesSum ?? raw.ShippingChargesSum ?? 0),
      courierCostSum: Number(raw.courierCostSum ?? raw.CourierCostSum ?? 0),
      shippingProfitSum: Number(raw.shippingProfitSum ?? raw.ShippingProfitSum ?? 0),
    };
  }

  private buildBaseParams(
    storeId: string | null,
    filter: ReportFilterState,
    paging: { skipCount: number; maxResultCount: number; sorting?: string },
  ): URLSearchParams {
    const params = new URLSearchParams();
    params.set('SkipCount', String(paging.skipCount));
    params.set('MaxResultCount', String(paging.maxResultCount));
    if (paging.sorting) {
      params.set('Sorting', paging.sorting);
    }
    if (storeId) {
      params.set('StoreId', storeId);
    }
    if (filter.keyword?.trim()) {
      params.set('Keyword', filter.keyword.trim());
    }
    if (filter.fromDate) {
      params.set(
        'FromDateUTC',
        moment(filter.fromDate).utc().startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      );
    }
    if (filter.toDate) {
      params.set(
        'ToDateUTC',
        moment(filter.toDate).utc().endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      );
    }
    if (filter.paymentMethod != null) {
      params.set('PaymentMethod', String(filter.paymentMethod));
    }
    if (filter.shippingMethod != null) {
      params.set('ShippingMethod', String(filter.shippingMethod));
    }
    if (filter.orderStatusId) {
      params.set('OrderStatusId', filter.orderStatusId);
    }
    return params;
  }
}
