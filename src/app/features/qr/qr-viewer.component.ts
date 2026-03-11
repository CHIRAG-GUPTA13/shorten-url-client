import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UrlService } from '../../core/services/url.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-qr-viewer',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        style({ scale: 0.9, opacity: 0 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ scale: 1, opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="max-w-2xl mx-auto space-y-10" @popIn>
      <div class="text-center">
        <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase">
          QR.<span class="text-white">Encoder</span>
        </h2>
        <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Visual redirect matrix generation</p>
      </div>

      <div class="card p-10 flex flex-col items-center gap-8 relative overflow-hidden">
        <!-- Decoration lines -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-blue to-transparent"></div>
        
        <div class="flex bg-dark border border-dark-border p-1 w-full max-w-sm">
          <input #codeInput type="text" [value]="shortCode()" placeholder="ENTER_CODE" 
                 class="bg-transparent border-none font-mono text-sm px-4 py-3 focus:outline-none flex-1 uppercase">
          <button (click)="shortCode.set(codeInput.value)" 
                  class="bg-dark-border text-white font-mono text-[10px] px-6 uppercase hover:bg-accent-blue hover:text-dark transition-all">
            LOAD
          </button>
        </div>

        @if (shortCode()) {
          <div class="space-y-8 flex flex-col items-center">
            <div class="bg-white p-4 border-[12px] border-dark-border shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
              <img [src]="getQrUrl(shortCode())" alt="QR Code" class="w-64 h-64 grayscale contrast-125">
            </div>

            <div class="flex gap-4">
              <button (click)="downloadQr()" class="btn btn-primary px-8 py-3">
                DOWNLOAD_PNG
              </button>
              <button (click)="copyLink()" class="btn btn-secondary px-8 py-3">
                COPY_LINK
              </button>
            </div>

            <div class="font-mono text-[10px] text-muted uppercase tracking-[0.3em] flex items-center gap-4">
               <span class="w-2 h-2 rounded-full bg-accent-green"></span>
               Matrix Verified: {{ shortCode() }}
            </div>
          </div>
        } @else {
          <div class="py-20 text-center opacity-30 font-mono text-[10px] uppercase tracking-[0.5em]">
             Input short code to resolve matrix
          </div>
        }
      </div>

      @if (qrBase64()) {
        <div class="card p-6 border-dashed">
          <h3 class="font-mono text-[10px] text-muted uppercase tracking-widest mb-4">Base64_Payload</h3>
          <div class="bg-dark p-4 font-mono text-[10px] text-muted truncate select-all">
            {{ qrBase64() }}
          </div>
        </div>
      }
    </div>
  `
})
export class QrViewerComponent implements OnInit {
  shortCode = signal('');
  qrBase64 = signal<string | null>(null);

  constructor(
    private urlService: UrlService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('shortCode');
    if (code) {
      this.shortCode.set(code);
      this.loadBase64(code);
    }
  }

  getQrUrl(code: string): string {
    return `${environment.apiBaseUrl}/api/urls/${code}/qr/image`;
  }

  loadBase64(code: string): void {
    this.urlService.getQrCode(code).subscribe(res => {
      this.qrBase64.set(res.image);
    });
  }

  downloadQr(): void {
    const link = document.createElement('a');
    link.href = this.getQrUrl(this.shortCode());
    link.download = `qr-${this.shortCode()}.png`;
    link.click();
  }

  copyLink(): void {
    const url = `${environment.apiBaseUrl}/${this.shortCode()}`;
    navigator.clipboard.writeText(url);
  }
}
