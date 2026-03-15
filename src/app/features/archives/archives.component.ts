import { Component, OnInit, signal, computed } from '@angular/core';
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
      
      <div class="search-bar mb-20">
        <div class="input-with-prefix">
          <span class="input-prefix text-cyan">SCAN_QUERY ></span>
          <input type="text" class="input" placeholder="SEARCH_BY_CODE_OR_URL..." (input)="onSearch($event)">
        </div>
      </div>
 
      <div class="table-container">
        <table class="terminal-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>ORIGINAL_URL</th>
              <th>CREATED</th>
              <th>STATUS</th>
              <th>CLICKS</th>
              <th class="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (url of filteredUrls(); track url.id) {
              <tr class="row-hover" (click)="toggleRow(url.shortCode)">
                <td class="text-green font-bold">
                  <div class="code-cell">
                    /{{ url.shortCode }}
                    <button class="copy-small" (click)="copyCode($event, url.shortCode)" [title]="'COPY_LINK'">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </td>
                <td class="text-dim truncate" style="max-width: 250px;">{{ url.originalUrl }}</td>
                <td>{{ url.createdAt | date:'mediumDate' }}</td>
                <td>
                  <span class="badge" [class.badge-active]="isActive(url)" [class.badge-expired]="isExpired(url)">
                    {{ getStatus(url) }}
                  </span>
                </td>
                <td class="text-cyan">{{ url.clickCount }}</td>
                <td class="text-right ops-cell" (click)="$event.stopPropagation()">
                  <button class="btn-icon text-red" (click)="confirmDelete(url.shortCode)">
                    {{ deleteConfirm()[url.shortCode] ? 'CONFIRM?' : 'DELETE' }}
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
    
    .search-bar { width: 100%; max-width: 400px; }
    .mb-20 { margin-bottom: 20px; }
    .input-with-prefix { display: flex; align-items: center; border: 1px solid var(--border-color); background: var(--bg-color); }
    .input-prefix { padding: 0 15px; font-size: 10px; flex-shrink: 0; }
    .input-with-prefix .input { border: none; }

    .table-container { overflow-x: auto; }
    .row-hover { cursor: pointer; transition: background 0.2s; }
    .row-hover:hover { background: rgba(200, 255, 0, 0.05); }

    .code-cell { display: flex; align-items: center; gap: 8px; }
    .copy-small { background: transparent; border: none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
    .copy-small:hover { color: var(--accent-cyan); }

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
    .py-40 { padding-top: 40px; padding-bottom: 40px; }
  `]
})
export class ArchivesComponent implements OnInit {
  urls = signal<UrlResponse[]>([]);
  searchQuery = signal('');
  expandedRow = signal<string | null>(null);
  deleteConfirm = signal<{ [key: string]: boolean }>({});
 
  filteredUrls = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.urls();
    return this.urls().filter(u => 
      u.shortCode.toLowerCase().includes(query) || 
      u.originalUrl.toLowerCase().includes(query)
    );
  });

  constructor(private urlService: UrlService) {}

  ngOnInit(): void {
    this.loadUrls();
  }

  loadUrls() {
    this.urlService.getMyUrls().subscribe(res => this.urls.set(res));
  }
 
  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }
 
  copyCode(event: Event, code: string) {
    event.stopPropagation();
    const url = this.getFullUrl(code);
    navigator.clipboard.writeText(url);
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
