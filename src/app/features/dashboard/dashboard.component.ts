import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UrlService } from '../../core/services/url.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="max-w-4xl mx-auto" @slideUp>
      <div class="mb-12">
        <h2 class="text-4xl font-mono font-bold tracking-tighter uppercase mb-2">
          URL<span class="text-accent-green">.Compactor</span>
        </h2>
        <div class="flex items-center gap-4">
           <div class="h-px flex-1 bg-dark-border"></div>
           <p class="text-[10px] font-mono text-muted uppercase tracking-[0.4em]">Protocol: SHRT-256</p>
           <div class="h-px flex-1 bg-dark-border"></div>
        </div>
      </div>

      <div class="card relative mb-12">
        <div class="absolute -top-px -left-px w-4 h-4 border-t border-l border-accent-green"></div>
        <div class="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-accent-green"></div>
        
        <form [formGroup]="shortenForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <div>
            <label class="block font-mono text-[10px] text-muted uppercase tracking-widest mb-3">Target.Resource_Locator (Long URL)</label>
            <input type="url" formControlName="longUrl" class="input py-4 text-base" placeholder="https://external-resource.io/path/to/data...">
            @if (shortenForm.get('longUrl')?.touched && shortenForm.get('longUrl')?.invalid) {
              <span class="text-accent-red text-[10px] font-mono mt-1 block uppercase">Valid URI Required</span>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label class="block font-mono text-[10px] text-muted uppercase tracking-widest mb-3">Custom.Alias (Optional)</label>
              <div class="flex">
                <span class="bg-dark-border border border-r-0 border-dark-border px-3 flex items-center text-muted font-mono text-xs">/</span>
                <input type="text" formControlName="customSlug" class="input" placeholder="custom-slug">
              </div>
            </div>
            <div>
              <label class="block font-mono text-[10px] text-muted uppercase tracking-widest mb-3">Expiration.Timestamp (Optional)</label>
              <input type="datetime-local" formControlName="expiresAt" class="input">
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn btn-primary w-full py-5 text-base uppercase font-bold tracking-[0.3em]" [disabled]="loading()">
              @if (loading()) {
                <span class="animate-pulse">Compacting Stream...</span>
              } @else {
                Initialize Compact URL
              }
            </button>
          </div>
        </form>
      </div>

      @if (result()) {
        <div class="card accent-border bg-dark-lighter/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex flex-col md:flex-row gap-8 items-start">
            <div class="flex-1 space-y-6">
              <div>
                <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-2">Compact.Result</h3>
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-dark border border-dark-border p-4 font-mono text-accent-green text-lg select-all break-all">
                    {{ getFullShortUrl(result()?.shortCode) }}
                  </div>
                  <button (click)="copyToClipboard()" class="btn btn-secondary h-full py-4 px-6 hover:text-accent-green hover:border-accent-green">
                    COPY
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 border border-dark-border">
                  <div class="text-[9px] font-mono text-muted uppercase mb-1">Status</div>
                  <div class="text-xs font-mono uppercase text-accent-blue">ACTIVE_NODE</div>
                </div>
                <div class="p-4 border border-dark-border">
                  <div class="text-[9px] font-mono text-muted uppercase mb-1">Short.Code</div>
                  <div class="text-xs font-mono text-white">{{ result()?.shortCode }}</div>
                </div>
              </div>
            </div>

            <div class="w-full md:w-48">
              <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-4 text-center md:text-left">QR.Module</h3>
              <div class="bg-white p-2 border-4 border-dark-border aspect-square w-full max-w-[200px] mx-auto md:mx-0">
                <img [src]="getQrUrl(result()?.shortCode)" alt="QR Code" class="w-full h-full grayscale hover:grayscale-0 transition-all cursor-pointer">
              </div>
              <p class="text-[9px] font-mono text-muted mt-3 text-center md:text-left uppercase">Scan to Redirect</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  shortenForm: FormGroup;
  loading = signal(false);
  result = signal<any | null>(null);

  constructor(
    private fb: FormBuilder,
    private urlService: UrlService
  ) {
    this.shortenForm = this.fb.group({
      longUrl: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
      customSlug: [''],
      expiresAt: ['']
    });
  }

  onSubmit(): void {
    if (this.shortenForm.invalid) {
      this.shortenForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.shortenForm.value;

    const request = {
      longUrl: formValue.longUrl,
      customSlug: formValue.customSlug || undefined,
      expiresAt: formValue.expiresAt || undefined
    };

    this.urlService.shortenUrl(request).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Compaction failed.');
      }
    });
  }

  getFullShortUrl(code: string | undefined): string {
    if (!code) return '';
    return `${environment.apiBaseUrl}/${code}`;
  }

  getQrUrl(code: string | undefined): string {
    if (!code) return '';
    return `${environment.apiBaseUrl}/api/urls/${code}/qr/image`;
  }

  copyToClipboard(): void {
    const url = this.getFullShortUrl(this.result()?.shortCode);
    navigator.clipboard.writeText(url);
    // Could add a toast here
  }
}
