import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BulkShortenService, BulkShortenJob, BulkShortenResult } from '../../core/services/bulk-shorten.service';

@Component({
  selector: 'app-bulk-shorten',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatProgressBarModule
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
            <h1 class="text-2xl font-bold text-gray-800">Bulk URL Shortener</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8">
        <mat-tab-group>
          <!-- CSV Upload Tab -->
          <mat-tab label="CSV Upload">
            <div class="p-6">
              <mat-card class="p-6">
                <h2 class="text-xl font-semibold mb-4">Upload CSV File</h2>
                <p class="text-gray-600 mb-4">
                  Upload a CSV file with one URL per line. The file should contain a single column with the long URLs.
                </p>

                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4"
                     (dragover)="onDragOver($event)"
                     (drop)="onDrop($event)"
                     [class.border-blue-500]="isDragging()">
                  <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" class="hidden" id="fileInput">
                  <label for="fileInput" class="cursor-pointer">
                    <mat-icon class="text-4xl text-gray-400">cloud_upload</mat-icon>
                    <p class="mt-2 text-gray-600">
                      @if (selectedFile()) {
                        {{ selectedFile()?.name }}
                      } @else {
                        Drag and drop a CSV file here, or click to select
                      }
                    </p>
                  </label>
                </div>

                <button mat-raised-button color="primary"
                        [disabled]="!selectedFile() || uploading()"
                        (click)="uploadCsv()">
                  @if (uploading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Upload and Process
                  }
                </button>
              </mat-card>
            </div>
          </mat-tab>

          <!-- JSON Input Tab -->
          <mat-tab label="JSON Input">
            <div class="p-6">
              <mat-card class="p-6">
                <h2 class="text-xl font-semibold mb-4">Enter URLs (JSON)</h2>
                <p class="text-gray-600 mb-4">
                  Enter a JSON array of URLs to shorten.
                </p>

                <textarea class="w-full h-64 p-4 border rounded-lg font-mono text-sm"
                          [(ngModel)]="jsonInput"
                          placeholder='["https://example.com/page1", "https://example.com/page2"]'></textarea>

                <button mat-raised-button color="primary"
                        class="mt-4"
                        [disabled]="!jsonInput || submittingJson()"
                        (click)="submitJson()">
                  @if (submittingJson()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Submit URLs
                  }
                </button>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Job History Tab -->
          <mat-tab label="Job History">
            <div class="p-6">
              <mat-card class="p-6">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-semibold">Previous Jobs</h2>
                  <button mat-button (click)="loadJobs()">
                    <mat-icon>refresh</mat-icon>
                    Refresh
                  </button>
                </div>

                @if (jobsLoading()) {
                  <div class="flex justify-center py-8">
                    <mat-spinner></mat-spinner>
                  </div>
                } @else if (jobs().length === 0) {
                  <p class="text-gray-500 text-center py-8">No jobs yet.</p>
                } @else {
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-3 px-4">Job ID</th>
                        <th class="text-center py-3 px-4">Status</th>
                        <th class="text-center py-3 px-4">Progress</th>
                        <th class="text-center py-3 px-4">Created</th>
                        <th class="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (job of jobs(); track job.id) {
                        <tr class="border-b hover:bg-gray-50">
                          <td class="py-3 px-4 font-mono text-sm">{{ job.id }}</td>
                          <td class="text-center py-3 px-4">
                            <span class="px-2 py-1 rounded text-sm"
                                  [class.bg-yellow-100]="job.status === 'PENDING'"
                                  [class.bg-blue-100]="job.status === 'PROCESSING'"
                                  [class.bg-green-100]="job.status === 'COMPLETED'"
                                  [class.bg-red-100]="job.status === 'FAILED'">
                              {{ job.status }}
                            </span>
                          </td>
                          <td class="py-3 px-4">
                            <div class="flex items-center gap-2">
                              <mat-progress-bar mode="determinate"
                                               [value]="getJobProgress(job)"></mat-progress-bar>
                              <span class="text-sm">{{ job.processedUrls }}/{{ job.totalUrls }}</span>
                            </div>
                          </td>
                          <td class="text-center py-3 px-4">{{ formatDate(job.createdAt) }}</td>
                          <td class="text-center py-3 px-4">
                            <button mat-icon-button (click)="viewJobResults(job)"
                                    [disabled]="job.status !== 'COMPLETED'">
                              <mat-icon>visibility</mat-icon>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Job Results Modal -->
        @if (showResults()) {
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <mat-card class="w-full max-w-4xl max-h-[80vh] overflow-auto m-4 p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Job Results</h2>
                <button mat-icon-button (click)="closeResults()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2 px-4">Original URL</th>
                    <th class="text-left py-2 px-4">Short URL</th>
                    <th class="text-center py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (result of results(); track result.id) {
                    <tr class="border-b">
                      <td class="py-2 px-4 truncate max-w-md">{{ result.longUrl }}</td>
                      <td class="py-2 px-4">
                        @if (result.shortUrl) {
                          <a [href]="result.shortUrl" target="_blank" class="text-blue-600 hover:underline">
                            {{ result.shortCode }}
                          </a>
                        } @else {
                          <span class="text-red-500">{{ result.errorMessage }}</span>
                        }
                      </td>
                      <td class="text-center py-2 px-4">
                        @if (result.success) {
                          <mat-icon class="text-green-500">check_circle</mat-icon>
                        } @else {
                          <mat-icon class="text-red-500">error</mat-icon>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </mat-card>
          </div>
        }
      </main>
    </div>
  `
})
export class BulkShortenComponent implements OnInit {
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  submittingJson = signal(false);
  jsonInput = '';
  jobs = signal<BulkShortenJob[]>([]);
  jobsLoading = signal(false);
  showResults = signal(false);
  results = signal<BulkShortenResult[]>([]);
  isDragging = signal(false);

  private pollingInterval: any;

  constructor(
    private bulkService: BulkShortenService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  uploadCsv(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.bulkService.uploadCsv(file).subscribe({
      next: (response) => {
        this.snackBar.open('CSV uploaded! Processing...', 'Close', { duration: 3000 });
        this.pollJobStatus(response.jobId);
        this.selectedFile.set(null);
        this.uploading.set(false);
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open('Upload failed: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
      }
    });
  }

  submitJson(): void {
    try {
      const urls = JSON.parse(this.jsonInput);
      if (!Array.isArray(urls)) {
        throw new Error('Input must be an array');
      }

      this.submittingJson.set(true);
      this.bulkService.submitJson(urls).subscribe({
        next: (response) => {
          this.snackBar.open('URLs submitted! Processing...', 'Close', { duration: 3000 });
          this.pollJobStatus(response.jobId);
          this.jsonInput = '';
          this.submittingJson.set(false);
        },
        error: (err) => {
          this.submittingJson.set(false);
          this.snackBar.open('Submission failed: ' + (err.error?.message || 'Invalid JSON'), 'Close', { duration: 3000 });
        }
      });
    } catch (e) {
      this.snackBar.open('Invalid JSON format', 'Close', { duration: 3000 });
    }
  }

  pollJobStatus(jobId: string): void {
    this.pollingInterval = setInterval(() => {
      this.bulkService.getJobStatus(jobId).subscribe({
        next: (job) => {
          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            clearInterval(this.pollingInterval);
            this.loadJobs();
            this.snackBar.open(`Job ${job.status.toLowerCase()}!`, 'Close', { duration: 3000 });
          }
        }
      });
    }, 2000);
  }

  loadJobs(): void {
    this.jobsLoading.set(true);
    this.bulkService.getAllJobs().subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.jobsLoading.set(false);
      },
      error: () => {
        this.jobsLoading.set(false);
      }
    });
  }

  viewJobResults(job: BulkShortenJob): void {
    this.bulkService.getJobResults(job.id).subscribe({
      next: (results) => {
        this.results.set(results);
        this.showResults.set(true);
      }
    });
  }

  closeResults(): void {
    this.showResults.set(false);
  }

  getJobProgress(job: BulkShortenJob): number {
    if (!job.totalUrls) return 0;
    return (job.processedUrls / job.totalUrls) * 100;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
