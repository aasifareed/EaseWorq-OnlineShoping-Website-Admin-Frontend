import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import {
  ConfirmationDialogOptions,
  ConfirmationDialogResult,
} from '../models/confirmation-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  constructor(private modalService: NgbModal) {}

  confirm(options: ConfirmationDialogOptions): Promise<ConfirmationDialogResult> {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      size: options.showAccountSelect || options.showRefundAmount ? 'md' : (options.size ?? 'sm'),
      windowClass: 'confirmation-dialog-window',
    });

    Object.assign(modalRef.componentInstance, {
      title: options.title ?? 'Please Confirm',
      message: options.message,
      detail: options.detail ?? '',
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      confirmButtonClass: options.confirmButtonClass ?? 'btn-primary',
      icon: options.icon ?? 'warning',
      showAccountSelect: !!options.showAccountSelect,
      accountOptions: options.accountOptions ?? [],
      accountLabel: options.accountLabel ?? 'Refund account',
      accountRequired: options.accountRequired ?? false,
      showRefundAmount: !!options.showRefundAmount,
      defaultRefundAmount: options.defaultRefundAmount ?? null,
      refundAmountLabel: options.refundAmountLabel ?? 'Refund amount',
    });

    return modalRef.result.then(
      (result: ConfirmationDialogResult | boolean) => {
        if (result && typeof result === 'object' && 'confirmed' in result) {
          return result;
        }
        return { confirmed: !!result };
      },
      () => ({ confirmed: false }),
    );
  }
}
