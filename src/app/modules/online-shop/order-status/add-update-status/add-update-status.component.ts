import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { CustomUserStoreService } from "src/app/shared/services/custom-user-store.service";
import { GlobalDataService } from "src/app/shared/services/globalData.service";
import { RestService } from "src/app/shared/services/rest.service";
import { StatusDto } from "../models/statusDto";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-add-update-status",
  templateUrl: "./add-update-status.component.html",
  styleUrls: ["./add-update-status.component.css"],
})
export class AddUpdateStatusComponent implements OnInit {
  @Output() sectionCreatedEvent = new EventEmitter<StatusDto>();
  @Output() sectionUpdatedEvent = new EventEmitter<StatusDto>();

  requestForm: FormGroup;
  screenName;
  isAddScreen: boolean = false;
  formDisabled: boolean = false;

  dropdownSettings = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private restService: RestService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public _customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
  ) {
    this.creatForm();
  }

  ngOnInit(): void {
    this.dropdownSettings = {
      singleSelection: false,
      idField: "value",
      textField: "label",
      allowSearchFilter: true,
      closeDropDownOnSelection: false, // This ensures the dropdown closes after selection
    };

    this.getChildStatuses();
  }

  setViewScreen(dto: StatusDto) {
    this.screenName = "Edit Status";
    this.isAddScreen = false;

    this.restService
      .get(`${environment.urls.GetStatusForEdit}?id=${dto.id}`)
      .subscribe(
        (res) => {
          const status = (res?.result?.status ?? res?.result ?? dto) as StatusDto;
          this.applyStatusToForm(status);
        },
        () => {
          this.applyStatusToForm(dto);
        },
      );
  }

  private applyStatusToForm(dto: StatusDto) {
    this.getChildStatuses(dto.id).then(() => {
      this.requestForm.patchValue(dto);

      const selectedChildStatuses = (dto.childStatusIds || [])
        .filter((id) => id != null && id !== "")
        .map((id: string) => {
          const status = this.childStatuses.find(
            (x) => x.value === id || x.value === String(id),
          );
          return {
            value: id,
            label: status ? status.label : "",
          };
        });

      this.requestForm.get("childStatusIds")?.setValue(selectedChildStatuses);
    });
  }

  setAddScreen() {
    this.screenName = "Add Status";
    this.isAddScreen = true;
    this.requestForm.reset();

    this.requestForm.controls["id"].setValue(null);
    this.requestForm.controls["colorCode"].setValue("#000000");
    this.requestForm.controls["isSystem"].setValue(false);
  }

  creatForm() {
    this.requestForm = this.fb.group({
      id: [""],
      statusCode: new FormControl(
        "",
        Validators.compose([Validators.required]),
      ),
      colorCode: new FormControl("#000000"),
      statusName: new FormControl(
        "",
        Validators.compose([Validators.required]),
      ),
      displayName: new FormControl(
        "",
        Validators.compose([Validators.required]),
      ),
      orderNumber: new FormControl(
        "",
        Validators.compose([Validators.required]),
      ),
      description: new FormControl(""),
      childStatusIds: [[]], // IMPORTANT → must be an array
      isSystem: [false],
    });
  }

  get f() {
    return this.requestForm.controls;
  }

  submit() {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach((key) => {
        this.requestForm.get(key).markAsTouched({ onlySelf: true });
      });

      this.toastr.error(
        this.translate.instant("Please provide required fields"),
        this.translate.instant("toaster_Heading_Error"),
        { progressBar: true },
      );
    } else {
      let formValues = this.requestForm.getRawValue();

      formValues.childStatusIds = (formValues.childStatusIds || []).map(
        (item: any) => item.value,
      );

      this.restService
        .post(`${environment.urls.CreateStatus}`, formValues)
        .subscribe(
          (data) => {
            if (data && data.result && data.result != null) {
              formValues.id = data.result;
              this.sectionCreatedEvent.emit(formValues);
              this.toastr.success(
                this.translate.instant("Status Added."),
                this.translate.instant("toaster_Heading_Success"),
                { progressBar: true },
              );
              this.activeModal.close();
            }
          },
          (err) => {
            this.toastr.error(
              this.translate.instant(err.error.error.message),
              this.translate.instant("toaster_Heading_Error"),
              { progressBar: true },
            );
          },
        );
    }
  }

  update() {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach((key) => {
        this.requestForm.get(key).markAsTouched({ onlySelf: true });
      });
      this.toastr.error(
        this.translate.instant("Please provide required fields"),
        this.translate.instant("toaster_Heading_Error"),
        { progressBar: true },
      );

      //this.toastr.error('Please provide required fields');
      return;
    } else {
      let formValues = this.requestForm.getRawValue();

      formValues.childStatusIds = (formValues.childStatusIds || []).map(
        (item: any) => item.value,
      );

      this.restService
        .put(`${environment.urls.UpdateStatus}`, formValues)
        .subscribe(
          (data) => {
            if (data && data.result && data.result != null) {
              this.sectionUpdatedEvent.emit(formValues);
              this.toastr.success(
                this.translate.instant("Status Updated."),
                this.translate.instant("toaster_Heading_Success"),
                { progressBar: true },
              );
              this.activeModal.close();
            }
          },
          (err) => {
                        this.toastr.error(
              this.translate.instant(err.error.error.message),
              this.translate.instant("toaster_Heading_Error"),
              { progressBar: true },
            );
          },
        );
    }
  }

  checkFormValidWithTouched(frmGroup: FormGroup) {
    if (frmGroup.invalid) {
      Object.keys(frmGroup.controls).forEach((key) => {
        frmGroup.get(key).markAsTouched({ onlySelf: true });
      });
      return false;
    }
    return true;
  }

  childStatuses = [];

  /** All statuses for multiselect (same as ASG — not mapped-children-only API). */
  getChildStatuses(excludeStatusId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.restService.get(environment.urls.GetStatusDropdown).subscribe(
        (res) => {
          const excludeId = excludeStatusId ? String(excludeStatusId) : null;
          this.childStatuses = (res.result || [])
            .map((x) => ({
              value: x.id ?? x.Id,
              label: x.displayName ?? x.DisplayName ?? "",
            }))
            .filter((x) => x.value && (!excludeId || String(x.value) !== excludeId));
          resolve();
        },
        (err) => {
          console.log(err);
          reject(err);
        },
      );
    });
  }
}
