import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { MetaCatalogSyncProgress } from '../models/meta-catalog-sync.models';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-meta-catalog-sync-modal',
  templateUrl: './meta-catalog-sync-modal.component.html',
  styleUrls: ['./meta-catalog-sync-modal.component.css'],
})
export class MetaCatalogSyncModalComponent implements OnInit, OnDestroy {
  progress: MetaCatalogSyncProgress | null = null;
  starting = true;
  error: string | null = null;
  private pollSub?: Subscription;

  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.productsService.startMetaCatalogSync().subscribe({
      next: (progress) => {
        this.starting = false;
        this.progress = progress;
        if (progress.isRunning) {
          this.startPolling();
        }
      },
      error: (err) => {
        this.starting = false;
        this.error =
          err?.error?.error?.message ||
          this.translate.instant('Failed to start Meta catalog sync.');
      },
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get percent(): number {
    return this.progress?.percent ?? 0;
  }

  get canClose(): boolean {
    return !this.starting && !this.progress?.isRunning;
  }

  private startPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(1200)
      .pipe(
        switchMap(() => this.productsService.getMetaCatalogSyncProgress()),
        takeWhile((p) => !!p?.isRunning, true),
      )
      .subscribe({
        next: (progress) => {
          this.progress = progress;
          if (!progress.isRunning && progress.status === 'Completed') {
            this.toastr.success(
              progress.message || this.translate.instant('Meta catalog sync completed.'),
            );
          }
          if (!progress.isRunning && progress.status === 'Failed') {
            this.toastr.error(
              progress.message || this.translate.instant('Meta catalog sync failed.'),
            );
          }
        },
        error: (err) => {
          this.error =
            err?.error?.error?.message ||
            this.translate.instant('Failed to load Meta sync progress.');
        },
      });
  }
}
