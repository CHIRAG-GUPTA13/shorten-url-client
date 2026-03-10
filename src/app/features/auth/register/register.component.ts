import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <mat-card class="w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">URL Shortener</h1>
          <p class="text-gray-600">Create your account</p>
        </div>

        @if (error()) {
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error() }}
          </div>
        }

        @if (success()) {
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Account created successfully! Redirecting to login...
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <mat-form-field class="w-full mb-4">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="Enter your email">
            <mat-icon matSuffix>email</mat-icon>
            @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
              <mat-error>Email is required</mat-error>
            }
            @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
              <mat-error>Please enter a valid email</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-full mb-4">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter your password">
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
            @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
              <mat-error>Password must be at least 6 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-full mb-6">
            <mat-label>Confirm Password</mat-label>
            <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirm your password">
            <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword.set(!hideConfirmPassword())">
              <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
              <mat-error>Please confirm your password</mat-error>
            }
            @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" class="w-full py-2" [disabled]="loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Sign Up
            }
          </button>
        </form>

        <div class="text-center mt-6">
          <p class="text-gray-600">
            Already have an account?
            <a routerLink="/auth/login" class="text-blue-600 hover:underline">Sign in</a>
          </p>
        </div>
      </mat-card>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const { email, password } = this.registerForm.value;

    this.authService.register({ email, password }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
