import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import { ToastrService } from 'ngx-toastr';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
const {  required } = Validators;

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css'],
  host: {
    '[class.card]': `true`,
    '[class.text-center]': `true`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpComponent implements OnInit {

  @ViewChild('cd', { static: false }) public countdown: CountdownComponent;

  private phoneNumber = '';
  disableResendOTPButton=true;

    otpForm:FormGroup;
    constructor(private fb: FormBuilder,
      private restService: RestService,
      private loaderService: LoaderService,
      private toastr: ToastrService,
      private router: Router,
      private route: ActivatedRoute,
      public globalDataService:GlobalDataService,
    public translate: TranslateService,) { }
  
    ngOnInit() {


    this.phoneNumber = this.route.snapshot.params.phoneNumber;
      this.otpForm = this.fb.group({
        oTPCode: ['', [Validators.required, Validators.maxLength(5), Validators.minLength(5)]],
        phoneNumber: [this.phoneNumber]
      });
  }
  

    onSubmit()
    {
      if (this.otpForm.invalid) return;
  
      let body = this.otpForm.getRawValue();
      let url = '';
      url = environment.urls.User_Check_OTP;
  
      this.restService.post(url, body).subscribe((response) => {
        if(response.result == 200)
        {
          
          this.loaderService.display(false);
          this.router.navigate(['/sessions/reset-password',{ phoneNumber: body.phoneNumber }]);
        }
     },
     error => {
      
         //this.loading = false;
        this.toastr.error(this.translate.instant(error.error.error.message), this.translate.instant("toaster_Heading_Error"), { progressBar: true });
     });
    }

    ResendOtp()
    {
      this.router.navigate(['/sessions/forgot']);
  //    let url = '';
  //    url = environment.urls.User_Reset_Password_Request;
  // let body={emailAddress:this.emailAddress};
  //    this.restService.post(url, body).subscribe((response) => {
  //       if(response.result == 200)
  //       {
  //        this.toastr.success('OTP has been sent to your email', 'OTP Sent!');
  //        this.loaderService.display(false);
  //        this.countdown.restart();
  //       }
  //    });
    }

    config: CountdownConfig = {
      leftTime: 60 * 3,
      formatDate: ({ date }) => `${date / 1000}`,
    };
  
    handleEvent(e: CountdownEvent) {
      
      if(e.left==0)
      {
        this.disableResendOTPButton=false;
        let url = '';
        url = environment.urls.User_Expire_Old_OTP;
        let body = { phoneNumber: this.phoneNumber };
         this.restService.post(url, body).subscribe((response) => {
           if(response.result == 200)
           {
            this.toastr.success('OTP has been expired', 'OTP Expired!');
           }
        });

      }
    }


  }
