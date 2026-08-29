import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PriceChallengeReviewsComponent } from './price-challenge-reviews.component';

const routes: Routes = [{ path: '', component: PriceChallengeReviewsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PriceChallengeReviewsRoutingModule {}
