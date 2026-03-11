import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlService } from '../../core/services/url.service';
import { UrlResponse } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { animate, style, transition, trigger, state } from '@angular/animations';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  template: `
    <div class="panel corner-accent bracket-tl bracket-tr">
      <h2 class="panel-title">ARCHIVE_REGISTRY.DB</h2>
      
      <div class="table-container">
        <table class="terminal-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>ORIGINAL_URL</th>
              <th>CREATED</th>
              <th>STATUS</th>
              <th>CLICKS</th>
              <th class="text-right">OPS</th>
            </tr>
          </thead>
          <tbody>
            @for (url of urls(); track url.id) {
              <tr class="row-hover" (click)="toggleRow(url.shortCode)">
                <td class="text-green font-bold">/{{ url.shortCode }}</td>
                <td class="text-dim truncate" style="max-width: 250px;">{{ url.originalUrl }}</td>
                <td>{{ url.createdAt | date:'shortDate' }}</td>
                <td>
                  <span class="badge" [class.badge-active]="isActive(url)" [class.badge-expired]="isExpired(url)">
                    {{ getStatus(url) }}
                  </span>
                </td>
                <td class="text-cyan">{{ url.clickCount }}</td>
                <td class="text-right ops-cell" (click)="$event.stopPropagation()">
                  <button class="btn-icon text-red" (click)="confirmDelete(url.shortCode)">
                    {{ deleteConfirm()[url.shortCode] ? 'CONFIRM?' : 'KILL' }}
                  </button>
                </td>
              </tr>
              <!-- Expanded Row Details -->
              @if (expandedRow() === url.shortCode) {
                <tr class="detail-row" (click)="$event.stopPropagation()">
                  <td colspan="6">
                    <div class="detail-content" [@detailExpand]="'expanded'">
                      <div class="grid-details">
                         <div class="detail-item">
                            <span class="label">FULL_TARGET:</span>
                            <span class="value">{{ url.originalUrl }}</span>
                         </div>
                         <div class="detail-item">
                            <span class="label">SHORT_PATH:</span>
                            <span class="value">{{ getFullUrl(url.shortCode) }}</span>
                         </div>
                         <div class="detail-item">
                            <span class="label">EXPIRATION:</span>
                            <span class="value">{{ url.expiresAt ? (url.expiresAt | date:'medium') : 'NEVER' }}</span>
                         </div>
                         <div class="detail-item">
                            <span class="label">NODE_ID:</span>
                            <span class="value">REGION-01-S{{ url.id }}</span>
                         </div>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr><td colspan="6" class="text-center py-20 text-dim">EMPTY_REGISTRY_BUFFER</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel-title { font-size: 14px; margin-bottom: 25px; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
    
    .table-container { overflow-x: auto; }
    .row-hover { cursor: pointer; transition: background 0.2s; }
    .row-hover:hover { background: rgba(200, 255, 0, 0.05); }

    .ops-cell button { background: transparent; border: 1px solid currentColor; font-family: inherit; font-size: 9px; padding: 4px 8px; cursor: pointer; text-transform: uppercase; }
    .ops-cell button:hover { background: rgba(255, 62, 62, 0.1); }

    .text-right { text-align: right; }
    .text-green { color: var(--accent-green); }
    .text-cyan { color: var(--accent-cyan); }
    .text-red { color: var(--accent-red); }
    .text-dim { color: var(--text-dim); }

    .detail-row { background: var(--bg-darker); border-left: 2px solid var(--accent-green); }
    .detail-content { overflow: hidden; padding: 20px; border-bottom: 1px solid var(--border-color); }
    
    .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .detail-item { display: flex; flex-direction: column; gap: 5px; }
    .detail-item .label { font-size: 9px; color: var(--text-dim); }
    .detail-item .value { font-size: 11px; word-break: break-all; }
  `]
})
export class ArchivesComponent implements OnInit {
  urls = signal<UrlResponse[]>([]);
  expandedRow = signal<string | null>(null);
  deleteConfirm = signal<{ [key: string]: boolean }>({});

  constructor(private urlService: UrlService) {}

  ngOnInit(): void {
    this.loadUrls();
  }

  loadUrls() {
    this.urlService.getMyUrls().subscribe(res => this.urls.set(res));
  }

  toggleRow(code: string) {
    this.expandedRow.set(this.expandedRow() === code ? null : code);
  }

  confirmDelete(code: string) {
    if (this.deleteConfirm()[code]) {
      this.urlService.deleteUrl(code).subscribe(() => {
        this.loadUrls();
        const conf = { ...this.deleteConfirm() };
        delete conf[code];
        this.deleteConfirm.set(conf);
      });
    } else {
      const conf = { ...this.deleteConfirm() };
      conf[code] = true;
      this.deleteConfirm.set(conf);
      setTimeout(() => {
        const reset = { ...this.deleteConfirm() };
        reset[code] = false;
        this.deleteConfirm.set(reset);
      }, 3000);
    }
  }

  isActive(url: UrlResponse): boolean {
    return !url.expiresAt || new Date(url.expiresAt) > new Date();
  }

  isExpired(url: UrlResponse): boolean {
    return !!url.expiresAt && new Date(url.expiresAt) <= new Date();
  }

  getStatus(url: UrlResponse): string {
    if (this.isExpired(url)) return 'EXPIRED';
    return 'ACTIVE';
  }

  getFullUrl(code: string): string {
    return `${environment.apiBaseUrl}/${code}`;
  }
}
