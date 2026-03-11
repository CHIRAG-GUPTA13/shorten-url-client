import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  animations: [
    trigger('sidebarToggle', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ],
  template: `
    <div class="h-screen flex bg-dark text-white font-sans overflow-hidden">
      <!-- Background Grid Overlay -->
      <div class="fixed inset-0 opacity-5 pointer-events-none" 
           style="background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 40px 40px;"></div>

      <!-- Sidebar -->
      <aside class="w-64 border-r border-dark-border flex flex-col z-20 bg-dark relative" @sidebarToggle>
        <div class="p-8 border-b border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 border border-accent-green flex items-center justify-center font-mono text-accent-green">
              λ
            </div>
            <h1 class="font-mono font-bold tracking-tighter uppercase">Link<span class="text-accent-green font-normal">Core</span></h1>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">01.</span> Dashboard
          </a>
          <a routerLink="/shorten" routerLinkActive="active-link" class="nav-item text-accent-green">
             <span class="mono-num">02.</span> Shorten URL
          </a>
          <a routerLink="/my-urls" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">03.</span> Archives
          </a>
          <a routerLink="/analytics" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">04.</span> Analytics
          </a>
          <a routerLink="/bulk" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">05.</span> Bulk Ops
          </a>
          <a routerLink="/qr" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">06.</span> QR Tools
          </a>
          <div class="pt-8 pb-2 px-4 text-[10px] font-mono text-muted uppercase tracking-widest">System</div>
          <a routerLink="/health" routerLinkActive="active-link" class="nav-item">
            <span class="mono-num">07.</span> Node Health
          </a>
        </nav>

        <div class="p-6 border-t border-dark-border mt-auto">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-dark-border border border-muted/20 flex items-center justify-center font-mono text-accent-blue text-xs overflow-hidden">
               USR
            </div>
            <div class="flex-1 overflow-hidden">
              <div class="text-xs font-mono truncate text-accent-blue">@{{ authService.getUserEmail().split('@')[0] }}</div>
              <div class="text-[9px] font-mono text-muted uppercase tracking-tight">Level 07 Admin</div>
            </div>
          </div>
          <button (click)="authService.logout()" class="btn btn-secondary w-full text-[10px] uppercase font-bold tracking-widest border-accent-red/20 hover:border-accent-red hover:text-accent-red">
            Terminate Session
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col min-w-0 relative z-10">
        <!-- Top Bar -->
        <header class="h-16 border-b border-dark-border flex items-center justify-between px-8 bg-dark/80 backdrop-blur-md">
          <div class="flex items-center gap-4">
             <div class="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
             <div class="font-mono text-[10px] text-muted uppercase tracking-widest">Network Secure / Primary Cluster</div>
          </div>
          <div class="flex items-center gap-6">
            <div class="font-mono text-[10px] text-accent-blue">Latency: <span class="text-white">14ms</span></div>
            <div class="w-px h-4 bg-dark-border"></div>
            <div class="font-mono text-[10px] text-muted uppercase">03:44:11 UTC</div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nav-item {
      @apply flex items-center gap-3 px-4 py-3 font-mono text-[12px] uppercase tracking-widest border border-transparent transition-all opacity-60 hover:opacity-100;
    }
    .active-link {
      @apply border-dark-border bg-dark-lighter opacity-100 text-white shadow-[0_4px_20px_-10px_rgba(0,229,255,0.2)];
    }
    .mono-num {
      @apply text-[10px] text-muted;
    }
    .active-link .mono-num {
      @apply text-accent-blue;
    }
  `]
})
export class MainLayoutComponent {
  constructor(public authService: AuthService) {}
}
