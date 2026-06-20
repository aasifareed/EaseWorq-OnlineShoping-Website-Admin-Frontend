import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { Router, RouteConfigLoadStart, ResolveStart, RouteConfigLoadEnd, ResolveEnd, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { CustomizerService } from 'src/app/shared/services/customizer.service';
import { TranslateService } from '@ngx-translate/core';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';
import { SignalRService } from '../../../shared/services/signal-r.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { LocalStoreService } from 'src/app/shared/services/local-store.service';
import { Apps } from 'src/app/shared/enum/Apps';
import { TenantService } from 'src/app/shared/services/Tenant.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    animations: [SharedAnimations]
})
export class SigninComponent implements OnInit, AfterViewInit {
    loading: boolean;
    loadingText: string;
    signinForm: FormGroup;
    arSelected = false;
    enSelected = false;
    showPassword: boolean;
    tenantValidating = false;
    tenantValidated = false;
    private impersonationContext: { targetUserId: number; targetTenantId?: number | null } | null = null;
    private lastValidatedTenantName = '';

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
        public signalRService: SignalRService,
        public globalDataService: GlobalDataService,
        private store: LocalStoreService,
        private activatedRoute: ActivatedRoute,
        private tenantService: TenantService,
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
            tenancyName: ['', Validators.required],
            userNameOrEmailAddress: ['', Validators.required],
            password: ['', Validators.required],
            tenantId: [''],
            rememberClient: [false]
        });

        this.signinForm.get('tenancyName')?.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ).subscribe((value) => {
            const tenancyName = String(value ?? '').trim();
            if (!tenancyName || tenancyName !== this.lastValidatedTenantName) {
                this.tenantValidated = false;
            }
        });

        this.signinForm.get('tenancyName')?.valueChanges.pipe(
            debounceTime(600),
            distinctUntilChanged(),
            filter((value) => !!String(value ?? '').trim()),
        ).subscribe(() => {
            void this.validateTenantName();
        });

        this.selectedLanguage();
    }

    ngAfterViewInit(): void {
        this.syncAutofillCredentials();
        setTimeout(() => this.syncAutofillCredentials(), 150);
        setTimeout(() => this.syncAutofillCredentials(), 600);
    }

    syncAutofillCredentials(): void {
        const emailEl = document.getElementById('userNameOrEmailAddress') as HTMLInputElement | null;
        const passwordEl = document.getElementById('password') as HTMLInputElement | null;
        const patch: Record<string, string> = {};

        if (emailEl?.value?.trim()) {
            patch.userNameOrEmailAddress = emailEl.value.trim();
        }
        if (passwordEl?.value) {
            patch.password = passwordEl.value;
        }

        if (Object.keys(patch).length) {
            this.signinForm.patchValue(patch, { emitEvent: false });
        }
    }

    private hasSignInCredentials(): boolean {
        const user = String(this.f.userNameOrEmailAddress.value ?? '').trim();
        const pass = String(this.f.password.value ?? '').trim();
        return user.length > 0 && pass.length > 0;
    }

    get f() { return this.signinForm.controls; }

    get canSignIn(): boolean {
        return !this.tenantValidating
            && this.tenantValidated
            && this.hasSignInCredentials();
    }

    onTenantNameBlur(): void {
        void this.validateTenantName();
    }

    async validateTenantName(): Promise<void> {
        const tenancyName = String(this.signinForm.get('tenancyName')?.value ?? '').trim();
        if (!tenancyName) {
            this.tenantValidated = false;
            this.lastValidatedTenantName = '';
            return;
        }

        if (this.tenantValidating) {
            return;
        }

        this.tenantValidating = true;
        this.tenantValidated = false;

        try {
            const available = await this.tenantService
                .checkTenantAvailability(tenancyName)
                .toPromise();

            if (available) {
                const tenantId = this.globalDataService.getCurrentTanantId();
                this.signinForm.patchValue({ tenantId }, { emitEvent: false });
                this.tenantValidated = true;
                this.lastValidatedTenantName = tenancyName;
                this.tenantService.getTenanetSettings();
                this.syncAutofillCredentials();
            } else {
                this.tenantValidated = false;
                this.lastValidatedTenantName = '';
                this.toastr.error(
                    'Tenant not found. Please check the tenant name and try again.',
                    'Error',
                    { timeOut: 5000, progressBar: true },
                );
            }
        } catch {
            this.tenantValidated = false;
            this.lastValidatedTenantName = '';
            this.toastr.error(
                'Unable to validate tenant. Please try again.',
                'Error',
                { timeOut: 5000, progressBar: true },
            );
        } finally {
            this.tenantValidating = false;
        }
    }

    async signin() {
        if (!this.tenantValidated) {
            this.toastr.warning(
                'Please enter a valid tenant name before signing in.',
                'Error',
                { timeOut: 5000, progressBar: true },
            );
            return;
        }

        if (this.signinForm.invalid || !this.hasSignInCredentials()) {
            Object.keys(this.signinForm.controls).forEach(key => {
              this.signinForm.get(key).markAsTouched({ onlySelf: true });
            });

            this.toastr.error(
                'Please fill in all required fields.',
                'Error',
                { timeOut: 5000, progressBar: true },
            );
            return;
        }

        this.loaderService.display(true);
        const formValues = { ...this.signinForm.value };
        formValues.tenancyName = String(formValues.tenancyName ?? '').trim();

        const login$ = this.impersonationContext
            ? this.authService.impersonateSignin({
                impersonatorUserNameOrEmailAddress: formValues.userNameOrEmailAddress,
                impersonatorPassword: formValues.password,
                impersonatorTenancyName: formValues.tenancyName ? formValues.tenancyName : null,
                targetUserId: this.impersonationContext.targetUserId,
                targetTenantId: this.impersonationContext.targetTenantId
            })
            : this.authService.signin(formValues);

        login$.subscribe({
            next: () => {
                this.userService.getUser().subscribe({
                    next: () => {
                        this.loaderService.display(false);
                        this.router.navigateByUrl('/online-shop/order-board');
                        this.navigation.setApplication(Apps.ONLINE_SHOP, false);

                        const defaultLanguageSource = this.store.getItem('defaultLanguage');
                        this.translate.use(defaultLanguageSource);

                        this.toastr.success(
                            'Welcome! You have signed in successfully.',
                            'Success',
                            { timeOut: 5000, progressBar: true },
                        );
                        this.loading = false;

                        if (!this.signalRService.signalRConnectionEnabled) {
                            this.signalRService.startConnection();
                        }
                    },
                    error: (error) => this.handleLoginError(error),
                });
            },
            error: (error) => this.handleLoginError(error),
        });
    }

    private handleLoginError(error: any): void {
        const message = this.extractLoginErrorMessage(error);
        this.toastr.error(message, 'Error', { timeOut: 5000, progressBar: true });
        this.loaderService.display(false);
    }

    private extractLoginErrorMessage(error: any): string {
        const raw =
            error?.error?.error?.message
            ?? error?.error?.message
            ?? error?.message;

        if (!raw) {
            return 'Sign in failed. Please check your credentials and try again.';
        }

        const text = String(raw).trim();
        if (this.looksLikeTranslationKey(text)) {
            return this.humanizeTranslationKey(text);
        }

        return text;
    }

    private looksLikeTranslationKey(value: string): boolean {
        return /^[a-z][a-z0-9_]*$/i.test(value) && value.includes('_');
    }

    private humanizeTranslationKey(key: string): string {
        const known: Record<string, string> = {
            InvalidUserNameOrPassword: 'Invalid username or password.',
            InvalidUserNameOrEmailAddress: 'Invalid username or email address.',
            UserIsNotActive: 'This user account is not active.',
            TenantIsNotActive: 'This tenant is not active.',
        };

        if (known[key]) {
            return known[key];
        }

        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (char) => char.toUpperCase());
    }

    selectedLanguage() {
        const browserlang = localStorage.getItem('lang');
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
        this.selectedLanguage();
    }

    onInputFocusForSignInForm(event: any) {
    };

    onInputChangeForSignInForm(event: any){
    };

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }
}
