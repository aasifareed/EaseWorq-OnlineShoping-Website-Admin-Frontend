import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { PageTemplate } from '../models/page.models';

@Component({
  selector: 'app-page-form-modal',
  templateUrl: './page-form-modal.component.html',
  styleUrls: ['./page-form-modal.component.css'],
})
export class PageFormModalComponent implements OnInit {
  @Input() pageId: string | null = null;

  form: FormGroup;
  submitted = false;
  isLoading = false;
  title = 'Add Page';
  slugManuallyEdited = false;
  pageTemplates: PageTemplate[] = [];
  selectedTemplateSlug = '';

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    if (this.pageId) {
      this.title = 'Edit Page';
      this.loadPage(this.pageId);
    } else {
      this.loadPageTemplates();
      this.form.get('title')?.valueChanges.subscribe((value) => {
        if (!this.slugManuallyEdited) {
          this.form.patchValue({ slug: this.toSlug(value) }, { emitEvent: false });
        }
      });
    }

    this.form.get('slug')?.valueChanges.subscribe(() => {
      this.slugManuallyEdited = true;
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const payload = this.buildPayload();
    this.isLoading = true;

    this.restService.postWithOutSpinner(environment.urls.Page_CreateOrUpdate, payload).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant(this.pageId ? 'Page updated.' : 'Page created.'),
          this.translate.instant('toaster_Heading_Success'),
          { progressBar: true },
        );
        this.activeModal.close(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(
          this.translate.instant(error?.error?.error?.message ?? 'Error'),
          this.translate.instant('toaster_Heading_Error'),
          { progressBar: true },
        );
      },
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }

  onTemplateChange(slug: string): void {
    const template = this.pageTemplates.find((t) => t.slug === slug);
    if (!template) {
      return;
    }

    this.slugManuallyEdited = true;
    this.form.patchValue({
      title: template.title,
      slug: template.slug,
      content: template.content,
      metaTitle: template.metaTitle,
      metaDescription: template.metaDescription,
      isActive: true,
    });
  }

  private loadPageTemplates(): void {
    this.restService.getWithoutLoader(environment.urls.Page_GetPageTemplates).subscribe({
      next: (response) => {
        const items = response?.result ?? [];
        this.pageTemplates = items.map((x: Record<string, string>) => ({
          title: x.title ?? x.Title,
          slug: x.slug ?? x.Slug,
          content: x.content ?? x.Content ?? '',
          metaTitle: x.metaTitle ?? x.MetaTitle ?? '',
          metaDescription: x.metaDescription ?? x.MetaDescription ?? '',
        }));
      },
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(256)]],
      slug: ['', [Validators.maxLength(256)]],
      content: [''],
      metaTitle: ['', Validators.maxLength(256)],
      metaDescription: ['', Validators.maxLength(512)],
      metaImageUrl: ['', Validators.maxLength(1024)],
      isActive: [true],
    });
  }

  private loadPage(id: string): void {
    this.isLoading = true;
    this.restService.getWithoutLoader(`${environment.urls.Page_GetForEdit}?id=${id}`).subscribe({
      next: (response) => {
        const page = response?.result;
        if (page) {
          this.slugManuallyEdited = true;
          this.form.patchValue({
            title: page.title ?? page.Title,
            slug: page.slug ?? page.Slug,
            content: page.content ?? page.Content ?? '',
            metaTitle: page.metaTitle ?? page.MetaTitle ?? '',
            metaDescription: page.metaDescription ?? page.MetaDescription ?? '',
            metaImageUrl: page.metaImageUrl ?? page.MetaImageUrl ?? '',
            isActive: page.isActive ?? page.IsActive ?? true,
          });
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

  private buildPayload(): Record<string, unknown> {
    const value = this.form.value;
    return {
      id: this.pageId || null,
      title: value.title?.trim(),
      slug: value.slug?.trim() || this.toSlug(value.title),
      content: value.content,
      metaTitle: value.metaTitle,
      metaDescription: value.metaDescription,
      metaImageUrl: value.metaImageUrl,
      isActive: value.isActive,
    };
  }

  private toSlug(value: string): string {
    if (!value) {
      return '';
    }
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
