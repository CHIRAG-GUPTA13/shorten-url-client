import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { UrlService, UrlResponse } from '../../core/services/url.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">URL Shortener</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">{{ authService.getUserEmail() }}</span>
            <button mat-button (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- URL Shortener Form -->
        <mat-card class="mb-8 p-6">
          <h2 class="text-xl font-semibold mb-4">Create Short URL</h2>

          <form [formGroup]="shortenForm" (ngSubmit)="onShorten()">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <mat-form-field class="md:col-span-2">
                <mat-label>Long URL</mat-label>
                <input matInput formControlName="longUrl" placeholder="https://example.com/very-long-url">
                <mat-error>Long URL is required</mat-error>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Custom Slug (optional)</mat-label>
                <input matInput formControlName="customSlug" placeholder="my-custom-slug">
              </mat-form-field>

              <mat-form-field>
                <mat-label>Strategy</mat-label>
                <mat-select formControlName="strategy">
                  <mat-option value="RANDOM">Random</mat-option>
                  <mat-option value="CUSTOM">Custom</mat-option>
                  <mat-option value="USER_PREFERENCE">User Preference</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex gap-4 items-center">
              <mat-form-field>
                <mat-label>Expiry Date (optional)</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="expiresAt">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="shortening()">
                @if (shortening()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Shorten URL
                }
              </button>
            </div>
          </form>
        </mat-card>

        <!-- URL List -->
        <mat-card class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">My URLs</h2>
            <button mat-button (click)="loadUrls()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-8">
              <mat-spinner></mat-spinner>
            </div>
          } @else if (urls().length === 0) {
            <div class="text-center py-8 text-gray-500">
              <mat-icon class="text-6xl">link_off</mat-icon>
              <p class="mt-4">No URLs yet. Create your first short URL above!</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4">Short URL</th>
                    <th class="text-left py-3 px-4">Long URL</th>
                    <th class="text-center py-3 px-4">Clicks</th>
                    <th class="text-left py-3 px-4">Created</th>
                    <th class="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (url of urls(); track url.id) {
                    <tr class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4">
                        <a [href]="getShortUrl(url.shortCode)" target="_blank" class="text-blue-600 hover:underline font-mono">
                          {{ url.shortCode }}
                        </a>
                      </td>
                      <td class="py-3 px-4">
                        <span class="truncate block max-w-md" [title]="url.longUrl">
                          {{ url.longUrl }}
                        </span>
                      </td>
                      <td class="text-center py-3 px-4">{{ url.clickCount }}</td>
                      <td class="py-3 px-4">{{ formatDate(url.createdAt) }}</td>
                      <td class="text-center py-3 px-4">
                        <button mat-icon-button [matMenuTriggerFor]="menu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #menu="matMenu">
                          <button mat-menu-item (click)="copyToClipboard(url.shortCode)">
                            <mat-icon>content_copy</mat-icon>
                            <span>Copy</span>
                          </button>
                          <button mat-menu-item [routerLink]="['/analytics', url.shortCode]">
                            <mat-icon>analytics</mat-icon>
                            <span>Analytics</span>
                          </button>
                          <button mat-menu-item [routerLink]="['/qr', url.shortCode]">
                            <mat-icon>qr_code</mat-icon>
                            <span>QR Code</span>
                          </button>
                          <button mat-menu-item (click)="deleteUrl(url)" class="text-red-600">
                            <mat-icon>delete</mat-icon>
                            <span>Delete</span>
                          </button>
                        </mat-menu>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </mat-card>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  shortenForm: FormGroup;
  urls = signal<UrlResponse[]>([]);
  loading = signal(false);
  shortening = signal(false);
  displayedColumns = ['shortUrl', 'longUrl', 'clicks', 'created', 'actions'];

  constructor(
    private fb: FormBuilder,
    private urlService: UrlService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.shortenForm = this.fb.group({
      longUrl: ['', Validators.required],
      customSlug: [''],
      strategy: ['RANDOM'],
      expiresAt: [null]
    });
  }

  ngOnInit(): void {
    this.loadUrls();
  }

  loadUrls(): void {
    this.loading.set(true);
    this.urlService.getMyUrls().subscribe({
      next: (urls) => {
        this.urls.set(urls);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load URLs', 'Close', { duration: 3000 });
      }
    });
  }

  onShorten(): void {
    if (this.shortenForm.invalid) {
      this.shortenForm.markAllAsTouched();
      return;
    }

    this.shortening.set(true);
    const formValue = this.shortenForm.value;

    const request = {
      longUrl: formValue.longUrl,
      customSlug: formValue.customSlug || undefined,
      strategy: formValue.strategy,
      expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : undefined
    };

    this.urlService.shortenUrl(request).subscribe({
      next: (response) => {
        this.shortening.set(false);
        this.snackBar.open('URL shortened successfully!', 'Close', { duration: 3000 });
        this.shortenForm.reset({ strategy: 'RANDOM' });
        this.loadUrls();
      },
      error: (err) => {
        this.shortening.set(false);
        this.snackBar.open(err.error?.message || 'Failed to shorten URL', 'Close', { duration: 3000 });
      }
    });
  }

  getShortUrl(shortCode: string): string {
    return `${window.location.origin}/${shortCode}`;
  }

  copyToClipboard(shortCode: string): void {
    const url = this.getShortUrl(shortCode);
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  deleteUrl(url: UrlResponse): void {
    if (confirm('Are you sure you want to delete this URL?')) {
      this.urlService.deleteUrl(url.shortCode).subscribe({
        next: () => {
          this.snackBar.open('URL deleted successfully', 'Close', { duration: 3000 });
          this.loadUrls();
        },
        error: (err) => {
          this.snackBar.open('Failed to delete URL', 'Close', { duration: 3000 });
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
  }
}
