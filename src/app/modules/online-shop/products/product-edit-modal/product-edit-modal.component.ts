import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminProductListItem } from '../models/product.models';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-edit-modal',
  templateUrl: './product-edit-modal.component.html',
  styleUrls: ['./product-edit-modal.component.css'],
})
export class ProductEditModalComponent implements OnInit {
  @Input() product!: AdminProductListItem;

  displayName = '';
  description = '';
  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.displayName = this.product?.displayName ?? '';
    this.description = this.product?.description ?? '';
  }

  save(): void {
    if (!this.product?.id || !this.product?.productId || this.saving) {
      return;
    }

    this.saving = true;

    this.productsService
      .updateForAdmin({
        productInventoryId: this.product.id,
        productId: this.product.productId,
        displayName: this.displayName.trim(),
        description: this.description.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.toastr.success(this.translate.instant('Product updated.'));
          this.activeModal.close(updated);
        },
        error: (err) => {
          this.saving = false;
          const message =
            err?.error?.error?.message || this.translate.instant('Failed to update product.');
          this.toastr.error(message);
        },
      });
  }
}
