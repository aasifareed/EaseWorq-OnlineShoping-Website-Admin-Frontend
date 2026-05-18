import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorModule } from 'primeng/editor';
import { SharedModule } from 'src/app/shared/shared.module';
import { PageFormModalComponent } from './page-form-modal/page-form-modal.component';
import { PageViewModalComponent } from './page-view-modal/page-view-modal.component';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, EditorModule, SharedModule],
  declarations: [PageFormModalComponent, PageViewModalComponent],
  exports: [PageFormModalComponent, PageViewModalComponent],
})
export class PagesSharedModule {}
