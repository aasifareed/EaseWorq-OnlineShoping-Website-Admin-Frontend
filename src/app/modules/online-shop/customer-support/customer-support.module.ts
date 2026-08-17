import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { EditorModule } from 'primeng/editor';
import { CustomerSupportRoutingModule } from './customer-support-routing.module';
import { CustomerSupportComponent } from './customer-support.component';
import { EmailMailboxFormModalComponent } from './email-mailbox-form-modal/email-mailbox-form-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    EditorModule,
    NgxDatatableModule,
    TranslateModule,
    SharedModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    CustomerSupportRoutingModule,
  ],
  declarations: [CustomerSupportComponent, EmailMailboxFormModalComponent],
  entryComponents: [EmailMailboxFormModalComponent],
})
export class CustomerSupportModule {}
