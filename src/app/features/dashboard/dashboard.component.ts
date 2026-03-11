import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlService } from '../../core/services/url.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { HealthService } from '../../core/services/health.service';
import { UrlResponse, MyUrlsStatsDto } from '../../core/models/models';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-grid">
      <!-- Stat Cards -->
      <section class="stats-row">
        <div class="stat-card panel corner-accent bracket-tl">
          <span class="stat-label">TOTAL URLS</span>
          <span class="stat-value">{{ totalUrls() }}</span>
        </div>
        <div class="stat-card panel corner-accent bracket-tr">
          <span class="stat-label">TOTAL CLICKS</span>
          <span class="stat-value text-green">{{ totalClicks() }}</span>
        </div>
        <div class="stat-card panel corner-accent bracket-bl">
          <span class="stat-label">ACTIVE LINKS</span>
          <span class="stat-value text-cyan">{{ activeLinks() }}</span>
        </div>
        <div class="stat-card panel corner-accent bracket-br">
          <span class="stat-label">EXPIRED LINKS</span>
          <span class="stat-value text-red">{{ expiredLinks() }}</span>
        </div>
      </section>

      <div class="main-split">
        <!-- Recent Activity -->
        <section class="panel corner-accent bracket-tl bracket-bl recent-activity">
          <h3 class="panel-title">RECENT_ACTIVITY.LOG</h3>
          <table class="terminal-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>TARGET</th>
                <th>TIMESTAMP</th>
                <th>CLICKS</th>
              </tr>
            </thead>
            <tbody>
              @for (url of recentUrls(); track url.id) {
                <tr>
                  <td class="text-green">{{ url.shortCode }}</td>
                  <td class="text-dim truncate" style="max-width: 200px;">{{ url.originalUrl }}</td>
                  <td>{{ url.createdAt | date:'short' }}</td>
                  <td>{{ url.clickCount }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="text-center text-dim">NO_RECORD_FOUND</td></tr>
              }
            </tbody>
          </table>
        </section>

        <!-- System Status -->
        <section class="panel corner-accent bracket-tr bracket-br system-status">
          <h3 class="panel-title">SYSTEM_STATUS.INF</h3>
          <div class="status-items">
            <div class="status-item">
              <span>CORE SERVICE</span>
              <span class="status-indicator" [class.bg-green]="coreStatus() === 'UP'" [class.bg-red]="coreStatus() !== 'UP'"></span>
              <span class="status-text">{{ coreStatus() || 'NODE_OFFLINE' }}</span>
            </div>
            <div class="status-item">
              <span>REDIS CLUSTER</span>
              <span class="status-indicator" [class.bg-green]="redisStatus() === 'UP'" [class.bg-red]="redisStatus() !== 'UP'"></span>
              <span class="status-text">{{ redisStatus() || 'NODE_OFFLINE' }}</span>
            </div>
            <div class="status-item">
              <span>LOAD BALANCER</span>
              <span class="status-indicator bg-green"></span>
              <span class="status-text">UP</span>
            </div>
          </div>

          <div class="diagnostic-pre">
            <p>> KERNEL: 0.4.52-LTS</p>
            <p>> UPTIME: 104:12:08</p>
            <p>> CPU: 12.4% / MEM: 48.2MB</p>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid { display: flex; flex-direction: column; gap: 30px; }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; }
    .stat-value { font-size: 32px; font-weight: 700; color: white; }
    
    .text-green { color: var(--accent-green); }
    .text-cyan { color: var(--accent-cyan); }
    .text-red { color: var(--accent-red); }
    .text-dim { color: var(--text-dim); }

    .main-split {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .panel-title { font-size: 12px; margin-bottom: 20px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }

    .status-items { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
    .status-item { display: flex; align-items: center; gap: 12px; font-size: 11px; }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; }
    .status-text { color: var(--text-dim); margin-left: auto; }

    .diagnostic-pre { font-size: 9px; color: var(--text-dim); line-height: 2; border-top: 1px solid var(--border-color); padding-top: 15px; }

    .bg-red { background-color: var(--accent-red); box-shadow: 0 0 8px var(--accent-red); }
    .bg-green { background-color: var(--accent-green); box-shadow: 0 0 8px var(--accent-green); }
  `]
})
export class DashboardComponent implements OnInit {
  totalUrls = signal(0);
  totalClicks = signal(0);
  activeLinks = signal(0);
  expiredLinks = signal(0);
  recentUrls = signal<UrlResponse[]>([]);
  coreStatus = signal<string | null>(null);
  redisStatus = signal<string | null>(null);

  constructor(
    private urlService: UrlService,
    private analyticsService: AnalyticsService,
    private healthService: HealthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // 1. Fetch summary stats for cards
    this.analyticsService.getSummaryStats().subscribe(stats => {
      this.totalUrls.set(stats.totalUrls);
      this.totalClicks.set(stats.totalClicks);
      this.activeLinks.set(stats.activeLinks);
      this.expiredLinks.set(stats.expiredLinks);
    });

    // 2. Fetch recent URLs for the table
    this.urlService.getMyUrls().subscribe(urls => {
      this.recentUrls.set(urls.slice(0, 5));
    });

    // 2. System Status
    this.healthService.getCoreHealth().subscribe(res => this.coreStatus.set(res.status));
    this.healthService.getRedisHealth().subscribe(res => this.redisStatus.set(res.status));
  }
}
