import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'shorten',
    pathMatch: 'full'
  },
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
        path: 'dashboard',
        redirectTo: 'shorten',
        pathMatch: 'full'
      },
      {
        path: 'shorten',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'my-urls',
        loadComponent: () => import('./features/my-urls/my-urls.component').then(m => m.MyUrlsComponent)
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
      },
      {
        path: 'preferences',
        loadComponent: () => import('./features/preferences/preferences.component').then(m => m.PreferencesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'shorten'
  }
];
