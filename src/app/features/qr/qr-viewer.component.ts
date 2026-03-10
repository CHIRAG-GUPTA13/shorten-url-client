import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UrlService } from '../../core/services/url.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-qr-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button mat-button routerLink="/dashboard">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="text-2xl font-bold text-gray-800">QR Code Viewer</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8">
        @if (loading()) {
          <div class="flex justify-center py-16">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- QR Code Display -->
            <mat-card class="p-6">
              <h2 class="text-xl font-semibold mb-4">QR Code</h2>

              <div class="flex justify-center mb-6">
                @if (qrImage()) {
                  <img [src]="qrImage()" alt="QR Code" class="max-w-sm rounded-lg shadow-lg">
                } @else {
                  <div class="bg-gray-200 w-80 h-80 flex items-center justify-center rounded-lg">
                    <mat-icon class="text-6xl text-gray-400">qr_code</mat-icon>
                  </div>
                }
              </div>

              <div class="flex justify-center gap-4">
                <button mat-raised-button color="primary" (click)="downloadQrCode()">
                  <mat-icon>download</mat-icon>
                  Download PNG
                </button>
                <button mat-raised-button (click)="copyQrCode()">
                  <mat-icon>content_copy</mat-icon>
                  Copy to Clipboard
                </button>
              </div>
            </mat-card>

            <!-- URL Info -->
            <mat-card class="p-6">
              <h2 class="text-xl font-semibold mb-4">URL Information</h2>

              <div class="space-y-4">
                <div>
                  <p class="text-gray-500 text-sm">Short Code</p>
                  <p class="text-lg font-mono">{{ shortCode }}</p>
                </div>

                <div>
                  <p class="text-gray-500 text-sm">Short URL</p>
                  <a [href]="getShortUrl()" target="_blank" class="text-blue-600 hover:underline break-all">
                    {{ getShortUrl() }}
                  </a>
                </div>

                <div>
                  <p class="text-gray-500 text-sm">Base64 QR Code</p>
                  <textarea class="w-full h-32 p-2 border rounded font-mono text-xs mt-1"
                            readonly
                            [value]="qrBase64()"></textarea>
                </div>
              </div>
            </mat-card>
          </div>
        }
      </main>
    </div>
  `
})
export class QrViewerComponent implements OnInit {
  shortCode = '';
  qrImage = signal<SafeUrl | null>(null);
  qrBase64 = signal<string>('');
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private urlService: UrlService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') || '';
    if (this.shortCode) {
      this.loadQrCode();
    }
  }

  loadQrCode(): void {
    this.loading.set(true);

    // Load QR code as blob
    this.urlService.getQrCodeImage(this.shortCode).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.qrImage.set(this.sanitizer.bypassSecurityTrustUrl(url));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    // Load QR code as base64
    this.urlService.getQrCode(this.shortCode).subscribe({
      next: (response) => {
        const base64 = response.image;
        this.qrBase64.set(base64);
        if (!this.qrImage()) {
          const imageUrl = `data:image/png;base64,${base64}`;
          this.qrImage.set(this.sanitizer.bypassSecurityTrustUrl(imageUrl));
        }
      }
    });
  }

  getShortUrl(): string {
    return `${environment.apiBaseUrl.replace('/api', '')}/${this.shortCode}`;
  }

  downloadQrCode(): void {
    const image = this.qrImage();
    if (!image) return;

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = image as string;
    link.download = `qr-${this.shortCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('QR code downloaded!', 'Close', { duration: 2000 });
  }

  copyQrCode(): void {
    const base64 = this.qrBase64();
    if (!base64) return;

    navigator.clipboard.writeText(`data:image/png;base64,${base64}`).then(() => {
      this.snackBar.open('QR code copied to clipboard!', 'Close', { duration: 2000 });
    });
  }
}
