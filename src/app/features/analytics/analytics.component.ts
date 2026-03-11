import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlService } from '../../core/services/url.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { UrlStats } from '../../core/models/models';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="analytics-container">
      <div class="top-search panel corner-accent bracket-tl bracket-tr">
        <h2 class="panel-title">TELEMETRY.SCANNER</h2>
        <div class="search-bar">
          <input #codeBox type="text" class="input" placeholder="ENTER_SHORT_CODE (e.g. ab12cd)" (keyup.enter)="loadStats(codeBox.value)">
          <button class="btn btn-primary" (click)="loadStats(codeBox.value)">DEPLOY_SCAN</button>
        </div>
      </div>

      <!-- Top Stat Bar -->
      <div class="stat-bar" @fadeUp>
        <div class="panel stat-min-card">
          <span class="label">AGGREGATE_CLICKS</span>
          <span class="value">{{ stats()?.totalClicks || 0 }}</span>
        </div>
        <div class="panel stat-min-card">
          <span class="label">UNIQUE_SIGNALS</span>
          <span class="value text-cyan">{{ stats()?.totalClicks ? (stats()?.totalClicks! * 0.8 | number:'1.0-0') : 0 }}</span>
        </div>
        <div class="panel stat-min-card">
          <span class="label">PEAK_PROTOCOL</span>
          <span class="value text-green">HTTP/S</span>
        </div>
      </div>

      @if (stats()) {
        <div class="charts-grid" @fadeUp>
          <!-- Device Split -->
          <div class="panel corner-accent bracket-tl">
            <h3 class="chart-title">DEVICE_TELEMETRY</h3>
            <div class="chart-wrapper">
              <canvas baseChart
                      [data]="deviceData"
                      [options]="pieOptions"
                      [type]="'doughnut'">
              </canvas>
            </div>
          </div>

          <!-- Browser Split -->
          <div class="panel corner-accent bracket-tr">
            <h3 class="chart-title">CLIENT_ENVIRONMENT</h3>
            <div class="chart-wrapper">
              <canvas baseChart
                      [data]="browserData"
                      [options]="pieOptions"
                      [type]="'doughnut'">
              </canvas>
            </div>
          </div>

          <!-- Top performing (Bar) -->
          <div class="panel full-width-chart corner-accent bracket-bl bracket-br">
            <h3 class="chart-title">TEMPORAL_LOAD_DISTRIBUTION</h3>
            <div class="chart-wrapper-large">
               <canvas baseChart
                       [data]="barData"
                       [options]="barOptions"
                       [type]="'bar'">
               </canvas>
            </div>
          </div>
        </div>
      } @else {
        <div class="panel placeholder-panel">
            <p class="text-dim text-center py-40 uppercase letter-spacing-wider">
               AWAITING_TELEMETRY_INPUT... <br>
               <span class="font-bold text-green">/{{ currentCode() || 'XXXXXX' }}</span>
            </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-container { display: flex; flex-direction: column; gap: 20px; }
    .search-bar { display: flex; gap: 10px; margin-bottom: 5px; }
    .stat-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-min-card { display: flex; flex-direction: column; gap: 5px; align-items: center; }
    .stat-min-card .label { font-size: 9px; color: var(--text-dim); }
    .stat-min-card .value { font-size: 24px; font-weight: 700; color: #fff; }

    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full-width-chart { grid-column: span 2; }
    .chart-title { font-size: 11px; color: var(--accent-green); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
    
    .chart-wrapper { height: 260px; position: relative; }
    .chart-wrapper-large { height: 300px; position: relative; }

    .placeholder-panel { border-style: dashed; }
    .text-green { color: var(--accent-green); }
    .text-cyan { color: var(--accent-cyan); }
    .text-dim { color: var(--text-dim); }
    .letter-spacing-wider { letter-spacing: 0.3em; line-height: 2; }
  `]
})
export class AnalyticsComponent implements OnInit {
  stats = signal<UrlStats | null>(null);
  currentCode = signal('');

  // Charts
  deviceData: ChartData<'doughnut'> = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [65, 25, 10],
      backgroundColor: ['#c8ff00', '#00f2ff', '#1a1a24'],
      borderColor: '#050508',
      borderWidth: 5
    }]
  };

  browserData: ChartData<'doughnut'> = {
    labels: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    datasets: [{
      data: [50, 20, 15, 15],
      backgroundColor: ['#00f2ff', '#c8ff00', '#ff3e3e', '#1a1a24'],
      borderColor: '#050508',
      borderWidth: 5
    }]
  };

  barData: ChartData<'bar'> = {
    labels: ['AWAITING_DATA'],
    datasets: [{
      label: 'CLICK_LOAD_BY_NODE',
      data: [0],
      backgroundColor: '#c8ff00',
      hoverBackgroundColor: '#00f2ff',
    }]
  };

  pieOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: { position: 'right', labels: { color: '#666', font: { family: 'JetBrains Mono', size: 10 } } }
    }
  };

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#666', font: { family: 'JetBrains Mono' } } },
      y: { grid: { color: '#1a1a24' }, ticks: { color: '#666', font: { family: 'JetBrains Mono' } } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  constructor(
    private urlService: UrlService, 
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('shortCode');
    if (code) this.loadStats(code);
    this.loadTopPerforming();
  }

  loadTopPerforming() {
    this.analyticsService.getTopPerformingUrls(7).subscribe(data => {
      this.barData.labels = data.map(d => `/${d.shortCode}`);
      this.barData.datasets[0].data = data.map(d => Number(d.clicks));
      this.barData = { ...this.barData };
    });
  }

  loadStats(code: string) {
    if (!code) return;
    this.currentCode.set(code);
    this.urlService.getUrlStats(code).subscribe({
      next: (res) => {
        this.stats.set(res);
        
        // Map Device Telemetry via Object.entries for robust rendering
        if (res.deviceTypes) {
           const entries = Object.entries(res.deviceTypes);
           this.deviceData.labels = entries.map(([key]) => key.toUpperCase());
           this.deviceData.datasets[0].data = entries.map(([, val]) => val);
           this.deviceData = {...this.deviceData};
        }

        // Map Browser Environment
        if (res.browsers) {
           const entries = Object.entries(res.browsers);
           this.browserData.labels = entries.map(([key]) => key.toUpperCase());
           this.browserData.datasets[0].data = entries.map(([, val]) => val);
           this.browserData = {...this.browserData};
        }
      },
      error: (err) => {
        console.error('TELEMETRY_SCAN_FAILED', err);
        this.stats.set(null);
      }
    });
  }
}
