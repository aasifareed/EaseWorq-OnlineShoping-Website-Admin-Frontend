import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { EMAIL_MAILBOX_TYPES, EmailMailboxConfig } from '../models/email-support.models';

@Component({
  selector: 'app-email-mailbox-form-modal',
  templateUrl: './email-mailbox-form-modal.component.html',
  styleUrls: ['./email-mailbox-form-modal.component.css'],
})
export class EmailMailboxFormModalComponent implements OnInit {
  @Input() mailbox: EmailMailboxConfig | null = null;

  form: FormGroup;
  submitted = false;
  saving = false;
  title = 'Add mailbox';
  mailboxTypes = EMAIL_MAILBOX_TYPES;

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.title = this.mailbox?.id ? 'Edit mailbox' : 'Add mailbox';
    this.form = this.fb.group({
      emailAddress: [this.mailbox?.emailAddress || '', [Validators.required, Validators.email]],
      displayName: [this.mailbox?.displayName || '', Validators.required],
      mailboxType: [this.mailbox?.mailboxType || 'Support', Validators.required],
      isActive: [this.mailbox?.isActive ?? true],
    });
  }

  get f() {
    return this.form.controls;
  }

  close(): void {
    this.activeModal.dismiss();
  }

  save(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.saving = true;
    const value = this.form.value;
    this.restService.post(environment.urls.EmailSupport_SaveMailbox, {
      id: this.mailbox?.id || null,
      emailAddress: String(value.emailAddress || '').trim(),
      displayName: String(value.displayName || '').trim(),
      mailboxType: value.mailboxType,
      isActive: !!value.isActive,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        this.toastr.success(this.mailbox?.id ? 'Mailbox updated.' : 'Mailbox created.');
        this.activeModal.close(response?.result || true);
      },
      error: (err) => {
        this.saving = false;
        this.toastr.error(err?.error?.error?.message || 'Could not save the mailbox.');
      },
    });
  }
}
