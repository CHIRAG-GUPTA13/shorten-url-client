import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { UrlService, UrlStats, MyUrlsStats } from '../../core/services/url.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BaseChartDirective
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
            <h1 class="text-2xl font-bold text-gray-800">Analytics</h1>
          </div>
          @if (shortCode()) {
            <span class="text-gray-600">URL: {{ shortCode() }}</span>
          }
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8">
        @if (loading()) {
          <div class="flex justify-center py-16">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <mat-card class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500">Total URLs</p>
                  <p class="text-3xl font-bold">{{ aggregatedStats()?.totalUrls || 0 }}</p>
                </div>
                <mat-icon class="text-4xl text-blue-500">link</mat-icon>
              </div>
            </mat-card>

            <mat-card class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500">Total Clicks</p>
                  <p class="text-3xl font-bold">{{ aggregatedStats()?.totalClicks || 0 }}</p>
                </div>
                <mat-icon class="text-4xl text-green-500">touch_app</mat-icon>
              </div>
            </mat-card>

            <mat-card class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500">Avg. Clicks/URL</p>
                  <p class="text-3xl font-bold">
                    {{ getAverageClicks() }}
                  </p>
                </div>
                <mat-icon class="text-4xl text-purple-500">analytics</mat-icon>
              </div>
            </mat-card>
          </div>

          <!-- URL-specific stats -->
          @if (urlStats()) {
            <mat-card class="mb-8 p-6">
              <h2 class="text-xl font-semibold mb-4">URL Performance: {{ shortCode() }}</h2>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-100 p-4 rounded">
                  <p class="text-gray-500">Total Clicks</p>
                  <p class="text-2xl font-bold">{{ urlStats()?.totalClicks || 0 }}</p>
                </div>
                <div class="bg-gray-100 p-4 rounded">
                  <p class="text-gray-500">First Access</p>
                  <p class="text-lg font-medium">{{ urlStats()?.firstAccess ? formatDate(urlStats()!.firstAccess!) : 'N/A' }}</p>
                </div>
                <div class="bg-gray-100 p-4 rounded">
                  <p class="text-gray-500">Last Access</p>
                  <p class="text-lg font-medium">{{ urlStats()?.lastAccess ? formatDate(urlStats()!.lastAccess!) : 'N/A' }}</p>
                </div>
              </div>

              <!-- Charts -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 class="font-medium mb-2">Device Types</h3>
                  <canvas baseChart
                    [data]="deviceChartData"
                    [type]="'doughnut'"
                    [options]="chartOptions">
                  </canvas>
                </div>
                <div>
                  <h3 class="font-medium mb-2">Browsers</h3>
                  <canvas baseChart
                    [data]="browserChartData"
                    [type]="'pie'"
                    [options]="chartOptions">
                  </canvas>
                </div>
              </div>

              <!-- Referrers Table -->
              <div class="mt-8">
                <h3 class="font-medium mb-2">Top Referrers</h3>
                <table class="w-full">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-2">Referrer</th>
                      <th class="text-right py-2">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of getReferrerEntries(); track item[0]) {
                      <tr class="border-b">
                        <td class="py-2">{{ item[0] || 'Direct' }}</td>
                        <td class="text-right py-2">{{ item[1] }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card>
          }

          <!-- All URLs Stats Table -->
          <mat-card class="p-6">
            <h2 class="text-xl font-semibold mb-4">All URLs Statistics</h2>

            @if (aggregatedStats()?.urlStats?.length) {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-3 px-4">Short Code</th>
                      <th class="text-right py-3 px-4">Total Clicks</th>
                      <th class="text-left py-3 px-4">First Access</th>
                      <th class="text-left py-3 px-4">Last Access</th>
                      <th class="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (stat of aggregatedStats()!.urlStats; track stat.shortCode) {
                      <tr class="border-b hover:bg-gray-50">
                        <td class="py-3 px-4">
                          <a [routerLink]="['/analytics', stat.shortCode]" class="text-blue-600 hover:underline">
                            {{ stat.shortCode }}
                          </a>
                        </td>
                        <td class="text-right py-3 px-4">{{ stat.totalClicks }}</td>
                        <td class="py-3 px-4">{{ stat.firstAccess ? formatDate(stat.firstAccess) : 'N/A' }}</td>
                        <td class="py-3 px-4">{{ stat.lastAccess ? formatDate(stat.lastAccess) : 'N/A' }}</td>
                        <td class="text-center py-3 px-4">
                          <button mat-icon-button [routerLink]="['/analytics', stat.shortCode]">
                            <mat-icon>visibility</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-gray-500 text-center py-8">No statistics available yet.</p>
            }
          </mat-card>
        }
      </main>
    </div>
  `
})
export class AnalyticsComponent implements OnInit {
  shortCode = signal<string | null>(null);
  urlStats = signal<UrlStats | null>(null);
  aggregatedStats = signal<MyUrlsStats | null>(null);
  loading = signal(true);

  deviceChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  browserChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private urlService: UrlService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const shortCode = this.route.snapshot.paramMap.get('shortCode');
    if (shortCode) {
      this.shortCode.set(shortCode);
      this.loadUrlStats(shortCode);
    } else {
      this.loadAggregatedStats();
    }
  }

  loadUrlStats(shortCode: string): void {
    this.loading.set(true);
    this.urlService.getUrlStats(shortCode).subscribe({
      next: (stats) => {
        this.urlStats.set(stats);
        this.updateCharts(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load URL stats', 'Close', { duration: 3000 });
      }
    });
  }

  loadAggregatedStats(): void {
    this.loading.set(true);
    this.urlService.getMyUrlsStats().subscribe({
      next: (stats) => {
        this.aggregatedStats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load stats', 'Close', { duration: 3000 });
      }
    });
  }

  updateCharts(stats: UrlStats): void {
    // Device types chart
    const deviceEntries = Object.entries(stats.deviceTypes || {});
    this.deviceChartData = {
      labels: deviceEntries.map(([key]) => key),
      datasets: [{
        data: deviceEntries.map(([, value]) => value),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }]
    };

    // Browser chart
    const browserEntries = Object.entries(stats.browsers || {});
    this.browserChartData = {
      labels: browserEntries.map(([key]) => key),
      datasets: [{
        data: browserEntries.map(([, value]) => value),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
      }]
    };
  }

  getAverageClicks(): string {
    const stats = this.aggregatedStats();
    if (!stats || !stats.totalUrls) return '0';
    return (stats.totalClicks / stats.totalUrls).toFixed(1);
  }

  getReferrerEntries(): [string, number][] {
    const stats = this.urlStats();
    if (!stats?.referers) return [];
    return Object.entries(stats.referers).sort((a, b) => b[1] - a[1]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
