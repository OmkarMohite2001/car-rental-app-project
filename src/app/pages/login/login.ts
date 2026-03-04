import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ThemeService } from '../../core/theme.service';
import { environment } from '../../../environments/environment';

function matchFieldsValidator(a: string, b: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const av = ctrl.get(a)?.value;
    const bv = ctrl.get(b)?.value;
    if (av === null || bv === null) return null;
    return av === bv ? null : { mismatch: true };
  };
}

interface LoginApiResponse {
  success: boolean;
  message: string;
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
  meta?: unknown;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly accessTokenKey = 'rentx-access-token';
  private readonly refreshTokenKey = 'rentx-refresh-token';
  private readonly tokenExpiryKey = 'rentx-token-expiry';
  private readonly userKey = 'rentx-user';
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly themeService = inject(ThemeService);

  theme = this.themeService.theme;

  activeTab = signal<'login' | 'register' | 'recover'>('login');
  isLogin = computed(() => this.activeTab() === 'login');
  isRecover = computed(() => this.activeTab() === 'recover');

  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showRegisterConfirm = signal(false);
  showResetPassword = signal(false);
  showResetConfirm = signal(false);
  authMessage = signal('');
  isSubmitting = signal(false);
  recoveryCodeSent = signal(false);

  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(1)]],
    remember: [false],
  });

  registerForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: matchFieldsValidator('password', 'confirmPassword') }
  );

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
          this.router.navigate(['/layout']);
        },
        error: (err: HttpErrorResponse) => {
          this.authMessage.set(this.resolveLoginError(err));
        },
      });
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

    const apiMessage = (err.error as { message?: unknown } | null)?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (err.status === 401) {
      return 'Invalid username or password.';
    }

    return 'Login failed. Please try again.';
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.authMessage.set('Please complete the register form correctly.');
      return;
    }

    this.authMessage.set('Registration API is not connected yet.');
    this.switchTab('login', false);
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
