import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-10" @slideIn>
      <div>
        <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase">
          System.<span class="text-accent-green">Vitalis</span>
        </h2>
        <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Real-time node status & health telemetry</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Main Service Health -->
        <div class="card relative overflow-hidden">
          <div class="flex items-center justify-between mb-8">
            <h3 class="font-mono text-xs uppercase tracking-widest text-muted">Core_Service_V2</h3>
            <div [class]="serviceStatus() === 'UP' ? 'pulse-dot bg-accent-green' : 'pulse-dot bg-accent-red'"></div>
          </div>
          
          <div class="space-y-4">
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Status:</span>
              <span [class]="serviceStatus() === 'UP' ? 'text-accent-green' : 'text-accent-red'">{{ serviceStatus() || 'UNKNOWN' }}</span>
            </div>
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Latency:</span>
              <span class="text-white">12ms</span>
            </div>
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Node_Type:</span>
              <span class="text-accent-blue font-bold">EDGE_PRIMARY</span>
            </div>
          </div>
        </div>

        <!-- Redis Health -->
        <div class="card relative overflow-hidden">
          <div class="flex items-center justify-between mb-8">
            <h3 class="font-mono text-xs uppercase tracking-widest text-muted">Cache_Engine (Redis)</h3>
            <div [class]="redisStatus() === 'UP' ? 'pulse-dot bg-accent-blue' : 'pulse-dot bg-accent-red'"></div>
          </div>
          
          <div class="space-y-4">
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Connection:</span>
              <span [class]="redisStatus() === 'UP' ? 'text-accent-blue' : 'text-accent-red'">{{ redisStatus() || 'OFFLINE' }}</span>
            </div>
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Persistence:</span>
              <span class="text-white">AOF_ENABLED</span>
            </div>
            <div class="flex justify-between font-mono text-sm">
              <span class="text-muted">Memory_Usage:</span>
              <span class="text-white">1.2GB / 4GB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Raw JSON Logs -->
      <div class="card p-0 border-dark-border overflow-hidden">
        <div class="bg-dark-border px-6 py-3 font-mono text-[10px] text-muted uppercase tracking-widest">
           Telemetry_Output_Debug_Stream
        </div>
        <div class="p-6 bg-black">
          <pre class="font-mono text-[11px] text-accent-green/70 leading-relaxed whitespace-pre-wrap">
{{ rawResponse() }}
          </pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pulse-dot {
      @apply w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)];
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }
  `]
})
export class HealthComponent implements OnInit, OnDestroy {
  serviceStatus = signal<string | null>(null);
  redisStatus = signal<string | null>(null);
  rawResponse = signal<string>('INIT_SEQUENCE_STARTING...\nWAITING_FOR_SIGNALS...');
  
  private interval: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.checkHealth();
    this.interval = setInterval(() => this.checkHealth(), 30000);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  checkHealth(): void {
    this.rawResponse.set(`[${new Date().toISOString()}] POLLING_ENDPOINT: /api/health\n`);
    
    // Check general health
    this.http.get<any>(`${environment.apiBaseUrl}/api/health`).subscribe({
      next: (res) => {
        this.serviceStatus.set(res.status);
        this.rawResponse.update(v => v + `[SERVICE]: OK ${JSON.stringify(res)}\n`);
      },
      error: (err) => {
        this.serviceStatus.set('DOWN');
        this.rawResponse.update(v => v + `[SERVICE]: ERROR ${err.message}\n`);
      }
    });

    // Check redis health
    this.http.get<any>(`${environment.apiBaseUrl}/api/health/redis`).subscribe({
      next: (res) => {
        this.redisStatus.set(res.status);
        this.rawResponse.update(v => v + `[REDIS]: OK ${JSON.stringify(res)}`);
      },
      error: (err) => {
        this.redisStatus.set('DOWN');
        this.rawResponse.update(v => v + `[REDIS]: ERROR ${err.message}`);
      }
    });
  }
}
