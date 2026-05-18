import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  private phoneNumber = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    public globalDataService:GlobalDataService,
      public translate: TranslateService
) {
  }

  ngOnInit() {
    
    // Phone number comes from OTP screen route param
    this.phoneNumber = this.route.snapshot.params.phoneNumber;
    this.form = this.fb.group({
      password: new FormControl(null, Validators.required),
      confirmPassword: new FormControl(null, [Validators.required]),
      phoneNumber: [this.phoneNumber]
    });
  }

  onSubmit() {

    if (!this.form.valid) {
      return;
    }
    let url = '';
    url = environment.urls.User_Change_Password_ByOTP;
    let body = this.form.getRawValue();
    this.restService.post(url, body).subscribe((response) => {
       if(response.result == 200)
       {
        this.toastr.success('Password changed  successfully', this.translate.instant("toaster_Heading_Success"));
        this.loaderService.display(false);
        this.router.navigateByUrl('/sessions/signin');
       }
    },
    error => {
     
        //this.loading = false;
       this.toastr.error(this.translate.instant(error.error.error.message), this.translate.instant("toaster_Heading_Error"), { progressBar: true });
    });

  }


  // All is this method
  onPasswordChange() {

    if (this.confirmPassword.value == this.password.value) {
      this.confirmPassword.setErrors(null);
    } else {
      this.confirmPassword.setErrors({ confirmPasswordValidator: true });
    }
  }

  // getting the form control elements
  get password(): AbstractControl {
    return this.form.controls['password'];
  }

  get confirmPassword(): AbstractControl {
    return this.form.controls['confirmPassword'];
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }


}
