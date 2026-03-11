import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'shorten',
        loadComponent: () => import('./features/shorten/shorten.component').then(m => m.ShortenComponent)
      },
      {
        path: 'archives',
        loadComponent: () => import('./features/archives/archives.component').then(m => m.ArchivesComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'analytics/:shortCode',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'bulk',
        loadComponent: () => import('./features/bulk/bulk-shorten.component').then(m => m.BulkShortenComponent)
      },
      {
        path: 'qr',
        loadComponent: () => import('./features/qr/qr-viewer.component').then(m => m.QrViewerComponent)
      },
      {
        path: 'qr/:shortCode',
        loadComponent: () => import('./features/qr/qr-viewer.component').then(m => m.QrViewerComponent)
      },
      {
        path: 'health',
        loadComponent: () => import('./features/health/health.component').then(m => m.HealthComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
