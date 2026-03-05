import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderService } from '../../core/loader.service';
import { environment } from '../../../environments/environment';

interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: unknown;
}

interface MeProfileApiData {
  profileType?: string;
  role?: string;
  originalRole?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notifEmail?: boolean;
  notifSms?: boolean;
  notifWhatsApp?: boolean;
}

function passwordGroupValidator(ctrl: AbstractControl): ValidationErrors | null {
  const current = (ctrl.get('current')?.value ?? '').toString();
  const next = (ctrl.get('next')?.value ?? '').toString();
  const confirm = (ctrl.get('confirm')?.value ?? '').toString();

  // Password section is optional. Validate only if user starts filling it.
  if (!current && !next && !confirm) return null;

  const errors: Record<string, boolean> = {};
  if (!current) errors['currentRequired'] = true;
  if (!next || next.length < 6) errors['nextWeak'] = true;
  if (next !== confirm) errors['mismatch'] = true;

  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit, OnDestroy {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly accessTokenKey = 'rentx-access-token';
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private loader = inject(LoaderService);
  private snack = inject(MatSnackBar);
  private avatarPreviewObjectUrl: string | null = null;

  avatarUrl = signal<string>('assets/avatar/default.png');

  today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  minDob = new Date(1900, 0, 1);
  maxDob = this.today;

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    gender: [''],
    dob: [null as Date | null],

    address: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],

    notifEmail: [true],
    notifSms: [false],
    notifWhatsApp: [false],

    password: this.fb.group(
      {
        current: [''],
        next: [''],
        confirm: ['']
      },
      { validators: passwordGroupValidator }
    )
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  has(ctrl: string, err: string) {
    const control = this.form.get(ctrl);
    return !!control && (control.touched || control.dirty) && control.hasError(err);
  }

  passHas(err: string) {
    const group = this.form.get('password');
    return !!group && (group.touched || group.dirty) && group.hasError(err);
  }

  displayName(): string {
    const fullName = (this.form.get('fullName')?.value ?? '').toString().trim();
    const username = (this.form.get('username')?.value ?? '').toString().trim();
    return fullName || username || 'Your Profile';
  }

  displayEmail(): string {
    const email = (this.form.get('email')?.value ?? '').toString().trim();
    return email || 'Add your email address';
  }

  profileCompletion(): number {
    const keys = ['fullName', 'username', 'email', 'phone', 'gender', 'dob', 'address', 'city', 'state', 'pincode'];
    const filledFields = keys.filter((key) => {
      const value = this.form.get(key)?.value;
      if (value instanceof Date) return true;
      return value !== null && value !== undefined && value.toString().trim().length > 0;
    }).length;

    return Math.round((filledFields / keys.length) * 100);
  }

  enabledPreferencesCount(): number {
    const enabled = [
      this.form.get('notifEmail')?.value,
      this.form.get('notifSms')?.value,
      this.form.get('notifWhatsApp')?.value
    ];
    return enabled.filter(Boolean).length;
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    if (this.avatarPreviewObjectUrl) {
      URL.revokeObjectURL(this.avatarPreviewObjectUrl);
    }

    const localUrl = URL.createObjectURL(file);
    this.avatarPreviewObjectUrl = localUrl;
    this.avatarUrl.set(localUrl);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('password')?.errors?.['mismatch']) {
        this.snack.open('New password and confirm password must match.', 'OK', { duration: 2200 });
      } else if (this.form.get('password')?.errors?.['nextWeak']) {
        this.snack.open('New password must be at least 6 characters.', 'OK', { duration: 2200 });
      }
      return;
    }

    const payload = this.form.value;
    console.log('PROFILE =>', payload);
    this.snack.open('Profile updated successfully.', 'OK', { duration: 2000 });
  }

  resetAll() {
    this.form.reset({
      notifEmail: true,
      notifSms: false,
      notifWhatsApp: false
    });
  }

  ngOnDestroy(): void {
    if (this.avatarPreviewObjectUrl) {
      URL.revokeObjectURL(this.avatarPreviewObjectUrl);
    }
  }

  private loadProfile() {
    const token = this.getAccessToken();
    if (!token) {
      this.snack.open('Session token not found. Please login again.', 'OK', { duration: 2500 });
      return;
    }

    this.loader.show('Loading profile...', 'Fetching your latest account details.');
    this.http
      .get<ApiEnvelope<MeProfileApiData>>(`${this.apiBaseUrl}/me/profile`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      })
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          if (!res?.success || !res.data) {
            this.snack.open(res?.message || 'Failed to load profile details.', 'OK', { duration: 2500 });
            return;
          }
          this.patchProfileForm(res.data);
        },
        error: (err: HttpErrorResponse) => {
          this.snack.open(this.resolveProfileError(err), 'OK', { duration: 3000 });
        }
      });
  }

  private patchProfileForm(data: MeProfileApiData) {
    this.form.patchValue({
      fullName: (data.fullName ?? '').trim(),
      username: this.deriveUsername(data),
      email: (data.email ?? '').trim(),
      phone: (data.phone ?? '').trim(),
      address: (data.address ?? '').trim(),
      city: (data.city ?? '').trim(),
      state: (data.state ?? '').trim(),
      pincode: (data.pincode ?? '').trim(),
      notifEmail: !!data.notifEmail,
      notifSms: !!data.notifSms,
      notifWhatsApp: !!data.notifWhatsApp
    });

    this.form.markAsPristine();
  }

  private deriveUsername(data: MeProfileApiData): string {
    const emailUsername = (data.email ?? '').split('@')[0]?.trim();
    if (emailUsername && emailUsername.length >= 3) {
      return emailUsername;
    }

    const fullNameSlug = (data.fullName ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    if (fullNameSlug.length >= 3) {
      return fullNameSlug;
    }

    const userId = (data.userId ?? '').trim();
    if (userId.length >= 3) {
      return userId;
    }

    return 'customer.user';
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(this.accessTokenKey);
  }

  private resolveProfileError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return `API server unreachable. Check ${this.apiBaseUrl} is running and CORS is enabled.`;
    }

    const apiMessage = this.extractApiMessage(err);
    if (apiMessage) {
      return apiMessage;
    }

    if (err.status === 401) {
      return 'Your session has expired. Please login again.';
    }

    if (err.status === 403) {
      return 'You do not have permission to view this profile.';
    }

    return 'Unable to load profile right now. Please try again.';
  }

  private extractApiMessage(err: HttpErrorResponse): string | null {
    const apiMessage = (err.error as { message?: unknown } | null)?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : null;
  }
}
