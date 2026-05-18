import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

interface DropdownOption {
  value: string | null;
  label: string;
}

@Component({
  selector: 'app-create-edit-status-event',
  templateUrl: './create-edit-status-event.component.html',
  styleUrls: ['./create-edit-status-event.component.css'],
})
export class CreateEditStatusEventComponent implements OnInit {
  @Input() id: string | null = null;

  requestForm: FormGroup;
  submitted = false;
  isLoading = false;
  title = 'Add Status Event';

  currentStatuses: DropdownOption[] = [];
  newStatuses: DropdownOption[] = [];
  events: DropdownOption[] = [];

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    public globalDataService: GlobalDataService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getEvents();
    this.getStatuses();

    if (this.id) {
      this.title = 'Edit Status Event';
      this.loadForEdit(this.id);
    }
  }

  get f() {
    return this.requestForm.controls;
  }

  buildForm(): void {
    this.requestForm = this.fb.group({
      id: new FormControl(null),
      event: new FormControl('', Validators.required),
      currentStatusId: new FormControl(null),
      newStatusId: new FormControl('', Validators.required),
    });
  }

  loadForEdit(id: string): void {
    this.isLoading = true;
    this.restService
      .getWithoutLoader(`${environment.urls.GetStatusEventForEdit}?id=${id}`)
      .subscribe({
        next: (resp) => {
          const statusEvent = resp?.result?.statusEvent;
          if (statusEvent) {
            this.requestForm.patchValue(statusEvent);
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  save(): void {
    this.submitted = true;
    this.requestForm.markAllAsTouched();
    if (this.requestForm.invalid) {
      this.toastr.error(
        this.translate.instant('Please provide required fields'),
        this.translate.instant('toaster_Heading_Error'),
        { progressBar: true },
      );
      return;
    }

    const model = this.requestForm.value;
    if (model.id) {
      this.update(model);
    } else {
      this.create(model);
    }
  }

  create(model: unknown): void {
    this.isLoading = true;
    this.restService.postWithOutSpinner(environment.urls.StatusEvent_Create, model).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant('Status Event added.'),
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

  update(model: unknown): void {
    this.isLoading = true;
    this.restService.put(environment.urls.StatusEvent_Update, model).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant('Status Event updated.'),
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

  getStatuses(): void {
    this.restService.getWithoutLoader(environment.urls.GetStatusDropdown).subscribe({
      next: (res) => {
        const items = (res.result || []).map((x) => ({
          value: this.getDropdownValue(x),
          label: this.getStatusDisplayLabel(x),
        }));

        this.currentStatuses = [{ value: null, label: 'All' }, ...items];
        this.newStatuses = [
          { value: '', label: this.translate.instant('Select New Status') },
          ...items,
        ];
      },
    });
  }

  getEvents(): void {
    this.restService.getWithoutLoader(environment.urls.GetStatusEventsDropDown).subscribe({
      next: (res) => {
        const items = (res.result || []).map((x) => ({
          value: x.value ?? x.Value ?? '',
          label: this.getEventDisplayLabel(x),
        }));
        this.events = [
          { value: '', label: this.translate.instant('Select Event') },
          ...items,
        ];
      },
    });
  }

  private getDropdownValue(item: any): string {
    return item?.id ?? item?.Id ?? item?.value ?? item?.Value ?? '';
  }

  private getStatusDisplayLabel(item: any): string {
    return (
      item?.displayName ??
      item?.DisplayName ??
      item?.title ??
      item?.Title ??
      ''
    );
  }

  private getEventDisplayLabel(item: any): string {
    const value = item?.value ?? item?.Value ?? '';
    const displayName = item?.displayName ?? item?.DisplayName;
    if (displayName && displayName !== value) {
      return displayName;
    }
    return this.formatEventDisplayName(value);
  }

  private formatEventDisplayName(value: string): string {
    if (!value) {
      return '';
    }
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
