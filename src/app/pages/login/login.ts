import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ThemeService } from '../../core/theme.service';
import { environment } from '../../../environments/environment';
import { LoaderService } from '../../core/loader.service';

function matchFieldsValidator(a: string, b: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const av = ctrl.get(a)?.value;
    const bv = ctrl.get(b)?.value;
    if (av === null || bv === null) return null;
    return av === bv ? null : { mismatch: true };
  };
}

function adultIfDateProvidedValidator(field: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const raw = (ctrl.get(field)?.value ?? '').toString().trim();
    if (!raw) return null;

    const dob = new Date(raw);
    if (Number.isNaN(dob.getTime())) return { invalidDob: true };

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 18 ? null : { underage: true };
  };
}

interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
}

interface LoginApiResponse extends ApiEnvelope {
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  drivingLicenseNumber: string;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly accessTokenKey = 'rentx-access-token';
  private readonly refreshTokenKey = 'rentx-refresh-token';
  private readonly tokenExpiryKey = 'rentx-token-expiry';
  private readonly userKey = 'rentx-user';
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly loader = inject(LoaderService);
  private readonly themeService = inject(ThemeService);

  theme = this.themeService.theme;

  activeTab = signal<'login' | 'register' | 'recover'>('login');
  registerStep = signal<'form' | 'verify'>('form');
  isLogin = computed(() => this.activeTab() === 'login');
  isRecover = computed(() => this.activeTab() === 'recover');
  isRegisterForm = computed(() => this.activeTab() === 'register' && this.registerStep() === 'form');
  isRegisterVerify = computed(
    () => this.activeTab() === 'register' && this.registerStep() === 'verify'
  );

  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showRegisterConfirm = signal(false);
  showResetPassword = signal(false);
  showResetConfirm = signal(false);
  authMessage = signal('');
  isSubmitting = signal(false);
  isRegisterSubmitting = signal(false);
  isVerifyingEmail = signal(false);
  resendCooldown = signal(0);
  recoveryCodeSent = signal(false);

  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(1)]],
    remember: [false],
  });

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      drivingLicenseNumber: ['', [Validators.required, Validators.minLength(8)]],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      state: [''],
      pincode: ['', [Validators.pattern(/^\d{6}$/)]],
    },
    {
      validators: [
        matchFieldsValidator('password', 'confirmPassword'),
        adultIfDateProvidedValidator('dateOfBirth'),
      ],
    }
  );

  verifyEmailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  recoveryRequestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  recoveryResetForm: FormGroup = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: matchFieldsValidator('newPassword', 'confirmNewPassword') }
  );

  ngOnDestroy() {
    this.stopResendCooldown();
  }

  switchTab(tab: 'login' | 'register' | 'recover', clearMessage = true) {
    this.activeTab.set(tab);
    if (clearMessage) {
      this.authMessage.set('');
    }
    if (tab !== 'recover') {
      this.recoveryCodeSent.set(false);
      this.recoveryRequestForm.reset();
      this.recoveryResetForm.reset();
    }
    if (tab !== 'register') {
      this.resetRegisterVerificationState();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  togglePassword(field: 'login' | 'register' | 'confirm') {
    if (field === 'login') {
      this.showLoginPassword.update((v) => !v);
      return;
    }
    if (field === 'register') {
      this.showRegisterPassword.update((v) => !v);
      return;
    }
    this.showRegisterConfirm.update((v) => !v);
  }

  toggleResetPassword(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showResetPassword.update((v) => !v);
      return;
    }
    this.showResetConfirm.update((v) => !v);
  }

  onLogin() {
    if (this.isSubmitting()) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.authMessage.set('Please enter valid login details.');
      return;
    }

    const usernameOrEmail = (this.loginForm.value.usernameOrEmail ?? '').trim();
    const password = (this.loginForm.value.password ?? '').toString();
    const rememberMe = !!this.loginForm.value.remember;

    this.loader.show('Signing in...', 'Verifying credentials and loading dashboard.');
    this.isSubmitting.set(true);
    this.http
      .post<LoginApiResponse>(`${this.apiBaseUrl}/auth/login`, {
        usernameOrEmail,
        password,
        rememberMe,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success || !res.data?.accessToken) {
            this.authMessage.set(res?.message || 'Login failed. Please try again.');
            return;
          }

          this.persistSession(res.data);
          this.authMessage.set('');
          this.router
            .navigate(['/layout/dashboard'])
            .then((ok) => {
              if (!ok) {
                this.loader.hide();
                this.authMessage.set('Navigation failed. Please try again.');
              }
            })
            .catch(() => {
              this.loader.hide();
              this.authMessage.set('Navigation failed. Please try again.');
            });
        },
        error: (err: HttpErrorResponse) => {
          this.loader.hide();
          this.authMessage.set(this.resolveLoginError(err));
        },
      });
  }

  onRegister() {
    if (this.isRegisterSubmitting()) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.authMessage.set('Please complete the create account form correctly.');
      return;
    }

    const emailCtrl = this.registerForm.get('email');
    if (!emailCtrl || emailCtrl.invalid) {
      this.authMessage.set('Please enter a valid email address before registration.');
      return;
    }

    const payload = this.buildRegisterPayload();
    this.isRegisterSubmitting.set(true);

    this.http
      .post<ApiEnvelope>(`${this.apiBaseUrl}/auth/register`, payload)
      .pipe(finalize(() => this.isRegisterSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.authMessage.set(res?.message || 'Registration failed. Please try again.');
            return;
          }

          this.registerStep.set('verify');
          this.verifyEmailForm.patchValue({ email: payload.email, code: '' });
          this.authMessage.set(
            res.message || 'Account created. Verification code sent to your email.'
          );
          this.startResendCooldown(60);
        },
        error: (err: HttpErrorResponse) => {
          this.authMessage.set(this.resolveRegisterError(err));
        },
      });
  }

  onVerifyEmail() {
    if (this.isVerifyingEmail()) {
      return;
    }

    if (this.verifyEmailForm.invalid) {
      this.verifyEmailForm.markAllAsTouched();
      this.authMessage.set('Please enter valid email and 6-digit verification code.');
      return;
    }

    const email = (this.verifyEmailForm.value.email ?? '').trim();
    const code = (this.verifyEmailForm.value.code ?? '').trim();

    this.isVerifyingEmail.set(true);
    this.http
      .post<ApiEnvelope>(`${this.apiBaseUrl}/auth/email-verification/verify`, {
        email,
        code,
      })
      .pipe(finalize(() => this.isVerifyingEmail.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.authMessage.set(res?.message || 'Email verification failed.');
            return;
          }

          this.loginForm.patchValue({ usernameOrEmail: email, password: '' });
          this.resetRegisterForms();
          this.switchTab('login', false);
          this.authMessage.set('Email verified successfully. You can sign in now.');
        },
        error: (err: HttpErrorResponse) => {
          this.authMessage.set(this.resolveVerifyError(err));
        },
      });
  }

  onResendVerificationCode() {
    if (this.resendCooldown() > 0 || this.isRegisterSubmitting()) {
      return;
    }

    const email = (this.verifyEmailForm.value.email ?? '').trim();
    if (!email) {
      this.authMessage.set('Email not found. Please register again.');
      return;
    }

    this.isRegisterSubmitting.set(true);
    this.http
      .post<ApiEnvelope>(`${this.apiBaseUrl}/auth/email-verification/resend`, { email })
      .pipe(finalize(() => this.isRegisterSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.authMessage.set(res?.message || 'Unable to resend verification code.');
            return;
          }
          this.startResendCooldown(60);
          this.authMessage.set(res.message || 'Verification code resent to your email.');
        },
        error: (err: HttpErrorResponse) => {
          this.authMessage.set(this.resolveVerifyError(err));
        },
      });
  }

  backToRegisterForm() {
    this.registerStep.set('form');
    this.stopResendCooldown();
    this.verifyEmailForm.patchValue({ code: '' });
  }

  private buildRegisterPayload(): RegisterPayload {
    const v = this.registerForm.value;
    return {
      firstName: (v.firstName ?? '').trim(),
      lastName: (v.lastName ?? '').trim(),
      email: (v.email ?? '').trim(),
      mobileNumber: (v.mobileNumber ?? '').trim(),
      password: (v.password ?? '').toString(),
      confirmPassword: (v.confirmPassword ?? '').toString(),
      drivingLicenseNumber: (v.drivingLicenseNumber ?? '').trim(),
      dateOfBirth: this.toNullable((v.dateOfBirth ?? '').toString().trim()),
      address: this.toNullable((v.address ?? '').toString().trim()),
      city: this.toNullable((v.city ?? '').toString().trim()),
      state: this.toNullable((v.state ?? '').toString().trim()),
      pincode: this.toNullable((v.pincode ?? '').toString().trim()),
    };
  }

  private toNullable(value: string): string | null {
    return value ? value : null;
  }

  private persistSession(data: NonNullable<LoginApiResponse['data']>) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.accessTokenKey, data.accessToken);
    window.localStorage.setItem(this.refreshTokenKey, data.refreshToken);
    window.localStorage.setItem(
      this.tokenExpiryKey,
      new Date(Date.now() + Math.max(0, data.expiresInSeconds) * 1000).toISOString()
    );
    window.localStorage.setItem(this.userKey, JSON.stringify(data.user));
  }

  private resolveLoginError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return `API server unreachable. Check ${this.apiBaseUrl} is running and CORS is enabled.`;
    }

    const apiMessage = this.extractApiMessage(err);
    if (apiMessage) {
      return apiMessage;
    }

    if (err.status === 401) {
      return 'Invalid username or password.';
    }

    return 'Login failed. Please try again.';
  }

  private resolveRegisterError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return `API server unreachable. Check ${this.apiBaseUrl} is running and CORS is enabled.`;
    }

    const apiMessage = this.extractApiMessage(err);
    if (apiMessage) {
      return apiMessage;
    }

    if (err.status === 409) {
      return 'Account with this email already exists.';
    }

    return 'Registration failed. Please check your details and try again.';
  }

  private resolveVerifyError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return `API server unreachable. Check ${this.apiBaseUrl} is running and CORS is enabled.`;
    }

    const apiMessage = this.extractApiMessage(err);
    if (apiMessage) {
      return apiMessage;
    }

    if (err.status === 400) {
      return 'Invalid or expired verification code.';
    }

    return 'Email verification failed. Please try again.';
  }

  private extractApiMessage(err: HttpErrorResponse): string | null {
    const apiMessage = (err.error as { message?: unknown } | null)?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : null;
  }

  private startResendCooldown(seconds: number) {
    this.stopResendCooldown();
    this.resendCooldown.set(seconds);
    this.resendTimer = setInterval(() => {
      const left = this.resendCooldown();
      if (left <= 1) {
        this.stopResendCooldown();
        return;
      }
      this.resendCooldown.set(left - 1);
    }, 1000);
  }

  private stopResendCooldown() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.resendCooldown.set(0);
  }

  private resetRegisterVerificationState() {
    this.registerStep.set('form');
    this.verifyEmailForm.reset({ email: '', code: '' });
    this.isRegisterSubmitting.set(false);
    this.isVerifyingEmail.set(false);
    this.stopResendCooldown();
  }

  private resetRegisterForms() {
    this.registerForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      drivingLicenseNumber: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
    this.resetRegisterVerificationState();
  }

  startRecovery() {
    this.switchTab('recover');
    this.recoveryCodeSent.set(false);
    this.authMessage.set('Enter your account email to receive a reset code.');
  }

  sendRecoveryCode() {
    if (this.recoveryRequestForm.invalid) {
      this.recoveryRequestForm.markAllAsTouched();
      this.authMessage.set('Please enter a valid email address.');
      return;
    }

    this.recoveryCodeSent.set(true);
    this.recoveryResetForm.reset();
    this.authMessage.set('A 6-digit reset code has been sent (demo mode).');
  }

  completeRecovery() {
    if (this.recoveryResetForm.invalid) {
      this.recoveryResetForm.markAllAsTouched();
      this.authMessage.set('Please complete all reset fields correctly.');
      return;
    }

    const email = this.recoveryRequestForm.value.email ?? '';
    this.loginForm.patchValue({ usernameOrEmail: email, password: '' });
    this.authMessage.set('Password updated in demo flow. Sign in with your credentials.');
    this.switchTab('login', false);
  }

  hasErr(formCtrl: AbstractControl | null, err: string) {
    return !!formCtrl && (formCtrl.touched || formCtrl.dirty) && formCtrl.hasError(err);
  }

  recoverHasErr(formCtrl: AbstractControl | null, err: string) {
    return !!formCtrl && (formCtrl.touched || formCtrl.dirty) && formCtrl.hasError(err);
  }

  passwordStrength() {
    const value = (this.registerForm.get('password')?.value ?? '').toString();
    let score = 0;
    if (value.length >= 6) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  strengthLabel() {
    const score = this.passwordStrength();
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  }
}
