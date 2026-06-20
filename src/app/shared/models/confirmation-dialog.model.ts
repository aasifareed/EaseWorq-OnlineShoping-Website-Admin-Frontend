export type ConfirmationDialogIcon = 'warning' | 'info' | 'question' | 'danger' | 'none';

export type ConfirmationDialogSize = 'sm' | 'md' | 'lg';

export interface ConfirmationDialogAccountOption {
  value: string;
  label: string;
}

export interface ConfirmationDialogOptions {
  title?: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: ConfirmationDialogIcon;
  size?: ConfirmationDialogSize;
  showAccountSelect?: boolean;
  accountOptions?: ConfirmationDialogAccountOption[];
  accountLabel?: string;
  accountRequired?: boolean;
  showRefundAmount?: boolean;
  defaultRefundAmount?: number | null;
  refundAmountLabel?: string;
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
  refundAccountId?: string;
  refundAmount?: number;
}
