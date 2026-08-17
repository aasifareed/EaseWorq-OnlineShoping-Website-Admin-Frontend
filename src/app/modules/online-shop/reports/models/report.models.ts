export interface ReportFilterState {
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: number | null;
  shippingMethod?: number | null;
  orderStatusId?: string | null;
  externalProductId?: string | null;
  brandName?: string;
  categoryName?: string;
}

export interface SaleOrdersReportRow {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  paymentMethodName: string;
  shippingMethodName: string;
  orderStatusName: string;
  originalSubTotalAmount: number;
  productDiscountAmount: number;
  subTotalAmount: number;
  orderDiscountAmount: number;
  netMerchandiseAmount: number;
  taxAmount: number;
  originalShippingAmount: number;
  shippingDiscountAmount: number;
  shippingCharges: number;
  courierCost: number;
  shippingProfit: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  productCost: number;
  productProfit: number;
  grossProfit: number;
}

export interface SaleOrdersReportSummary {
  originalSubTotalAmountSum: number;
  productDiscountAmountSum: number;
  subTotalAmountSum: number;
  orderDiscountAmountSum: number;
  netMerchandiseAmountSum: number;
  taxAmountSum: number;
  originalShippingAmountSum: number;
  shippingDiscountAmountSum: number;
  shippingChargesSum: number;
  courierCostSum: number;
  shippingProfitSum: number;
  totalAmountSum: number;
  paidAmountSum: number;
  remainingAmountSum: number;
  productCostSum: number;
  productProfitSum: number;
  grossProfitSum: number;
}

export interface ProfitMarginReportRow {
  productId: string;
  productName: string;
  productSku: string;
  brandName: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface ProfitMarginReportSummary {
  quantitySum: number;
  revenueSum: number;
  costSum: number;
  profitSum: number;
  shippingChargesSum: number;
  courierCostSum: number;
  shippingProfitSum: number;
}

export interface ReportStatusOption {
  value: string;
  label: string;
}

export interface ReportProductOption {
  value: string;
  label: string;
}
