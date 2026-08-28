import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { AuthService } from 'src/app/shared/services/auth.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { rewriteMediaUrl } from 'src/app/shared/services/media-url';
import { TenantService } from 'src/app/shared/services/Tenant.service';
import { environment } from 'src/environments/environment';

type ResetStep = 'email' | 'otp' | 'password';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss'],
  animations: [SharedAnimations],
})
export class ForgotComponent implements OnInit, OnDestroy {
  private static readonly TENANT_VALIDATE_DEBOUNCE_MS = 1000;
  private static readonly TENANT_RESOLUTION_AVAILABLE = 1;

  step: ResetStep = 'email';
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  secondsLeft = 0;
  emailAddress = '';
  tenantId = 0;
  showPassword = false;
  showConfirmPassword = false;
  tenantValidating = false;
  tenantValidated = false;

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private storefrontLogoUrl: string | null = null;
  private failedLogoUrl: string | null = null;
  private lastValidatedTenantName = '';
  private readonly destroy$ = new Subject<void>();
  private readonly tenantBlur$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private tenantService: TenantService,
    private restService: RestService,
    public globalDataService: GlobalDataService,
    public translate: TranslateService,
  ) {
    this.emailForm = this.fb.group({
      tenancyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
    });
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.setupTenantValidation();
    this.loadBrandStorefrontLogo();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canSendCode(): boolean {
    return !this.tenantValidating && this.tenantValidated && !this.loading;
  }

  get canResend(): boolean {
    return this.secondsLeft <= 0 && !this.loading;
  }

  get signinLogoUrl(): string | null {
    const url = String(this.storefrontLogoUrl ?? '').trim();
    if (!url || url === this.failedLogoUrl) {
      return null;
    }
    return url;
  }

  onSigninLogoError(): void {
    if (this.storefrontLogoUrl) {
      this.failedLogoUrl = this.storefrontLogoUrl;
    }
  }

  onTenantNameBlur(): void {
    this.tenantBlur$.next();
  }

  touchedInvalid(form: FormGroup, name: string): boolean {
    const control = form.get(name);
    return !!control && control.touched && control.invalid;
  }

  hasError(form: FormGroup, name: string, error: string): boolean {
    return !!form.get(name)?.hasError(error);
  }

  showPasswordMismatch(): boolean {
    if (!this.passwordForm.errors?.['mismatch']) {
      return false;
    }
    const password = this.passwordForm.get('password');
    const confirm = this.passwordForm.get('confirmPassword');
    if (!password?.touched && !confirm?.touched) {
      return false;
    }
    return String(confirm?.value ?? '').length > 0;
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  submitEmail(): void {
    if (!this.tenantValidated) {
      this.toastr.warning(
        'Please enter a valid company name before continuing.',
        'Error',
        { timeOut: 5000, progressBar: true },
      );
      return;
    }

    if (this.emailForm.invalid || this.loading) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.emailAddress = String(this.emailForm.value.email || '').trim();
    this.tenantId = this.globalDataService.getCurrentTanantId();
    this.sendCode();
  }

  submitOtp(): void {
    if (this.otpForm.invalid || this.loading) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.checkPasswordResetOtp(this.emailAddress, this.otpForm.value.otpCode, this.tenantId).subscribe({
      next: () => {
        this.loading = false;
        this.clearTimer();
        this.step = 'password';
      },
      error: (error) => {
        this.loading = false;
        this.showError(error);
      },
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid || this.loading) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { password, confirmPassword } = this.passwordForm.value;
    this.authService.changePasswordByOtp(this.emailAddress, password, confirmPassword, this.tenantId).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success(
          'Password changed successfully. You can now sign in.',
          'Success',
          { timeOut: 5000, progressBar: true },
        );
        void this.router.navigate(['/sessions/signin']);
      },
      error: (error) => {
        this.loading = false;
        this.showError(error);
      },
    });
  }

  resendCode(): void {
    if (!this.canResend) {
      return;
    }
    this.sendCode(true);
  }

  private sendCode(isResend = false): void {
    this.loading = true;
    this.authService.resetPasswordRequest(this.emailAddress, this.tenantId).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success(
          'A 5-digit code has been sent to your email.',
          'OTP Sent!',
          { timeOut: 5000, progressBar: true },
        );
        this.otpForm.reset();
        this.step = 'otp';
        this.startTimer();
      },
      error: (error) => {
        this.loading = false;
        if (!isResend) {
          this.emailAddress = '';
        }
        this.showError(error);
      },
    });
  }

  private setupTenantValidation(): void {
    const tenancyNameControl = this.emailForm.get('tenancyName');
    if (!tenancyNameControl) {
      return;
    }

    const tenancyName$ = tenancyNameControl.valueChanges.pipe(
      map((value) => String(value ?? '').trim()),
      tap((tenancyName) => {
        if (!tenancyName || tenancyName !== this.lastValidatedTenantName) {
          this.tenantValidated = false;
        }
      }),
    );

    const debouncedInput$ = tenancyName$.pipe(
      debounceTime(ForgotComponent.TENANT_VALIDATE_DEBOUNCE_MS),
      distinctUntilChanged(),
    );

    const blurInput$ = this.tenantBlur$.pipe(
      map(() => String(tenancyNameControl.value ?? '').trim()),
      filter((tenancyName) => {
        if (!tenancyName) {
          return false;
        }
        return !(tenancyName === this.lastValidatedTenantName && this.tenantValidated);
      }),
    );

    merge(debouncedInput$, blurInput$).pipe(
      distinctUntilChanged(),
      switchMap((tenancyName) => this.validateTenantName$(tenancyName)),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  private validateTenantName$(tenancyName: string): Observable<void> {
    if (!tenancyName) {
      this.tenantValidated = false;
      this.lastValidatedTenantName = '';
      this.tenantValidating = false;
      return of(void 0);
    }

    if (tenancyName === this.lastValidatedTenantName && this.tenantValidated) {
      return of(void 0);
    }

    this.tenantValidating = true;
    this.tenantValidated = false;

    return this.tenantService.checkTenantAvailability(tenancyName).pipe(
      tap((available) => {
        if (available) {
          this.tenantValidated = true;
          this.lastValidatedTenantName = tenancyName;
          this.tenantId = this.globalDataService.getCurrentTanantId();
          return;
        }

        this.tenantValidated = false;
        this.lastValidatedTenantName = '';
        this.toastr.error(
          'Company not found. Please check the company name and try again.',
          'Error',
          { timeOut: 5000, progressBar: true },
        );
      }),
      catchError(() => {
        this.tenantValidated = false;
        this.lastValidatedTenantName = '';
        this.toastr.error(
          'Unable to validate company. Please try again.',
          'Error',
          { timeOut: 5000, progressBar: true },
        );
        return of(false);
      }),
      map(() => void 0),
      finalize(() => {
        this.tenantValidating = false;
      }),
    );
  }

  private startTimer(): void {
    this.clearTimer();
    this.secondsLeft = 180;
    this.timerHandle = setInterval(() => {
      this.secondsLeft -= 1;
      if (this.secondsLeft <= 0) {
        this.clearTimer();
        this.authService.expirePasswordResetOtp(this.emailAddress, this.tenantId).subscribe();
        this.toastr.info('The code has expired. Request a new one.');
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private loadBrandStorefrontLogo(): void {
    const hostName = String(environment.onlineShopBrandHostName ?? '').trim();
    if (!hostName) {
      return;
    }

    this.restService.postWithOutSpinner(
      environment.urls.WebsiteTenantResolver_ResolveTenantByDomain,
      { hostName },
    ).pipe(
      map((response: { result?: Record<string, unknown> }) => {
        const result = response?.result ?? {};
        const state = Number(result.state ?? result.State ?? 0);
        if (state !== ForgotComponent.TENANT_RESOLUTION_AVAILABLE) {
          return 0;
        }
        return Number(result.tenantId ?? result.TenantId ?? 0);
      }),
      switchMap((tenantId) => {
        if (!tenantId) {
          return of(null);
        }
        return this.fetchStorefrontLogo$(tenantId);
      }),
      catchError(() => of(null)),
    ).subscribe((logoUrl) => {
      if (logoUrl) {
        this.storefrontLogoUrl = logoUrl;
      }
    });
  }

  private fetchStorefrontLogo$(tenantId: number): Observable<string | null> {
    const path = `${environment.urls.OnlineShopStoreLogo_GetForStorefront}?TenantId=${tenantId}`;
    return this.restService.getDirect(path).pipe(
      map((response: { result?: { url?: string; Url?: string } }) => {
        const raw = String(response?.result?.url ?? response?.result?.Url ?? '').trim();
        return rewriteMediaUrl(raw) || null;
      }),
      catchError(() => of(null)),
    );
  }

  private showError(error: unknown): void {
    const message =
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message
      ?? (error as { message?: string })?.message
      ?? 'Something went wrong. Please try again.';
    this.toastr.error(String(message), 'Error', { progressBar: true });
  }

  private passwordMatchValidator(group: AbstractControl): { mismatch: boolean } | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }
}
