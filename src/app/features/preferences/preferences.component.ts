import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferencesService, UrlPreference } from '../../core/services/preferences.service';
import { AuthService } from '../../core/services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-10" @slideUp>
      <div>
        <h2 class="text-3xl font-mono font-bold tracking-tighter uppercase text-accent-blue">
          System.<span class="text-white">Overrides</span>
        </h2>
        <p class="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Configure URL generation heuristics</p>
      </div>

      <div class="space-y-6">
        @if (loading()) {
          <div class="flex justify-center p-20">
             <div class="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full"></div>
          </div>
        } @else {
          @for (pref of preferences(); track pref.id) {
            <div class="card flex flex-col md:flex-row items-center justify-between gap-6 hover:border-accent-blue/40 transition-all">
              <div class="flex items-center gap-6">
                <div class="w-12 h-12 bg-dark border border-dark-border flex items-center justify-center font-mono text-xl"
                     [class.text-accent-green]="pref.enabled"
                     [class.text-muted]="!pref.enabled">
                  @switch (pref.strategyType) {
                    @case ('RANDOM') { R }
                    @case ('CUSTOM') { C }
                    @case ('USER_PREFERENCE') { P }
                  }
                </div>
                <div>
                  <h3 class="font-mono text-sm uppercase tracking-widest" [class.text-accent-green]="pref.enabled">
                    {{ pref.strategyType }}
                  </h3>
                  <p class="text-[10px] font-mono text-muted uppercase mt-1">
                    {{ getStrategyDescription(pref.strategyType) }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-6">
                <!-- Priority Control -->
                <div class="flex items-center border border-dark-border bg-dark rounded-none overflow-hidden">
                  <div class="px-3 py-1 font-mono text-[9px] text-muted uppercase border-r border-dark-border">Priority</div>
                  <button (click)="changePriority(pref, -1)" 
                          [disabled]="pref.priority <= 1"
                          class="px-3 py-1 text-xs hover:bg-dark-border disabled:opacity-30">▲</button>
                  <div class="px-4 py-1 font-mono text-xs border-x border-dark-border">{{ pref.priority }}</div>
                  <button (click)="changePriority(pref, 1)" 
                          [disabled]="pref.priority >= preferences().length"
                          class="px-3 py-1 text-xs hover:bg-dark-border disabled:opacity-30">▼</button>
                </div>

                <!-- Toggle -->
                <button (click)="toggleStrategy(pref)" 
                        [class.bg-accent-green]="pref.enabled"
                        [class.text-dark]="pref.enabled"
                        [class.border-accent-green]="pref.enabled"
                        class="btn flex items-center gap-2 group">
                  <span class="text-[10px] font-bold uppercase tracking-widest">
                    {{ pref.enabled ? 'INITIALIZED' : 'OFFLINE' }}
                  </span>
                  <div class="w-2 h-2 rounded-full" 
                       [class.bg-dark]="pref.enabled" 
                       [class.bg-accent-red]="!pref.enabled"
                       [class.animate-pulse]="pref.enabled"></div>
                </button>
              </div>
            </div>
          }
        }
      </div>

      <div class="card bg-accent-blue/5 border-dashed border-accent-blue/20">
        <h3 class="font-mono text-[10px] text-accent-blue uppercase tracking-widest mb-4">Neural_Strategy_Info</h3>
        <p class="font-mono text-[11px] text-muted leading-relaxed uppercase opacity-80">
          The system evaluates enabled strategies in descending order of priority. 
          If a strategy fails to produce a valid identifier (e.g. custom slug collision), 
          the protocol falls back to the next available heuristic.
        </p>
      </div>
    </div>
  `
})
export class PreferencesComponent implements OnInit {
  preferences = signal<UrlPreference[]>([]);
  loading = signal(true);

  constructor(
    private preferencesService: PreferencesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.preferencesService.getPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs.sort((a, b) => a.priority - b.priority));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleStrategy(pref: UrlPreference): void {
    const userId = this.authService.getUserId();
    this.preferencesService.toggleStrategy(userId, pref.strategyType).subscribe(() => this.loadPreferences());
  }

  changePriority(pref: UrlPreference, delta: number): void {
    const userId = this.authService.getUserId();
    const newPriority = pref.priority + delta;
    this.preferencesService.changePriority(userId, pref.strategyType, newPriority).subscribe(() => this.loadPreferences());
  }

  getStrategyDescription(type: string): string {
    switch (type) {
      case 'RANDOM': return 'Entropy-based code generation';
      case 'CUSTOM': return 'User-defined branded identifier';
      case 'USER_PREFERENCE': return 'Heuristic pool injection';
      default: return '';
    }
  }
}
