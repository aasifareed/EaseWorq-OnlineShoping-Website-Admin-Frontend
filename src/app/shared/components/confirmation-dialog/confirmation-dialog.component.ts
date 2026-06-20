import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ConfirmationDialogAccountOption,
  ConfirmationDialogIcon,
  ConfirmationDialogResult,
} from '../../models/confirmation-dialog.model';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent implements OnInit {
  title = 'Please Confirm';
  message = 'Are you sure?';
  detail = '';
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  confirmButtonClass = 'btn-primary';
  icon: ConfirmationDialogIcon = 'warning';

  showAccountSelect = false;
  accountOptions: ConfirmationDialogAccountOption[] = [];
  accountLabel = 'Refund account';
  accountRequired = false;
  selectedAccountId: string | null = null;
  accountError = '';

  showRefundAmount = false;
  defaultRefundAmount: number | null = null;
  refundAmountLabel = 'Refund amount';
  refundAmount: number | null = null;
  refundAmountError = '';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.showRefundAmount && this.defaultRefundAmount != null) {
      this.refundAmount = Number(this.defaultRefundAmount);
    }
  }

  get iconClass(): string {
    switch (this.icon) {
      case 'info':
        return 'fa-info-circle';
      case 'question':
        return 'fa-question-circle';
      case 'danger':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      default:
        return '';
    }
  }

  confirm(): void {
    this.accountError = '';
    this.refundAmountError = '';

    if (this.accountRequired && !this.selectedAccountId) {
      this.accountError = 'Please select an account.';
      return;
    }

    if (this.showRefundAmount) {
      const amount = Number(this.refundAmount);
      if (!amount || amount <= 0) {
        this.refundAmountError = 'Enter a valid refund amount.';
        return;
      }
    }

    const result: ConfirmationDialogResult = {
      confirmed: true,
      refundAccountId: this.selectedAccountId ?? undefined,
      refundAmount: this.showRefundAmount ? Number(this.refundAmount) : undefined,
    };

    this.activeModal.close(result);
  }

  dismiss(): void {
    this.activeModal.dismiss({ confirmed: false });
  }
}
