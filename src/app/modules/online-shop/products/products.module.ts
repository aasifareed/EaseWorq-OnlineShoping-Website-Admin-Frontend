import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { ProductImagesModalComponent } from './product-images-modal/product-images-modal.component';
import { ProductEditModalComponent } from './product-edit-modal/product-edit-modal.component';
import { ProductFacebookPostModalComponent } from './product-facebook-post-modal/product-facebook-post-modal.component';
import { ProductCategoriesComponent } from './product-categories/product-categories.component';
import { ProductCategoryEditModalComponent } from './product-category-edit-modal/product-category-edit-modal.component';
import { CategoryImageModalComponent } from './category-image-modal/category-image-modal.component';
import { ProductBrandsComponent } from './product-brands/product-brands.component';
import { BrandImageModalComponent } from './brand-image-modal/brand-image-modal.component';
import { ProductsService } from './services/products.service';
import { ProductCategoriesService } from './services/product-categories.service';
import { ProductBrandsService } from './services/product-brands.service';
import { EditorModule } from 'primeng/editor';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    ProductsRoutingModule,
    EditorModule,
  ],
  declarations: [
    ProductsComponent,
    ProductImagesModalComponent,
    ProductEditModalComponent,
    ProductFacebookPostModalComponent,
    ProductCategoriesComponent,
    ProductCategoryEditModalComponent,
    CategoryImageModalComponent,
    ProductBrandsComponent,
    BrandImageModalComponent,
  ],
  entryComponents: [
    ProductImagesModalComponent,
    ProductEditModalComponent,
    ProductFacebookPostModalComponent,
    ProductCategoryEditModalComponent,
    CategoryImageModalComponent,
    BrandImageModalComponent,
  ],
  providers: [ProductsService, ProductCategoriesService, ProductBrandsService],
})
export class ProductsModule {}
