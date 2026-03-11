import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UrlService, UrlResponse } from '../../core/services/url.service';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-urls',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase">
            Asset.<span class="text-accent-blue">Archive</span>
          </h2>
          <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Registry of all compacted streams</p>
        </div>
        <button (click)="loadUrls()" class="btn btn-secondary text-[10px] flex items-center gap-2">
           <span class="animate-spin-slow">↻</span> REFRESH_INDEX
        </button>
      </div>

      <div class="card p-0 overflow-hidden border-dark-border">
        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-[12px]">
            <thead>
              <tr class="bg-dark-lighter border-b border-dark-border text-muted uppercase tracking-widest">
                <th class="px-6 py-4 font-normal">Ident</th>
                <th class="px-6 py-4 font-normal">Original_Source</th>
                <th class="px-6 py-4 font-normal text-center">Load</th>
                <th class="px-6 py-4 font-normal">Created</th>
                <th class="px-6 py-4 font-normal text-right">Ops</th>
              </tr>
            </thead>
            <tbody [@listAnimation]="urls().length">
              @for (url of urls(); track url.id) {
                <tr class="group border-b border-dark-border/50 hover:bg-white/[0.02] transition-colors">
                  <td class="px-6 py-4">
                    <a [href]="getShortUrl(url.shortCode)" target="_blank" class="text-accent-green hover:underline">
                      /{{ url.shortCode }}
                    </a>
                  </td>
                  <td class="px-6 py-4">
                    <div class="max-w-xs truncate text-muted group-hover:text-white transition-colors" [title]="url.longUrl">
                      {{ url.longUrl }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                      {{ url.clickCount }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-muted">
                    {{ formatDate(url.createdAt) }}
                  </td>
                  <td class="px-6 py-4 text-right space-x-3">
                    <button [routerLink]="['/analytics', url.shortCode]" class="text-accent-blue hover:text-white transition-colors uppercase text-[10px]">Stats</button>
                    <button [routerLink]="['/qr', url.shortCode]" class="text-muted hover:text-white transition-colors uppercase text-[10px]">QR</button>
                    <button (click)="deleteUrl(url.shortCode)" class="text-accent-red/50 hover:text-accent-red transition-colors uppercase text-[10px]">Kill</button>
                  </td>
                </tr>
              } @empty {
                @if (!loading()) {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-muted uppercase tracking-[0.2em] opacity-50">
                      No data streams found in local buffer.
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        
        @if (loading()) {
          <div class="p-12 flex justify-center border-t border-dark-border bg-dark/50">
             <div class="flex items-center gap-3 font-mono text-[10px] text-accent-green uppercase tracking-[0.4em]">
               <span class="w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin"></span>
               Retrieving Registry...
             </div>
          </div>
        }
      </div>

      <!-- Total Stats Footer Overlay (Optional aesthetic) -->
      <div class="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-muted">
         <div class="px-3 py-1 border border-dark-border">Index_Size: {{ urls().length }}</div>
         <div class="px-3 py-1 border border-dark-border">Buffer_Status: SYNCED</div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 3s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class MyUrlsComponent implements OnInit {
  urls = signal<UrlResponse[]>([]);
  loading = signal(false);

  constructor(private urlService: UrlService) {}

  ngOnInit(): void {
    this.loadUrls();
  }

  loadUrls(): void {
    this.loading.set(true);
    this.urlService.getMyUrls().subscribe({
      next: (data) => {
        this.urls.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deleteUrl(code: string): void {
    if (confirm(`INITIATE DESTRUCTION PROTOCOL FOR /${code}?`)) {
      this.urlService.deleteUrl(code).subscribe({
        next: () => this.loadUrls(),
        error: (err) => alert(err.error?.message || 'Destruction failed.')
      });
    }
  }

  getShortUrl(code: string): string {
    return `${environment.apiBaseUrl}/${code}`;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    }).replace(/\//g, '.');
  }
}
