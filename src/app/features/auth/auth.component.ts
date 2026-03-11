import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="auth-screen">
      <div class="auth-container" @fadeSlide>
        <!-- Logo Area -->
        <div class="auth-brand">
          <h1 class="glow-text">LINKCORE</h1>
          <p class="sub-brand">SECURITY.ACCESS_PROTOCOL.v2</p>
        </div>

        <div class="panel corner-accent bracket-tl bracket-tr bracket-bl bracket-br">
          <div class="tabs">
            <button class="tab-btn" [class.active]="mode() === 'login'" (click)="mode.set('login')">01. ACCESS</button>
            <button class="tab-btn" [class.active]="mode() === 'register'" (click)="mode.set('register')">02. INITIALIZE</button>
          </div>

          <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="terminal-form">
            <div class="form-group">
              <label>SYSTEM_IDENTIFIER (EMAIL)</label>
              <input type="email" formControlName="email" class="input" placeholder="user@nexus.io">
            </div>

            @if (mode() === 'register') {
              <div class="form-group" @fadeSlide>
                <label>USER_ALIAS (USERNAME)</label>
                <input type="text" formControlName="username" class="input" placeholder="nexus_user">
              </div>
            }

            <div class="form-group">
              <label>SECURITY_STRING (PASSWORD)</label>
              <input type="password" formControlName="password" class="input" placeholder="••••••••">
            </div>

            <button type="submit" class="btn btn-primary full-width mt-10" [disabled]="loading()">
              {{ loading() ? 'AUTHORIZING...' : (mode() === 'login' ? 'EXECUTE_LOGIN' : 'REGISTER_IDENTITY') }}
            </button>
          </form>

          @if (errorMessage()) {
             <p class="error-text mt-20">> CRITICAL_FAILURE: {{ errorMessage() }}</p>
          }
        </div>

        <div class="auth-footer">
          <p>> ENCRYPTION: AES-256-GCM</p>
          <p>> ALL SESSIONS ARE MONITORED</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-screen { 
      min-height: 100vh; display: flex; align-items: center; justify-content: center; 
      background: var(--bg-color); position: relative;
    }
    .auth-container { width: 400px; display: flex; flex-direction: column; gap: 30px; z-index: 10; }
    
    .auth-brand { text-align: center; }
    .glow-text { color: var(--accent-green); font-size: 32px; letter-spacing: 0.2em; text-shadow: var(--glow-green); }
    .sub-brand { font-size: 10px; color: var(--text-dim); margin-top: 5px; }

    .tabs { display: flex; margin-bottom: 30px; border-bottom: 1px solid var(--border-color); }
    .tab-btn { flex: 1; background: transparent; border: none; color: var(--text-dim); padding: 15px; font-family: inherit; font-size: 11px; cursor: pointer; transition: 0.2s; }
    .tab-btn.active { color: var(--accent-green); border-bottom: 2px solid var(--accent-green); }

    .terminal-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 9px; color: var(--text-dim); }

    .full-width { width: 100%; justify-content: center; padding: 15px; }
    .mt-10 { margin-top: 10px; }
    .mt-20 { margin-top: 20px; }

    .auth-footer { font-size: 9px; color: var(--text-dim); text-align: center; display: flex; flex-direction: column; gap: 5px; opacity: 0.5; }
    .error-text { text-align: center; }
  `]
})
export class AuthComponent {
  mode = signal<'login' | 'register'>('login');
  authForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.authForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const val = this.authForm.value;
    const obs$: Observable<any> = this.mode() === 'login' 
      ? this.authService.login({ email: val.email, password: val.password })
      : this.authService.register(val);

    obs$.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(`[${err.status || 401}] ${err.error?.message || 'AUTHORIZATION_DENIED'}`);
      }
    });
  }
}
