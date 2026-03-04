import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BrandPreset, ThemeService } from '../../core/theme.service';

function matchFieldsValidator(a: string, b: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const av = ctrl.get(a)?.value;
    const bv = ctrl.get(b)?.value;
    if (av === null || bv === null) return null;
    return av === bv ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly demoUsername = 'admin';
  private readonly demoPassword = 'admin';
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly themeService = inject(ThemeService);

  theme = this.themeService.theme;
  brand = this.themeService.brand;
  readonly presets: Array<{ id: BrandPreset; label: string }> = [
    { id: 'ocean', label: 'Ocean' },
    { id: 'sand', label: 'Sand' },
    { id: 'slate', label: 'Slate' },
  ];

  activeTab = signal<'login' | 'register' | 'recover'>('login');
  isLogin = computed(() => this.activeTab() === 'login');
  isRecover = computed(() => this.activeTab() === 'recover');

  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showRegisterConfirm = signal(false);
  showResetPassword = signal(false);
  showResetConfirm = signal(false);
  authMessage = signal('');
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

  setBrand(preset: BrandPreset) {
    this.themeService.setBrand(preset);
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

  fillDemo() {
    this.switchTab('login');
    this.loginForm.patchValue({
      usernameOrEmail: this.demoUsername,
      password: this.demoPassword,
      remember: true,
    });
    this.authMessage.set('Demo credentials filled. Click Sign In.');
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.authMessage.set('Please enter valid login details.');
      return;
    }

    const username = (this.loginForm.value.usernameOrEmail ?? '').trim().toLowerCase();
    const password = (this.loginForm.value.password ?? '').toString();
    if (username === this.demoUsername && password === this.demoPassword) {
      this.authMessage.set('');
      this.router.navigate(['/layout']);
      return;
    }

    this.authMessage.set('Invalid credentials. Use demo access: admin / admin.');
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.authMessage.set('Please complete the register form correctly.');
      return;
    }

    this.authMessage.set('Register is in demo mode. Please login with demo access.');
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
