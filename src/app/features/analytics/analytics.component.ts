import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UrlService, UrlStats } from '../../core/services/url.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterLink],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="space-y-10" @fadeIn>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase">
            Data.<span class="text-accent-blue">Intelligence</span>
          </h2>
          <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Real-time traffic analysis & telemetry</p>
        </div>
        
        <div class="flex bg-dark-lighter border border-dark-border p-1">
          <input #searchInput type="text" placeholder="ENTER_SHORT_CODE" 
                 class="bg-transparent border-none font-mono text-xs px-4 py-2 focus:outline-none w-48 uppercase">
          <button (click)="loadUrlStats(searchInput.value)" 
                  class="bg-accent-blue text-dark font-mono text-[10px] font-bold px-4 uppercase tracking-tighter hover:bg-white transition-colors">
            DEPLOY_SCAN
          </button>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card accent-border border-l-accent-blue">
          <div class="text-[9px] font-mono text-muted uppercase tracking-[0.2em] mb-3">Total.Inbound_Clicks</div>
          <div class="text-4xl font-mono font-bold text-white">{{ stats()?.totalClicks || 0 }}</div>
          <div class="mt-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
            <span class="text-[8px] font-mono text-accent-green uppercase tracking-widest">Live Stream Active</span>
          </div>
        </div>
        
        <div class="card border-l-4 border-l-white/10">
          <div class="text-[9px] font-mono text-muted uppercase tracking-[0.2em] mb-3">First.Initialization</div>
          <div class="text-lg font-mono text-white truncate">{{ stats()?.firstClick || '---' }}</div>
          <p class="text-[8px] font-mono text-muted mt-4 uppercase tracking-widest">Protocol Start Timestamp</p>
        </div>

        <div class="card border-l-4 border-l-white/10">
          <div class="text-[9px] font-mono text-muted uppercase tracking-[0.2em] mb-3">Latest.Signal</div>
          <div class="text-lg font-mono text-white truncate">{{ stats()?.lastClick || '---' }}</div>
          <p class="text-[8px] font-mono text-muted mt-4 uppercase tracking-widest">Last Remote Interaction</p>
        </div>
      </div>

      @if (stats()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Device Breakdown -->
          <div class="card">
            <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-8 flex justify-between">
              Device.Type<span>[Telemetry_04]</span>
            </h3>
            <div class="h-64 relative">
              <canvas baseChart
                      [data]="deviceData"
                      [options]="pieChartOptions"
                      [type]="'doughnut'">
              </canvas>
            </div>
          </div>

          <!-- Browser Breakdown -->
          <div class="card">
            <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-8 flex justify-between">
              Client.Environment<span>[Telemetry_05]</span>
            </h3>
            <div class="h-64 relative">
              <canvas baseChart
                      [data]="browserData"
                      [options]="pieChartOptions"
                      [type]="'doughnut'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Weekly Traffic -->
        <div class="card">
          <h3 class="font-mono text-xs text-muted uppercase tracking-widest mb-8 flex justify-between">
            Temporal.Load_Distribution<span>[Telemetry_01]</span>
          </h3>
          <div class="h-80">
            <canvas baseChart
                    [data]="lineChartData"
                    [options]="lineChartOptions"
                    [type]="'bar'">
            </canvas>
          </div>
        </div>
      } @else {
        <div class="card p-20 text-center border-dashed border-muted/20 opacity-40">
           <div class="font-mono text-[10px] uppercase tracking-[0.5em] text-muted">
             Select a data stream to begin analysis
           </div>
        </div>
      }
    </div>
  `
})
export class AnalyticsComponent implements OnInit {
  stats = signal<UrlStats | null>(null);
  loading = signal(false);

  // Chart data
  deviceData: ChartData<'doughnut'> = {
    labels: ['Mobile', 'Desktop', 'Tablet', 'Other'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#bfff00', '#00e5ff', '#ff2d55', '#1a1a24'],
      borderColor: '#0a0a0f',
      borderWidth: 4,
      hoverOffset: 15
    }]
  };

  browserData: ChartData<'doughnut'> = {
    labels: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Other'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#00e5ff', '#ff2d55', '#bfff00', '#ffffff', '#1a1a24'],
      borderColor: '#0a0a0f',
      borderWidth: 4,
      hoverOffset: 15
    }]
  };

  lineChartData: ChartData<'bar'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [12, 19, 3, 5, 2, 3, 9],
      label: 'Clicks',
      backgroundColor: '#bfff00',
      hoverBackgroundColor: '#ffffff',
      borderRadius: 0,
    }]
  };

  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#6b7280',
          font: { family: 'JetBrains Mono', size: 10 },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#12121a',
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
        cornerRadius: 0,
        padding: 10
      }
    }
  };

  lineChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#6b7280', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: { 
        grid: { color: '#1a1a24' },
        ticks: { color: '#6b7280', font: { family: 'JetBrains Mono', size: 10 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#12121a',
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
        cornerRadius: 0
      }
    }
  };

  constructor(
    private urlService: UrlService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const shortCode = this.route.snapshot.paramMap.get('shortCode');
    if (shortCode) {
      this.loadUrlStats(shortCode);
    }
  }

  loadUrlStats(shortCode: string): void {
    if (!shortCode) return;
    this.loading.set(true);
    this.urlService.getUrlStats(shortCode).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.updateCharts(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private updateCharts(data: UrlStats): void {
    // In a real app, these values would come from 'data'
    // For now, if the backend doesn't provide them, we show some representative data
    this.deviceData.datasets[0].data = [
      data.deviceTypes?.['Mobile'] || 45,
      data.deviceTypes?.['Desktop'] || 35,
      data.deviceTypes?.['Tablet'] || 15,
      data.deviceTypes?.['Other'] || 5
    ];
    
    this.browserData.datasets[0].data = [
      data.browsers?.['Chrome'] || 60,
      data.browsers?.['Firefox'] || 15,
      data.browsers?.['Safari'] || 10,
      data.browsers?.['Edge'] || 10,
      data.browsers?.['Other'] || 5
    ];

    // Force chart update
    this.deviceData = { ...this.deviceData };
    this.browserData = { ...this.browserData };
  }
}
