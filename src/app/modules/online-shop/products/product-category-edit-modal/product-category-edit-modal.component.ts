import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminProductCategoryListItem } from '../models/product-category.models';
import { ProductCategoriesService } from '../services/product-categories.service';

@Component({
  selector: 'app-product-category-edit-modal',
  templateUrl: './product-category-edit-modal.component.html',
  styleUrls: ['./product-category-edit-modal.component.css'],
})
export class ProductCategoryEditModalComponent implements OnInit {
  @Input() category!: AdminProductCategoryListItem;

  showCategoryOnline = false;
  displayName = '';
  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private categoriesService: ProductCategoriesService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.showCategoryOnline = this.category?.showCategoryOnline ?? false;
    this.displayName = this.category?.displayName ?? '';
  }

  save(): void {
    if (!this.category?.id || this.saving) {
      return;
    }

    this.saving = true;

    this.categoriesService
      .updateForAdmin({
        productGroupId: this.category.id,
        showCategoryOnline: this.showCategoryOnline,
        displayName: this.displayName.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.toastr.success(this.translate.instant('Category updated.'));
          this.activeModal.close(updated);
        },
        error: (err) => {
          this.saving = false;
          const message =
            err?.error?.error?.message || this.translate.instant('Failed to update category.');
          this.toastr.error(message);
        },
      });
  }
}
