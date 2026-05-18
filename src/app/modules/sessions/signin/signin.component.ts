import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { FormGroup, FormBuilder, Validators, AsyncValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { Router, RouteConfigLoadStart, ResolveStart, RouteConfigLoadEnd, ResolveEnd, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { RolesEnum } from 'src/app/shared/enum/Roles';
import { CustomizerService } from 'src/app/shared/services/customizer.service';
import { TranslateService } from '@ngx-translate/core';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { PermissionService } from 'src/app/shared/services/permission.service';
import { PermissionsEnum } from 'src/app/shared/enum/Permissions';
import { SignalRService } from '../../../shared/services/signal-r.service';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
//import { KeyBoardComponent } from '../../point-of-sale/make-sales/components/Key-board/Key-board.component';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { LocalStoreService } from 'src/app/shared/services/local-store.service';
import { RoutePermissionService } from 'src/app/shared/services/route-permission.service';
import { Apps } from 'src/app/shared/enum/Apps';

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    animations: [SharedAnimations]
})
export class SigninComponent implements OnInit {
    loading: boolean;
    loadingText: string;
    signinForm: FormGroup;
    arSelected = false;
    enSelected = false;
    showPassword: boolean;
    private impersonationContext: { targetUserId: number; targetTenantId?: number | null } | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toastr: ToastrService,
        private navigation: NavigationService,
        public customizer: CustomizerService,
        private translate: TranslateService,
        private loaderService: LoaderService,
        private userService: UserService,
        private restService: RestService,
        private permissionService: PermissionService,
         public signalRService: SignalRService,
        // public keyboard: KeyBoardComponent,
         public globalDataService:GlobalDataService,
         private store: LocalStoreService,
         private routePermissionService: RoutePermissionService,
         private activatedRoute: ActivatedRoute,
    ) { }

    ngOnInit() {
     
    
        this.router.events.subscribe(event => {
            if (event instanceof RouteConfigLoadStart || event instanceof ResolveStart) {
                this.loadingText = 'Loading Dashboard...';

                this.loading = true;
            }
            if (event instanceof RouteConfigLoadEnd || event instanceof ResolveEnd) {
                this.loading = false;
            }
        });

        this.activatedRoute.queryParams.subscribe(params => {
            const impersonatedUserId = params['impersonatedUserId'];
            if (impersonatedUserId) {
                const impersonatedTenantId = params['impersonatedTenantId'] ?? params['tenantId'];
                this.impersonationContext = {
                    targetUserId: Number(impersonatedUserId),
                    targetTenantId: impersonatedTenantId ? Number(impersonatedTenantId) : null
                };
            }
        });

        this.signinForm = this.fb.group({
            userNameOrEmailAddress: ['', Validators.required],
            password: ['', Validators.required],
           tenancyName: [''],
           tenantId: [''],
           IsTenantAvailable: [false], 
            rememberClient: [false]
        });



        this.selectedLanguage();
    }


    get f() { return this.signinForm.controls; }

   async signin() {
         
        if (this.signinForm.invalid) {
            Object.keys(this.signinForm.controls).forEach(key => {
              this.signinForm.get(key).markAsTouched({ onlySelf: true });
            });
      
            this.toastr.error(this.translate.instant("signIn_Please_provide_required_fields"),this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
        }else{

            this.loaderService.display(true);
            const formValues = this.signinForm.value;

            if (!this.impersonationContext) {
              formValues.tenancyName = this.globalDataService.getCurrentTanantName();
            }

            const login$ = this.impersonationContext
                ? this.authService.impersonateSignin({
                    impersonatorUserNameOrEmailAddress: formValues.userNameOrEmailAddress,
                    impersonatorPassword: formValues.password,
                    impersonatorTenancyName: formValues.tenancyName ? formValues.tenancyName : null,
                    targetUserId: this.impersonationContext.targetUserId,
                    targetTenantId: this.impersonationContext.targetTenantId
                })
                : this.authService.signin(formValues);

            login$
                .subscribe(res => {
                    this.userService.getUser().subscribe(response => {
                      
                      
                      this.loaderService.display(false);

                      // Permission-based post-login routing disabled for now.
                      // const hasPermission = this.routePermissionService.navigateToFirstAvailableRoute();
                      // if (hasPermission) {
                      //   this.navigation.setApplication(Apps.ONLINE_SHOP, false);
                      // } else {
                      //   this.toastr.error(
                      //     this.translate.instant("error_no_permissions") || "You don't have permission to access any module. Please contact your administrator.",
                      //     this.translate.instant("toaster_Heading_Error"),
                      //     { timeOut: 5000, progressBar: true }
                      //   );
                      //   this.loaderService.display(false);
                      //   return;
                      // }
                      this.router.navigateByUrl('/online-shop/online-orders');
                      this.navigation.setApplication(Apps.ONLINE_SHOP, false);

                      
                      let defaultLanguageSource = this.store.getItem('defaultLanguage');
                      this.translate.use(defaultLanguageSource);
                      
                    this.toastr.success(this.translate.instant("signIn_Welcome_to_POS"), this.translate.instant("toaster_Heading_Success"), {timeOut: 5000, progressBar: true });
                    this.loading = false;
                    //this.loaderService.display(false);
                    // this.navigation.publishNavigationChange();
    
                        if (!this.signalRService.signalRConnectionEnabled) {
                            this.signalRService.startConnection();
                        }
    
                }, error => {
                    //this.loading = false;
                if(error && error.error && error.error.error && error.error.error.message){
                  this.toastr.error(this.translate.instant(error.error.error.message), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }else if(error && error.error){
                  this.toastr.error(this.translate.instant(error.error.message), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }else{
                  this.toastr.error(this.translate.instant('user_Form_User_Updated_Error_Message'), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }
                    this.loaderService.display(false);
                });
            },
            error => {
              
                if(error && error.error && error.error.error && error.error.error.message){
                  this.toastr.error(this.translate.instant(error.error.error.message), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }else if(error && error.error){
                  this.toastr.error(this.translate.instant(error.error.message), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }else{
                  this.toastr.error(this.translate.instant('user_Form_User_Updated_Error_Message'), this.translate.instant("toaster_Heading_Error"), {timeOut: 5000, progressBar: true });
                }

                this.loaderService.display(false);

            })


        }


    }
    

    selectedLanguage() {
        let browserlang = localStorage.getItem('lang');
        if (browserlang == 'ar') {
          this.arSelected = true;
          this.enSelected = false;
        }
        else {
          this.enSelected = true;
          this.arSelected = false;
        }
      }
    toggleDir(lang) {
        this.customizer.toggleDir(lang == 'ar');
        //this.changeLanguage(lang);
        this.selectedLanguage();
    }

    public checkTenantExistenceValidator(): AsyncValidatorFn {

        return (control: AbstractControl): Observable<ValidationErrors | null> => {
          return of(control.value).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((tenancyName: string) =>
            
            
             this.restService.post(environment.urls.Is_Tenant_Available,{tenancyName:tenancyName}).map(response => {
              
              
                if(response?.result?.tenantId!==null)
                {
                    
                  this.signinForm.controls['tenantId'].setValue(response.result.tenantId);
                }

                if(response?.result?.tenantId ===null)
                {
                    
                  //  this.toastr.error('Company or Store is not exist with this name,Please provide correct company name');
                 return { tenantNotExist: true };
                }else{
                return null;
                }
          })
            )
          );
        };
      }

    // changeLanguage(lang: string) {
    //     this.translateService.setDefaultLang(lang);
    //     this.translateService.use(lang);
    // }



    onInputFocusForSignInForm(event: any) {
      //  this.virtualKeyBoardService.keyboard.setInput(event.target.value);
       // this.virtualKeyBoardService.keyboardValue=event.target.value;
       // this.virtualKeyBoardService.genericForm=this.signinForm;
       // this.virtualKeyBoardService.inputName=event.target.id;
       // this.keyboard.onInputChange(event);
      };
    
      onInputChangeForSignInForm(event: any){

       //this.virtualKeyBoardService.keyboard.setInput(event.target.value);
      //  this.virtualKeyBoardService.keyboardValue=event.target.value;
       // this.keyboard.onInputChange(event);
      };

      togglePassword(): void {
        this.showPassword = !this.showPassword;
      }
}
