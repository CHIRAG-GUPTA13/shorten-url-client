import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BulkShortenService, BulkShortenJob } from '../../core/services/bulk-shorten.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-bulk-shorten',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="space-y-10" @slideIn>
      <div>
        <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase">
          Mass.<span class="text-accent-red">Compression</span>
        </h2>
        <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Bulk URL processing engine</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Input Section -->
        <div class="lg:col-span-3 space-y-6">
          <div class="card relative">
            <div class="flex border-b border-dark-border mb-8">
              <button (click)="mode.set('json')" 
                      [class.border-accent-red]="mode() === 'json'"
                      [class.text-white]="mode() === 'json'"
                      class="px-6 py-4 font-mono text-[10px] uppercase tracking-widest border-b-2 border-transparent transition-all">
                JSON_BLOCK
              </button>
              <button (click)="mode.set('csv')" 
                      [class.border-accent-red]="mode() === 'csv'"
                      [class.text-white]="mode() === 'csv'"
                      class="px-6 py-4 font-mono text-[10px] uppercase tracking-widest border-b-2 border-transparent transition-all">
                CSV_STREAM
              </button>
            </div>

            @if (mode() === 'json') {
              <div class="space-y-4">
                <label class="block font-mono text-[9px] text-muted uppercase tracking-widest mb-2">Input_Array [URL, URL, ...]</label>
                <textarea #jsonInput class="input min-h-[200px] border-accent-red/20 focus:border-accent-red" 
                          placeholder="['https://url1.com', 'https://url2.com']"></textarea>
                <button (click)="submitJson(jsonInput.value)" [disabled]="loading()"
                        class="btn btn-outline-green w-full py-4 border-accent-red text-accent-red hover:bg-accent-red hover:text-white uppercase font-bold tracking-[0.2em]">
                  GENERATE_MASS_LINKS
                </button>
              </div>
            } @else {
              <div class="space-y-4">
                <label class="block font-mono text-[9px] text-muted uppercase tracking-widest mb-2">Source_File (.csv)</label>
                <div class="flex flex-col items-center justify-center border-2 border-dashed border-dark-border p-12 hover:border-accent-red/50 transition-colors cursor-pointer relative">
                  <input type="file" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer">
                  <div class="text-[10px] font-mono text-muted uppercase tracking-widest text-center">
                    {{ selectedFile() ? selectedFile()?.name : 'Drop telemetry source or click to browse' }}
                  </div>
                </div>
                <button (click)="submitCsv()" [disabled]="!selectedFile() || loading()"
                        class="btn btn-outline-green w-full py-4 border-accent-red text-accent-red hover:bg-accent-red hover:text-white uppercase font-bold tracking-[0.2em]">
                  UPLOAD_AND_PROCESS
                </button>
              </div>
            }
          </div>
        </div>

        <!-- History/Status Sidebar -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-4">Job.Registry</h3>
          <div class="space-y-3">
            @for (job of jobs(); track job.id) {
              <div class="card p-4 hover:border-accent-blue/30 transition-colors cursor-pointer group" (click)="viewResults(job.id)">
                <div class="flex justify-between items-start mb-2">
                  <div class="font-mono text-[10px] text-accent-blue truncate">ID: {{ job.id }}</div>
                  <span class="px-2 py-0.5 bg-dark border border-dark-border font-mono text-[8px] uppercase"
                        [class.text-accent-green]="job.status === 'COMPLETED'"
                        [class.text-accent-blue]="job.status === 'PROCESSING'"
                        [class.text-muted]="job.status === 'PENDING'">
                    {{ job.status }}
                  </span>
                </div>
                <div class="flex justify-between items-end mt-4">
                  <div class="font-mono text-[9px] text-muted uppercase">{{ job.createdAt | date:'short' }}</div>
                  <div class="font-mono text-[12px] text-white opacity-50 group-hover:opacity-100 transition-opacity">
                    {{ job.processedUrls }}/{{ job.totalUrls }}
                  </div>
                </div>
                <div class="mt-3 h-1 w-full bg-dark overflow-hidden">
                   <div class="h-full bg-accent-blue transition-all duration-1000" 
                        [style.width.%]="(job.processedUrls / job.totalUrls) * 100"></div>
                </div>
              </div>
            } @empty {
              <div class="text-center p-8 border border-dark-border text-[9px] font-mono text-muted uppercase tracking-widest opacity-50">
                No active jobs in registry
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class BulkShortenComponent {
  mode = signal<'json' | 'csv'>('json');
  jobs = signal<BulkShortenJob[]>([]);
  loading = signal(false);
  selectedFile = signal<File | null>(null);

  constructor(private bulkService: BulkShortenService) {
    this.loadJobs();
  }

  loadJobs(): void {
    this.bulkService.getAllJobs().subscribe((jobs: BulkShortenJob[]) => this.jobs.set(jobs));
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile.set(file);
  }

  submitJson(input: string): void {
    try {
      const urls = JSON.parse(input.replace(/'/g, '"'));
      if (!Array.isArray(urls)) throw new Error();
      
      this.loading.set(true);
      this.bulkService.submitJson(urls).subscribe({
        next: () => {
          this.loading.set(false);
          this.loadJobs();
        },
        error: (err: any) => {
          this.loading.set(false);
          alert(err.error?.message || 'Mass.Compression failed.');
        }
      });
    } catch {
      alert('Invalid JSON array format.');
    }
  }

  submitCsv(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.bulkService.uploadCsv(file).subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedFile.set(null);
        this.loadJobs();
      },
      error: () => this.loading.set(false)
    });
  }

  viewResults(jobId: string): void {
    // This could open a modal or navigate to a results page
    this.bulkService.getJobResults(jobId).subscribe(results => {
       console.log('Job Results:', results);
       alert(`Job ${jobId} results ready in console.`);
    });
  }
}
