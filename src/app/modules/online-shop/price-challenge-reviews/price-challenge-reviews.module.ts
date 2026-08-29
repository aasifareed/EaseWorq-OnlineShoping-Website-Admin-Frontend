import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDirectivesModule } from 'src/app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { PriceChallengeReviewsRoutingModule } from './price-challenge-reviews-routing.module';
import { PriceChallengeReviewsComponent } from './price-challenge-reviews.component';
import { PriceChallengeReviewModalComponent } from './price-challenge-review-modal/price-challenge-review-modal.component';
import { PriceChallengeReviewsService } from './services/price-challenge-reviews.service';

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
    PriceChallengeReviewsRoutingModule,
  ],
  declarations: [PriceChallengeReviewsComponent, PriceChallengeReviewModalComponent],
  providers: [PriceChallengeReviewsService],
})
export class PriceChallengeReviewsModule {}
