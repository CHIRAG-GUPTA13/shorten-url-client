import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlService } from '../../core/services/url.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-qr-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-container">
      <div class="panel corner-accent bracket-tl bracket-tr">
        <h2 class="panel-title">QR_GENERATOR</h2>
        
        <div class="input-group">
          <input #codeBox type="text" class="input" placeholder="ENTER_SHORT_CODE (e.g. ab12cd)" (keyup.enter)="loadQR(codeBox.value)">
          <button class="btn btn-primary" (click)="loadQR(codeBox.value)">GENERATE_QR</button>
        </div>
      </div>

      @if (currentCode()) {
        <div class="qr-display mt-20" @fadeUp>
          <!-- Terminal-style frame -->
          <div class="qr-frame-outer">
            <div class="size-selector mb-10">
              <span class="label-cyan mr-10">SIZE:</span>
              <div class="toggle-switch">
                <button class="toggle-btn" [class.active]="qrSize() === 128" (click)="qrSize.set(128)">128PX</button>
                <button class="toggle-btn" [class.active]="qrSize() === 256" (click)="qrSize.set(256)">256PX</button>
                <button class="toggle-btn" [class.active]="qrSize() === 512" (click)="qrSize.set(512)">512PX</button>
              </div>
            </div>

            <div class="panel qr-frame corner-accent full-brackets">
              <div class="qr-image-wrapper" [style.width.px]="qrSize()" [style.height.px]="qrSize()">
                 <img [src]="qrBlobUrl()" alt="QR_MATRIX" class="qr-image">
              </div>
              <div class="bottom-corner"></div>
            </div>
            
            <div class="qr-controls">
              <button class="btn btn-primary full-width" (click)="downloadQR()">DOWNLOAD_PNG</button>
              <div class="info-strip mt-10">
                 <span class="label-cyan">MAPPED_URL:</span>
                 <span class="value text-cyan">{{ getFullUrl() }}</span>
              </div>
            </div>
          </div>

          <div class="panel mt-20 details-panel">
            <details class="monospaced-details">
              <summary class="text-dim text-[10px] cursor-pointer hover:text-green transition-colors uppercase">
                 View Raw Base64 Payload
              </summary>
              <div class="raw-data-box mt-10">
                 <pre>{{ rawBase64() || 'AWAITING_BUFFER_READ...' }}</pre>
              </div>
            </details>
          </div>
        </div>
        @if (errorMessage()) {
           <div class="panel error-panel mt-10">
              <p class="error-text">> CRITICAL_FAILURE: {{ errorMessage() }}</p>
           </div>
        }
      } @else {
        <div class="panel placeholder-panel mt-20">
            <p class="text-dim text-center py-40 uppercase tracking-[0.1em] font-mono">
               Enter a short code to generate a QR code. <br>
               <span class="text-[10px] opacity-50 mt-10 block">System awaiting routing parameter...</span>
            </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .qr-container { max-width: 500px; margin: 0 auto; }
    .panel-title { font-size: 14px; margin-bottom: 25px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }

    .input-group { display: flex; gap: 10px; }
    .qr-frame-outer { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    
    .size-selector { display: flex; align-items: center; }
    .mr-10 { margin-right: 10px; }
    .mb-10 { margin-bottom: 10px; }
    .toggle-switch { display: flex; background: var(--bg-color); border: 1px solid var(--border-color); padding: 2px; }
    .toggle-btn { padding: 4px 10px; font-size: 9px; cursor: pointer; border: none; background: transparent; color: var(--text-dim); }
    .toggle-btn.active { background: var(--accent-cyan); color: var(--bg-darker); font-weight: 700; }

    .qr-frame { background: white; padding: 20px; border: 1px solid var(--accent-green) !important; width: fit-content; }
    .qr-image-wrapper { display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-width: 100%; }
    .qr-image { width: 100%; height: 100%; image-rendering: pixelated; }
 
    .qr-controls { width: 100%; }
    .info-strip { display: flex; flex-direction: column; gap: 5px; font-size: 10px; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); }
    .info-strip .value { word-break: break-all; }
 
    .details-panel { border-color: var(--border-color); padding: 10px 20px; }
    .raw-data-box { background: var(--bg-color); padding: 10px; border: 1px solid var(--border-color); overflow-x: auto; }
    .raw-data-box pre { font-size: 8px; color: var(--text-dim); }
 
    .full-width { width: 100%; justify-content: center; }
    .mt-20 { margin-top: 20px; }
    .mt-10 { margin-top: 10px; }
    
    .placeholder-panel { border-style: dashed; opacity: 0.5; }
    .text-dim { color: var(--text-dim); }
    .text-cyan { color: var(--accent-cyan); }
    .text-green { color: var(--accent-green); }
    .label-cyan { color: var(--accent-cyan); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
  `]
})
export class QrViewerComponent {
  currentCode = signal('');
  qrSize = signal(256);
  qrBlobUrl = signal<string | null>(null);
  rawBase64 = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(private urlService: UrlService) {}

  loadQR(code: string) {
    if (!code) return;
    this.currentCode.set(code);
    this.errorMessage.set(null);

    // Fetch Base64 segment
    this.urlService.getQrCode(code).subscribe({
      next: (res) => {
        this.rawBase64.set(res.qrCodeBase64);
        // If blob loading isn't preferred or fails, we can use Base64 as fallback
        if (!this.qrBlobUrl()) {
          this.qrBlobUrl.set(`data:image/png;base64,${res.qrCodeBase64}`);
        }
      },
      error: (err) => {
         this.rawBase64.set(null);
         this.errorMessage.set(`[${err.status}] ENCODING_SCAN_FAILED`);
      }
    });

    // Fetch Blob for visual rendering
    this.urlService.getQrCodeImage(code).subscribe({
      next: (blob) => {
        if (this.qrBlobUrl()) URL.revokeObjectURL(this.qrBlobUrl()!);
        const url = URL.createObjectURL(blob);
        this.qrBlobUrl.set(url);
      },
      error: () => this.qrBlobUrl.set(null)
    });
  }

  getQrUrl(): string {
    return `${environment.apiBaseUrl}/api/urls/${this.currentCode()}/qr/image`;
  }

  getFullUrl(): string {
    return `${environment.apiBaseUrl}/${this.currentCode()}`;
  }

  downloadQR() {
    if (!this.qrBlobUrl()) return;
    const link = document.createElement('a');
    link.href = this.qrBlobUrl()!;
    link.download = `LINKCORE_MATRIX_${this.currentCode()}.png`;
    link.click();
  }
}
