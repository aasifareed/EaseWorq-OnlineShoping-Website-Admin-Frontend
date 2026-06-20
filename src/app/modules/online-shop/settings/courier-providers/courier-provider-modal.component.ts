import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CourierProviderEdit } from '../models/provider.models';
import { CourierProviderService } from '../services/courier-provider.service';

@Component({
  selector: 'app-courier-provider-modal',
  templateUrl: './courier-provider-modal.component.html',
})
export class CourierProviderModalComponent implements OnInit {
  @Input() providerId?: string;

  form: FormGroup;
  loading = false;
  saving = false;
  title = 'Add Courier Provider';

  constructor(
    private fb: FormBuilder,
    private courierService: CourierProviderService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      courierProvider: ['', Validators.required],
      providerCode: ['', Validators.required],
      apiBaseUrl: [''],
      clientId: [''],
      clientSecret: [''],
      username: [''],
      password: [''],
      accessToken: [''],
      isActive: [true],
      isApiEnabled: [true],
      isManualRateEnabled: [false],
    });

    this.loading = true;
    this.courierService.getForEdit(this.providerId).subscribe({
      next: (data) => {
        this.loading = false;
        if (this.providerId) {
          this.title = 'Edit Courier Provider';
        }
        this.form.patchValue(data);
        this.updateApiValidators();
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load courier provider'));
        this.activeModal.dismiss();
      },
    });

    this.form.get('isApiEnabled')?.valueChanges.subscribe(() => this.updateApiValidators());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as CourierProviderEdit;
    this.saving = true;
    this.courierService.save(value).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('Courier provider saved'));
        this.activeModal.close(true);
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.error?.message || this.translate.instant('Failed to save courier provider');
        this.toastr.error(message);
      },
    });
  }

  private updateApiValidators(): void {
    const apiEnabled = !!this.form.get('isApiEnabled')?.value;
    const apiCtrl = this.form.get('apiBaseUrl');
    if (!apiCtrl) {
      return;
    }
    if (apiEnabled) {
      apiCtrl.setValidators([Validators.required]);
    } else {
      apiCtrl.clearValidators();
    }
    apiCtrl.updateValueAndValidity({ emitEvent: false });
  }
}
