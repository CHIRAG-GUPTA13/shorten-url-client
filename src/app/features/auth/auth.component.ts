import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="min-h-screen bg-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <!-- Background Grid -->
      <div class="fixed inset-0 opacity-10 pointer-events-none" 
           style="background-image: radial-gradient(#1a1a24 1px, transparent 1px); background-size: 32px 32px;"></div>
      
      <div class="w-full max-w-md z-10" @fadeSlide>
        <!-- Logo/Header -->
        <div class="mb-12 flex items-center gap-4">
          <div class="w-12 h-12 border-2 border-accent-green flex items-center justify-center font-mono font-bold text-2xl text-accent-green">
            λ
          </div>
          <div>
            <h1 class="text-3xl font-mono font-bold tracking-tighter uppercase whitespace-nowrap">
              Link<span class="text-accent-green">Core</span>
            </h1>
            <p class="text-muted text-xs font-mono uppercase tracking-widest">URL Optimization Protocol</p>
          </div>
        </div>

        <div class="card relative overflow-hidden">
          <!-- Accent top border -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-accent-green"></div>
          
          <div class="flex border-b border-dark-border mb-8">
            <button (click)="mode.set('login')" 
                    [class.border-accent-green]="mode() === 'login'"
                    [class.text-accent-green]="mode() === 'login'"
                    class="flex-1 py-4 font-mono text-sm uppercase tracking-widest border-b-2 border-transparent transition-all">
              Access
            </button>
            <button (click)="mode.set('register')" 
                    [class.border-accent-green]="mode() === 'register'"
                    [class.text-accent-green]="mode() === 'register'"
                    class="flex-1 py-4 font-mono text-sm uppercase tracking-widest border-b-2 border-transparent transition-all">
              Initialize
            </button>
          </div>

          @if (error()) {
            <div class="bg-accent-red/10 border border-accent-red text-accent-red p-3 font-mono text-xs mb-6 uppercase">
              [Error]: {{ error() }}
            </div>
          }

          <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="block font-mono text-xs text-muted uppercase tracking-widest mb-2">System.Identifier (Email)</label>
              <input type="email" formControlName="email" class="input" placeholder="user@nexus.io">
              @if (authForm.get('email')?.touched && authForm.get('email')?.invalid) {
                <span class="text-accent-red text-[10px] font-mono mt-1 block uppercase">Entry format invalid</span>
              }
            </div>

            <div>
              <label class="block font-mono text-xs text-muted uppercase tracking-widest mb-2">Access.Protocol (Password)</label>
              <input type="password" formControlName="password" class="input" placeholder="••••••••">
              @if (authForm.get('password')?.touched && authForm.get('password')?.invalid) {
                <span class="text-accent-red text-[10px] font-mono mt-1 block uppercase">Security string required</span>
              }
            </div>

            <button type="submit" class="btn btn-primary w-full py-4 uppercase font-bold tracking-[0.2em]" [disabled]="loading()">
              @if (loading()) {
                <span class="animate-pulse">Authorizing...</span>
              } @else {
                {{ mode() === 'login' ? 'Execute Access' : 'Register Identity' }}
              }
            </button>
          </form>

          <div class="mt-8 pt-8 border-t border-dark-border flex justify-between items-center text-[10px] font-mono text-muted uppercase tracking-widest">
            <span>Security Status: 0x01</span>
            <span>v2.0.4-LTS</span>
          </div>
        </div>
        
        <p class="text-center mt-8 font-mono text-[10px] text-muted opacity-50 uppercase tracking-[0.3em]">
          Restricted access. All sessions are logged.
        </p>
      </div>
    </div>
  `
})
export class AuthComponent {
  mode = signal<'login' | 'register'>('login');
  authForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request = this.authForm.value;
    const authObs = this.mode() === 'login' 
      ? this.authService.login(request)
      : this.authService.register(request);

    authObs.subscribe({
      next: () => {
        this.router.navigate(['/shorten']);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Authentication sequence failed.');
        this.loading.set(false);
      }
    });
  }
}
