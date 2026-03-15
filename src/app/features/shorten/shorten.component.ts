import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UrlService } from '../../core/services/url.service';
import { environment } from '../../../environments/environment';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-shorten',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slideUpFade', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.23, 1, 0.32, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="shorten-container" @slideUpFade>
      <div class="panel corner-accent bracket-tl bracket-tr">
        <h2 class="panel-title">TERMINAL.INITIALIZE_SHORTEN</h2>
        
        <form [formGroup]="shortenForm" (ngSubmit)="onShorten()" class="terminal-form">
          <div class="form-group">
            <label class="label-cyan">TARGET_URL (LONG)</label>
            <div class="input-wrapper">
              <input type="url" formControlName="longUrl" class="input" placeholder="https://external-resource.net/data/stream/..." #longUrlInput maxlength="2048">
              <div class="char-counter" [class.text-green]="longUrlInput.value.length > 0">
                LEN: {{ longUrlInput.value.length }} / 2048
              </div>
            </div>
            @if (shortenForm.get('longUrl')?.touched && shortenForm.get('longUrl')?.invalid) {
              <span class="error-text">> ERROR: VALID_PROTOCOL_REQUIRED (HTTP/HTTPS)</span>
            }
          </div>

          <div class="mode-toggle">
            <span class="mode-label">GENERATION_MODE:</span>
            <div class="toggle-switch" (click)="toggleMode()">
              <button type="button" class="toggle-btn" [class.active]="!customMode()">AUTO-GENERATE</button>
              <button type="button" class="toggle-btn" [class.active]="customMode()">CUSTOM ALIAS</button>
            </div>
          </div>

          @if (customMode()) {
            <div class="form-group" @slideUpFade>
                <label>CUSTOM_ALIAS</label>
                <div class="flex-input">
                    <span class="input-prefix">DOMAIN/</span>
                    <input type="text" formControlName="customSlug" class="input" placeholder="my-custom-path">
                </div>
            </div>
          }

          <div class="mode-toggle">
            <span class="label-cyan">EXPIRATION:</span>
            <div class="toggle-switch" (click)="toggleExpiry()">
              <button type="button" class="toggle-btn" [class.active]="!expiryEnabled()">NO_EXPIRY</button>
              <button type="button" class="toggle-btn" [class.active]="expiryEnabled()">SET_DATE</button>
            </div>
          </div>
 
          @if (expiryEnabled()) {
            <div class="form-group" @slideUpFade>
              <label class="label-cyan">EXPIRATION_DATE (MM/DD/YYYY)</label>
              <input type="datetime-local" formControlName="expiresAt" class="input">
            </div>
          } @else {
            <div class="info-note-box py-10" @slideUpFade>
              <p class="text-dim text-[10px]">> NOTE: FREE_ACCOUNTS_AUTO_EXPIRE_INACTIVE_LINKS_AFTER_1_YEAR</p>
            </div>
          }

          <button type="submit" class="btn btn-primary full-width" [disabled]="loading()">
            @if (loading()) { <span class="pulse-dot bg-dark"></span> PROCESSING... } 
            @else { GENERATE_LINK }
          </button>
        </form>
      </div>

      <!-- Result Card -->
      @if (result()) {
        <div class="panel corner-accent bracket-bl bracket-br result-card" @slideUpFade>
          <div class="result-header">
            <span class="text-green">COMPRESSION_COMPLETE ✓</span>
            <span class="text-dim">ID: {{ result()?.shortCode }}</span>
          </div>
          
          <div class="result-body">
            <div class="qr-preview">
              <img [src]="getQrUrl(result()?.shortCode)" alt="QR">
            </div>
            <div class="result-info">
              <label>COMPACT_KEY:</label>
              <div class="copy-box">
                <span class="short-url">{{ getFullUrl(result()?.shortCode) }}</span>
                <button class="copy-btn" (click)="copyToClipboard()">
                  {{ copied() ? 'COPIED ✓' : 'COPY' }}
                </button>
              </div>
              <p class="text-dim mt-10">ORIGINAL: {{ result()?.originalUrl }}</p>
            </div>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <div class="panel error-panel corner-accent bracket-bl bracket-br">
           <p class="error-text">> CRITICAL_FAILURE: {{ errorMessage() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .shorten-container { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .panel-title { font-size: 14px; margin-bottom: 25px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
    
    .terminal-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; position: relative; }
    .form-group label { font-size: 10px; color: var(--text-dim); }
    
    .input-wrapper { position: relative; }
    .char-counter { position: absolute; right: 10px; bottom: -18px; font-size: 9px; color: var(--text-dim); }
    .text-green { color: var(--accent-green); }

    .mode-toggle { display: flex; align-items: center; gap: 15px; margin: 10px 0; }
    .mode-label { font-size: 10px; color: var(--text-dim); }
    .toggle-switch { display: flex; background: var(--bg-color); border: 1px solid var(--border-color); padding: 2px; }
    .toggle-btn { padding: 5px 12px; font-family: inherit; font-size: 9px; cursor: pointer; background: transparent; color: var(--text-dim); border: none; transition: 0.2s; }
    .toggle-btn.active { background: var(--accent-green); color: var(--bg-color); font-weight: 700; }

    .flex-input { display: flex; }
    .input-prefix { background: var(--border-color); padding: 12px; font-size: 12px; color: var(--text-dim); border: 1px solid var(--border-color); border-right: none; }

    .full-width { width: 100%; justify-content: center; padding: 15px; margin-top: 10px; }

    .result-card { border-color: var(--accent-green); border-top: none; }
    .result-header { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 20px; }
    
    .result-body { display: flex; gap: 20px; }
    .qr-preview { width: 100px; height: 100px; border: 1px solid var(--border-color); padding: 5px; background: white; }
    .qr-preview img { width: 100%; height: 100%; }

    .result-info { flex: 1; }
    .result-info label { font-size: 10px; color: var(--text-dim); margin-bottom: 5px; display: block; }
    
    .copy-box { display: flex; background: var(--bg-color); border: 1px solid var(--accent-green); }
    .short-url { flex: 1; padding: 10px; font-size: 14px; overflow: hidden; text-overflow: ellipsis; }
    .copy-btn { padding: 0 15px; background: var(--accent-green); color: var(--bg-color); font-family: inherit; font-weight: 700; cursor: pointer; border: none; }

    .error-panel { border-color: var(--accent-red); border-top: none; }
    .mt-10 { margin-top: 10px; font-size: 10px; }
    .bg-dark { background-color: var(--bg-color); }
  `]
})
export class ShortenComponent {
  shortenForm: FormGroup;
  customMode = signal(false);
  expiryEnabled = signal(false);
  loading = signal(false);
  result = signal<any | null>(null);
  copied = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private urlService: UrlService) {
    this.shortenForm = this.fb.group({
      longUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
      customSlug: [''],
      expiresAt: ['']
    });
  }

  toggleMode() {
    this.customMode.update(v => !v);
    if (!this.customMode()) {
      this.shortenForm.patchValue({ customSlug: '' });
    }
  }

  toggleExpiry() {
    this.expiryEnabled.update(v => !v);
    if (!this.expiryEnabled()) {
      this.shortenForm.patchValue({ expiresAt: '' });
    }
  }

  onShorten() {
    if (this.shortenForm.invalid) {
      this.shortenForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    const val = this.shortenForm.value;
    const obs = this.customMode() 
      ? this.urlService.shortenUrlCustom(val.longUrl, val.customSlug, val.expiresAt)
      : this.urlService.shortenUrl(val.longUrl, val.expiresAt);

    obs.subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(`[${err.status}] ${err.error?.message || 'IO_STREAM_ERROR'}`);
        this.loading.set(false);
      }
    });
  }

  getFullUrl(code: string): string {
    return `${environment.apiBaseUrl}/${code}`;
  }

  getQrUrl(code: string): string {
    return `${environment.apiBaseUrl}/api/urls/${code}/qr/image`;
  }

  copyToClipboard() {
    const url = this.getFullUrl(this.result().shortCode);
    navigator.clipboard.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
