import { Component, OnInit, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
const { email, required } = Validators;

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss'],
  animations: [SharedAnimations]
})
export class ForgotComponent implements OnInit {
  form: FormGroup;
  constructor(private fb: FormBuilder,
    private restService: RestService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private router: Router,
  public globalDataService:GlobalDataService,
public translate: TranslateService) { 
  }

  ngOnInit() {
    this.form = this.fb.group({
      phoneNumber: ['', [required]],
    });
 
}

  onSubmit() {
    
    if (this.form.invalid) return;
    let body = this.form.getRawValue();
    let url = '';
    url = environment.urls.User_Reset_Password_Request;

    this.restService.post(url, body).subscribe((response) => {
       if(response.result == 200)
       {
        this.toastr.success('OTP has been sent to your phone number', 'OTP Sent!');
        this.loaderService.display(false);
        this.router.navigate(['/sessions/otp',{phoneNumber: body.phoneNumber}]);
       }
    },
    error => {
     
        //this.loading = false;
       this.toastr.error(this.translate.instant(error.error.error.message), this.translate.instant("toaster_Heading_Error"), { progressBar: true });
    });

  }

}
