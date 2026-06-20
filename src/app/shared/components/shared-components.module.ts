import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnLoadingComponent } from './btn-loading/btn-loading.component';
import { FeatherIconComponent } from './feather-icon/feather-icon.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { SharedPipesModule } from '../pipes/shared-pipes.module';
import { SearchModule } from './search/search.module';
import { SharedDirectivesModule } from '../directives/shared-directives.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { RtlSidePanelComponent } from './side-panel/rtl-side-panel/rtl-side-panel.component';
//import { KeyBoardComponent } from 'src/app/modules/point-of-sale/make-sales/components/Key-board/Key-board.component';
import { LtrSidePanelComponent } from './side-panel/ltr-side-panel/ltr-side-panel.component';
import { CustomRtlSidePanelComponent } from './custom-side-panel/custom-rtl-side-panel/custom-rtl-side-panel.component';
import { CustomLtrSidePanelComponent } from './custom-side-panel/custom-ltr-side-panel/custom-ltr-side-panel.component';
import { CustomRTLSidePanelService } from './custom-side-panel/custom-rtl-side-panel/custom-rtl-side-panel.service';
import { CustomLTRSidePanelService } from './custom-side-panel/custom-ltr-side-panel/custom-ltr-side-panel.service';
import { UploadPictureComponent } from './upload-picture/upload-picture.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

const components = [
  BtnLoadingComponent,
  FeatherIconComponent,
  RtlSidePanelComponent,
  LtrSidePanelComponent,
  CustomRtlSidePanelComponent,
  CustomLtrSidePanelComponent,
  UploadPictureComponent,
  ConfirmationDialogComponent,

 // KeyBoardComponent



 

];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    // LayoutsModule,
    SharedPipesModule,
    SharedDirectivesModule,
    SearchModule,
    PerfectScrollbarModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  declarations: components,
  exports: components,
  providers:[
   // KeyBoardComponent,
    CustomLTRSidePanelService,CustomRTLSidePanelService],
    entryComponents: [UploadPictureComponent, ConfirmationDialogComponent],
})
export class SharedComponentsModule { }
