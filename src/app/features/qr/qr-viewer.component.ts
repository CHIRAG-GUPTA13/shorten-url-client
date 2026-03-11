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
        <h2 class="panel-title">QR_ENCODING.MATRIX</h2>
        
        <div class="input-group">
          <input #codeBox type="text" class="input" placeholder="ENTER_SHORT_CODE (e.g. ab12cd)" (keyup.enter)="loadQR(codeBox.value)">
          <button class="btn btn-primary" (click)="loadQR(codeBox.value)">ENCODE_MATRIX</button>
        </div>
      </div>

      @if (currentCode()) {
        <div class="qr-display mt-20" @fadeUp>
          <!-- Terminal-style frame -->
          <div class="qr-frame-outer">
            <div class="panel qr-frame corner-accent bracket-tl bracket-tr bracket-bl bracket-br">
              <div class="qr-image-wrapper">
                 <img [src]="qrBlobUrl()" alt="QR_MATRIX" class="qr-image">
              </div>
            </div>
            
            <div class="qr-controls">
              <button class="btn full-width" (click)="downloadQR()">DOWNLOAD_AS.PNG</button>
              <div class="info-strip mt-10">
                 <span class="label">MAPPED_URL:</span>
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
            <p class="text-dim text-center py-40 uppercase tracking-[0.2em] font-mono">
               No active matrix segment found. <br>
               Initialize scan to render QR node.
            </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .qr-container { max-width: 500px; margin: 0 auto; }
    .panel-title { font-size: 14px; margin-bottom: 25px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }

    .input-group { display: flex; gap: 10px; }
    .qr-frame-outer { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    
    .qr-frame { background: white; padding: 20px; border: 1px solid var(--accent-green) !important; width: fit-content; }
    .qr-image-wrapper { width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; }
    .qr-image { width: 100%; height: 100%; image-rendering: pixelated; }

    .qr-controls { width: 100%; }
    .info-strip { display: flex; flex-direction: column; gap: 5px; font-size: 10px; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); }
    .info-strip .label { color: var(--text-dim); }
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
  `]
})
export class QrViewerComponent {
  currentCode = signal('');
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
      next: (res) => this.rawBase64.set(res.image),
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
