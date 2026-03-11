import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { interval, Subscription, map } from 'rxjs';
import { trigger, transition, style, query, animate } from '@angular/animations';

export const slideInAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          opacity: 0,
          transform: 'translateY(10px)'
        })
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true }),
    ])
  ]);

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  animations: [slideInAnimation],
  template: `
    <div class="layout-container">
      <!-- Top Statusbar -->
      <header class="status-bar">
        <div class="status-left">
          <span class="secure-tag">NETWORK SECURE / PRIMARY CLUSTER</span>
        </div>
        <div class="status-right">
          <span class="time-display">{{ currentTime }} <span class="cursor-blink">▋</span></span>
        </div>
      </header>

      <div class="main-body">
        <!-- Sidebar -->
        <aside class="sidebar corner-accent bracket-tr bracket-br">
          <div class="brand">
            <h1 class="glow-text">LINKCORE</h1>
            <p class="sub-brand">Optimization.v2</p>
          </div>

          <nav class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">01.</span> DASHBOARD
            </a>
            <a routerLink="/shorten" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">02.</span> SHORTEN URL
            </a>
            <a routerLink="/archives" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">03.</span> ARCHIVES
            </a>
            <a routerLink="/analytics" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">04.</span> ANALYTICS
            </a>
            <a routerLink="/bulk" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">05.</span> BULK OPS
            </a>
            <a routerLink="/qr" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">06.</span> QR TOOLS
            </a>
            <a routerLink="/health" routerLinkActive="active-nav" class="nav-item">
              <span class="nav-num">07.</span> NODE HEALTH <span class="pulse-dot bg-green"></span>
            </a>
          </nav>

          <div class="user-panel">
            <div class="user-info">
              <span class="username">@{{ authService.getUsername() }}</span>
              <span class="user-level">LEVEL 07 ADMIN</span>
            </div>
            <button class="btn logout-btn" (click)="authService.logout()">TERMINATE SESSION</button>
          </div>
        </aside>

        <!-- Content Area -->
        <main class="content-area">
          <div class="content-wrapper scrollable" [@routeAnimations]="prepareRoute(outlet)">
             <router-outlet #outlet="outlet"></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .status-bar {
      height: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-darker);
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--text-dim);
    }

    .secure-tag { color: var(--accent-cyan); }
    .time-display { color: #fff; }

    .main-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 260px;
      display: flex;
      flex-direction: column;
      background: var(--bg-darker);
      border-right: 1px solid var(--border-color);
      padding: 30px 0;
      z-index: 10;
    }

    .brand {
      padding: 0 30px 40px;
    }

    .glow-text {
      color: var(--accent-green);
      font-size: 24px;
      margin-bottom: 5px;
      text-shadow: var(--glow-green);
    }

    .sub-brand { font-size: 9px; color: var(--text-dim); text-transform: uppercase; }

    .nav-links {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .nav-item {
      padding: 15px 30px;
      display: block;
      color: var(--text-main);
      font-size: 12px;
      position: relative;
      transition: all 0.3s;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: rgba(200, 255, 0, 0.05);
      color: var(--accent-green);
    }

    .nav-num { color: var(--text-dim); margin-right: 10px; width: 25px; display: inline-block; }

    .active-nav {
      background: rgba(0, 242, 255, 0.1);
      color: var(--accent-cyan) !important;
      border-left: 3px solid var(--accent-cyan);
    }

    .active-nav .nav-num { color: var(--accent-cyan); opacity: 0.5; }

    .user-panel {
      padding: 20px;
      border-top: 1px solid var(--border-color);
    }

    .user-info { display: flex; flex-direction: column; margin-bottom: 15px; }
    .username { font-weight: 700; color: white; margin-bottom: 4px; }
    .user-level { font-size: 9px; color: var(--accent-green); opacity: 0.8; }

    .logout-btn { width: 100%; border-color: var(--accent-red); color: var(--accent-red); font-size: 10px; }
    .logout-btn:hover { background: rgba(255, 62, 62, 0.1); box-shadow: 0 0 10px rgba(255, 62, 62, 0.3); }

    .content-area {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .content-wrapper { height: 100%; padding: 40px; overflow-y: auto; }

    .bg-green { background-color: var(--accent-green); }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentTime = '';
  private timerSub: Subscription | undefined;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.timerSub = interval(1000).pipe(
      map(() => new Date().toISOString().split('T')[1].split('.')[0] + ' UTC')
    ).subscribe(t => this.currentTime = t);
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
