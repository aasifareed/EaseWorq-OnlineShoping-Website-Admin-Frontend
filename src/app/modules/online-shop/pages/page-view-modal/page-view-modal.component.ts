import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-page-view-modal',
  templateUrl: './page-view-modal.component.html',
  styleUrls: ['./page-view-modal.component.css'],
})
export class PageViewModalComponent implements OnInit {
  @Input() pageId: string;

  isLoading = true;
  title = '';
  slug = '';
  safeContent: SafeHtml | null = null;
  hasContent = false;
  isActive = false;

  constructor(
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.restService.getWithoutLoader(`${environment.urls.Page_GetForEdit}?id=${this.pageId}`).subscribe({
      next: (response) => {
        const page = response?.result;
        if (page) {
          this.title = page.title ?? page.Title ?? '';
          this.slug = page.slug ?? page.Slug ?? '';
          this.isActive = page.isActive ?? page.IsActive ?? false;
          const content = page.content ?? page.Content ?? '';
          this.hasContent = !!content?.trim();
          this.safeContent = this.hasContent
            ? this.sanitizer.bypassSecurityTrustHtml(content)
            : null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(
          this.translate.instant(error?.error?.error?.message ?? 'Error'),
          this.translate.instant('toaster_Heading_Error'),
          { progressBar: true },
        );
        this.activeModal.dismiss();
      },
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
