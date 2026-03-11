import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkShortenService } from '../../core/services/bulk-shorten.service';
import { BulkShortenJob, BulkShortenResult } from '../../core/models/models';
import { animate, style, transition, trigger, state } from '@angular/animations';

@Component({
  selector: 'app-bulk',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fold', [
      state('collapsed', style({ height: '0px', padding: '0px' })),
      state('expanded', style({ height: '*', padding: '20px' })),
      transition('expanded <=> collapsed', animate('300ms ease-out'))
    ])
  ],
  template: `
    <div class="bulk-container">
      <div class="panel corner-accent bracket-tl bracket-tr">
        <h2 class="panel-title">MASS_COMPRESSION.PROCESSOR</h2>
        
        <div class="tabs">
          <button class="tab-btn" [class.active]="mode() === 'json'" (click)="mode.set('json')">01. JSON_BLOB</button>
          <button class="tab-btn" [class.active]="mode() === 'csv'" (click)="mode.set('csv')">02. CSV_STREAM</button>
        </div>

        <div class="tab-content">
          @if (mode() === 'json') {
            <div class="json-input">
              <label class="text-dim text-[10px] mb-2 block uppercase">Input URL array (monospaced):</label>
              <textarea #jsonInput class="input terminal-textarea" 
                        placeholder='["https://...", "https://..."]'></textarea>
              <button class="btn btn-primary full-width mt-10" (click)="submitJson(jsonInput.value)" [disabled]="loading()">
                {{ loading() ? 'UPLOAD_ACTIVE...' : 'INITIALIZE_SEQUENTIAL_COMPRESSION' }}
              </button>
            </div>
          } @else {
            <div class="csv-input" 
                 (dragover)="$event.preventDefault()" 
                 (drop)="onFileDrop($event)"
                 (click)="fileInput.click()">
              <input #fileInput type="file" (change)="onFileSelected($event)" hidden>
              <div class="drop-zone border-dashed">
                <p class="text-green font-bold">{{ selectedFile() ? selectedFile()?.name : 'DROP TELEMETRY DATA OR CLICK TO BROWSE' }}</p>
                <p class="text-dim text-[9px] mt-2 uppercase">Protocol: CSV-8BIT / Buffer: 50MB MAX</p>
              </div>
              <button class="btn btn-primary full-width mt-10" (click)="submitCsv()" [disabled]="!selectedFile() || loading()">
                {{ loading() ? 'INJECTING_PAYLOAD...' : 'INJECT_TELEMETRY_STREAM' }}
              </button>
            </div>
          }
        </div>

        @if (errorMessage()) {
          <div class="panel error-panel mt-10">
             <p class="error-text">> CRITICAL_FAILURE: {{ errorMessage() }}</p>
          </div>
        }
      </div>

      <!-- Jobs List -->
      <div class="jobs-registry mt-30">
        <h3 class="panel-title text-cyan">JOB_REGISTRY.X-LOG</h3>
        <div class="job-list">
          @for (job of jobs(); track job.id) {
            <div class="job-card panel mb-10" [class.active-job]="activeJob() === job.id">
              <div class="job-header" (click)="toggleJob(job.id)">
                <span class="text-dim">ID: {{ job.id.slice(0,8) }}...</span>
                <span class="badge" [class.badge-active]="job.status === 'COMPLETED'" 
                                    [class.badge-exp]="job.status === 'PROCESSING'">
                  {{ job.status }}
                </span>
                <span class="text-cyan ml-auto">{{ job.processedUrls }}/{{ job.totalUrls }} PKTS</span>
                <span class="expand-icon">{{ activeJob() === job.id ? '▼' : '▶' }}</span>
              </div>

              <div class="job-results" [@fold]="activeJob() === job.id ? 'expanded' : 'collapsed'">
                 <table class="terminal-table result-min">
                   <thead>
                     <tr>
                       <th>STATUS</th>
                       <th>SOURCE_DATA</th>
                       <th>RESULT</th>
                     </tr>
                   </thead>
                   <tbody>
                     @for (res of jobResults()[job.id] || []; track res.id) {
                       <tr>
                         <td [class.text-green]="res.success" [class.text-red]="!res.success">
                           {{ res.success ? 'OK' : 'ERR' }}
                         </td>
                         <td class="text-dim truncate" style="max-width: 200px;">{{ res.longUrl }}</td>
                         <td class="text-cyan">{{ res.shortCode ? '/' + res.shortCode : '--' }}</td>
                       </tr>
                     } @empty {
                       <tr><td colspan="3" class="text-center text-dim text-[9px]">AWAITING_RESULT_BUFFER...</td></tr>
                     }
                   </tbody>
                 </table>
              </div>
            </div>
          } @empty {
            <div class="panel text-center py-20 text-dim">NO_ACTIVE_PROCESS_HANDLES</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-container { display: flex; flex-direction: column; }
    .panel-title { font-size: 14px; margin-bottom: 25px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
    
    .tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; }
    .tab-btn { background: transparent; border: none; color: var(--text-dim); padding: 10px 20px; font-family: inherit; font-size: 11px; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: #fff; border-bottom-color: var(--accent-green); }

    .terminal-textarea { min-height: 150px; resize: vertical; margin-bottom: 10px; font-size: 12px; }
    
    .drop-zone { border: 1px dashed var(--border-color); padding: 60px 40px; text-align: center; cursor: pointer; transition: 0.2s; }
    .drop-zone:hover { border-color: var(--accent-green); background: rgba(200, 255, 0, 0.05); }

    .full-width { width: 100%; justify-content: center; }
    .mt-10 { margin-top: 10px; }
    .mt-30 { margin-top: 30px; }
    .ml-auto { margin-left: auto; }

    .job-header { display: flex; align-items: center; gap: 15px; padding: 15px; cursor: pointer; font-size: 11px; }
    .job-header:hover { background: rgba(0, 242, 255, 0.05); }
    .active-job { border-color: var(--accent-cyan); }
    
    .badge-active { border-color: var(--accent-green); color: var(--accent-green); }
    .badge-exp { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    .job-results { background: var(--bg-color); border-top: 1px solid var(--border-color); overflow: hidden; }
    .result-min th { font-size: 8px; padding: 5px; }
    .result-min td { font-size: 10px; padding: 8px 5px; }

    .text-cyan { color: var(--accent-cyan); }
    .text-red { color: var(--accent-red); }
    .text-green { color: var(--accent-green); }
    .text-dim { color: var(--text-dim); }
  `]
})
export class BulkShortenComponent implements OnInit {
  mode = signal<'json' | 'csv'>('json');
  jobs = signal<BulkShortenJob[]>([]);
  activeJob = signal<string | null>(null);
  jobResults = signal<{ [key: string]: BulkShortenResult[] }>({});
  loading = signal(false);
  selectedFile = signal<File | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(private bulkService: BulkShortenService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs() {
    this.bulkService.getAllJobs().subscribe(jobs => this.jobs.set(jobs));
  }

  toggleJob(jobId: string) {
    if (this.activeJob() === jobId) {
      this.activeJob.set(null);
    } else {
      this.activeJob.set(jobId);
      if (!this.jobResults()[jobId]) {
        this.bulkService.getJobResults(jobId).subscribe(res => {
          const results = { ...this.jobResults() };
          results[jobId] = res;
          this.jobResults.set(results);
        });
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile.set(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.selectedFile.set(file);
  }

  submitJson(val: string) {
    try {
      this.errorMessage.set(null);
      const urls = JSON.parse(val.replace(/'/g, '"'));
      if (!Array.isArray(urls)) throw new Error('NOT_ARRAY');
      this.loading.set(true);
      this.bulkService.submitJson(urls).subscribe({
        next: () => {
          this.loading.set(false);
          this.loadJobs();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(`[${err.status}] ${err.error?.message || 'IO_STREAM_ERROR'}`);
        }
      });
    } catch (e) {
      this.errorMessage.set('INVALID_JSON_STREAM_FORMAT');
    }
  }

  submitCsv() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.bulkService.uploadCsv(file).subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedFile.set(null);
        this.loadJobs();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(`[${err.status}] ${err.error?.message || 'CSV_UPLOAD_FAILED'}`);
      }
    });
  }
}
