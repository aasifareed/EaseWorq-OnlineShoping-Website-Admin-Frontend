export interface AdminCourierListItem {
  courierName: string;
  courierCode: string;
  isSelected: boolean;
}

export interface CourierSelectionItem {
  courierName: string;
  courierCode: string;
}

export interface CheckoutCourierOption extends AdminCourierListItem {
  selected: boolean;
}
