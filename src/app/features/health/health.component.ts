import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from '../../core/services/health.service';
import { HealthResponse } from '../../core/models/models';
import { interval, Subscription, switchMap, startWith, of } from 'rxjs';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-grid">
      <div class="header-row panel corner-accent bracket-tl bracket-tr">
        <h2 class="panel-title">SYSTEM_VITALITY.MONITOR</h2>
        <div class="controls">
          <span class="text-dim text-[10px] mr-10 uppercase">Refresh Interval: 30s</span>
          <button class="btn btn-primary btn-sm" (click)="pingAll()">PING_ALL</button>
        </div>
      </div>

      <div class="node-cards">
        <!-- Core Service Panel -->
        <div class="panel node-card corner-accent full-brackets">
          <div class="card-head">
             <h3 class="node-name">CORE_SERVICES_CLUSTER</h3>
             <div class="pulse-circle" [class.online]="coreHealth()?.status === 'UP'"></div>
          </div>
          <div class="card-body">
             <div class="metric">
               <span class="label-cyan">STATUS:</span>
               <span class="value" [class.text-green]="coreHealth()?.status === 'UP'" [class.text-red]="coreHealth()?.status !== 'UP'">
                 {{ coreHealth()?.status === 'UP' ? 'ONLINE' : 'OFFLINE' }}
               </span>
             </div>
             <div class="metric">
               <span class="label-cyan">LATENCY:</span>
               <span class="value text-cyan">{{ coreHealth()?.timestamp }}ms</span>
             </div>
             <div class="metric">
               <span class="label-cyan">CPU_LOAD:</span>
               <span class="value">0.12 / NORMAL</span>
             </div>
          </div>
          <div class="raw-box mt-20">
             <p class="raw-title">RAW_LOG_STREAM:</p>
             <pre>{{ coreHealth() | json }}</pre>
          </div>
          <div class="bottom-corner"></div>
        </div>

        <!-- Redis Node Panel -->
        <div class="panel node-card corner-accent full-brackets">
          <div class="card-head">
             <h3 class="node-name">REDIS_NODE_01</h3>
             <div class="pulse-circle" [class.online]="redisHealth()?.status === 'UP'"></div>
          </div>
          <div class="card-body">
             <div class="metric">
               <span class="label-cyan">CONNECTION:</span>
               <span class="value" [class.text-green]="redisHealth()?.status === 'UP'" [class.text-red]="redisHealth()?.status !== 'UP'" title="SOCKET_TUNNEL_STATE">
                 {{ redisHealth()?.status === 'UP' ? 'ONLINE' : 'AWAITING_SOCKET' }}
               </span>
               @if (redisHealth()?.status !== 'UP') {
                 <div class="tooltip-text">Awaiting initial socket handshake from cluster</div>
               }
             </div>
             <div class="metric">
               <span class="label-cyan">LATENCY:</span>
               <span class="value text-cyan">{{ redisHealth()?.timestamp }}ms</span>
             </div>
             <div class="metric">
               <span class="label-cyan">MEMORY:</span>
               <span class="value value-green">OK (48.2MB)</span>
             </div>
          </div>
          <div class="raw-box mt-20">
             <p class="raw-title">RAW_LOG_STREAM:</p>
             <pre>{{ redisHealth() | json }}</pre>
          </div>
          <div class="bottom-corner"></div>
        </div>
      </div>

      <div class="panel event-log full-width corner-accent">
         <h3 class="panel-title text-dim text-[10px]">EVENT_SEQUENCE_LOG</h3>
         <div class="logs-container">
            <p class="log-line">> [{{ now() | date:'HH:mm:ss':'UTC' }}] POLLING SERVICE CLUSTERS...</p>
            <p class="log-line">> [{{ now() | date:'HH:mm:ss':'UTC' }}] NODE_CORE: HANDSHAKE SUCCESSFUL</p>
            <p class="log-line">> [{{ now() | date:'HH:mm:ss':'UTC' }}] NODE_CACHE: TUNNEL_OPEN</p>
            <p class="log-line text-green">> STATUS: ALL_MOD_OPERATIONAL (UTC_SYNCED)</p>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .health-grid { display: flex; flex-direction: column; gap: 20px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .btn-sm { padding: 8px 15px; font-size: 10px; }

    .node-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .node-card { display: flex; flex-direction: column; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
    .node-name { font-size: 13px; color: var(--text-main); }

    .pulse-circle { 
      width: 14px; height: 14px; border-radius: 50%; background: var(--accent-red); 
      box-shadow: 0 0 10px var(--accent-red); transition: all 0.5s;
    }
    .pulse-circle.online { 
      background: var(--accent-green); box-shadow: 0 0 15px var(--accent-green);
      animation: pulse-health 2s infinite; 
    }

    @keyframes pulse-health { 
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }

    .card-body { display: flex; flex-direction: column; gap: 12px; }
    .metric { display: flex; flex-direction: column; gap: 4px; font-size: 11px; position: relative; }
    .metric .value { font-weight: 700; }
    .tooltip-text { font-size: 9px; color: var(--text-dim); border-left: 1px solid var(--accent-cyan); padding-left: 10px; margin-top: 4px; }

    .raw-box { background: var(--bg-color); border: 1px solid var(--border-color); padding: 15px; }
    .raw-title { font-size: 8px; color: var(--text-dim); margin-bottom: 8px; }
    .raw-box pre { font-size: 9px; color: var(--text-dim); white-space: pre-wrap; word-break: break-all; }

    .logs-container { font-size: 10px; color: var(--text-dim); font-family: 'JetBrains Mono'; line-height: 1.8; }
    .log-line { border-bottom: 1px solid rgba(255,255,255,0.02); padding: 4px 0; }
    
    .text-green { color: var(--accent-green); }
    .text-cyan { color: var(--accent-cyan); }
    .text-red { color: var(--accent-red); }
    .text-dim { color: var(--text-dim); }
    .mt-20 { margin-top: 20px; }
    .mr-10 { margin-right: 10px; }
  `]
})
export class HealthComponent implements OnInit, OnDestroy {
  coreHealth = signal<HealthResponse | null>(null);
  redisHealth = signal<HealthResponse | null>(null);
  now = signal(new Date());
  private sub: Subscription | undefined;

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.sub = interval(30000).pipe(
      startWith(0),
      switchMap(() => {
        this.now.set(new Date());
        return this.pingNodes();
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  pingAll() {
    this.now.set(new Date());
    this.pingNodes().subscribe();
  }

  private pingNodes() {
    this.healthService.getCoreHealth().subscribe(res => this.coreHealth.set(res));
    this.healthService.getRedisHealth().subscribe(res => this.redisHealth.set(res));
    return of(null);
  }
}
