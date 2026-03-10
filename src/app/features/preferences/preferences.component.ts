import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { PreferencesService, UrlPreference } from '../../core/services/preferences.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatListModule
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
            <h1 class="text-2xl font-bold text-gray-800">User Preferences</h1>
          </div>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-4 py-8">
        @if (loading()) {
          <div class="flex justify-center py-16">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <mat-card class="p-6">
            <h2 class="text-xl font-semibold mb-4">URL Shortening Strategies</h2>
            <p class="text-gray-600 mb-6">
              Configure your preferred URL shortening strategies. Toggle strategies on/off and adjust their priority order.
            </p>

            <mat-list>
              @for (pref of preferences(); track pref.id) {
                <mat-list-item class="mb-4">
                  <div class="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-4">
                      <mat-icon class="text-2xl">
                        @switch (pref.strategyType) {
                          @case ('RANDOM') { shuffle }
                          @case ('CUSTOM') { edit }
                          @case ('USER_PREFERENCE') { settings }
                        }
                      </mat-icon>
                      <div>
                        <h3 class="font-medium">{{ getStrategyName(pref.strategyType) }}</h3>
                        <p class="text-sm text-gray-500">{{ getStrategyDescription(pref.strategyType) }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-500">Priority:</span>
                        <button mat-icon-button
                                (click)="changePriority(pref, -1)"
                                [disabled]="pref.priority <= 1">
                          <mat-icon>arrow_upward</mat-icon>
                        </button>
                        <span class="font-medium w-8 text-center">{{ pref.priority }}</span>
                        <button mat-icon-button
                                (click)="changePriority(pref, 1)"
                                [disabled]="pref.priority >= preferences().length">
                          <mat-icon>arrow_downward</mat-icon>
                        </button>
                      </div>

                      <mat-slide-toggle
                        [checked]="pref.enabled"
                        (change)="toggleStrategy(pref)">
                      </mat-slide-toggle>
                    </div>
                  </div>
                </mat-list-item>
              }
            </mat-list>
          </mat-card>

          <mat-card class="p-6 mt-6">
            <h2 class="text-xl font-semibold mb-4">Strategy Information</h2>

            <div class="space-y-4">
              <div class="p-4 bg-blue-50 rounded-lg">
                <h3 class="font-medium text-blue-800">Random Strategy</h3>
                <p class="text-sm text-blue-600 mt-1">
                  Generates a random short code for each URL. Best for general use.
                </p>
              </div>

              <div class="p-4 bg-green-50 rounded-lg">
                <h3 class="font-medium text-green-800">Custom Strategy</h3>
                <p class="text-sm text-green-600 mt-1">
                  Allows you to specify a custom short code. Useful for branded URLs.
                </p>
              </div>

              <div class="p-4 bg-purple-50 rounded-lg">
                <h3 class="font-medium text-purple-800">User Preference Strategy</h3>
                <p class="text-sm text-purple-600 mt-1">
                  Uses your configured default preferences. Falls back to other strategies if not available.
                </p>
              </div>
            </div>
          </mat-card>
        }
      </main>
    </div>
  `
})
export class PreferencesComponent implements OnInit {
  preferences = signal<UrlPreference[]>([]);
  loading = signal(true);

  constructor(
    private preferencesService: PreferencesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.preferencesService.getPreferences().subscribe({
      next: (prefs) => {
        // Sort by priority
        this.preferences.set(prefs.sort((a, b) => a.priority - b.priority));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load preferences', 'Close', { duration: 3000 });
      }
    });
  }

  toggleStrategy(pref: UrlPreference): void {
    const userId = this.authService.getUserId();
    this.preferencesService.toggleStrategy(userId, pref.strategyType).subscribe({
      next: (updated) => {
        this.loadPreferences();
        this.snackBar.open('Strategy updated', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to update strategy', 'Close', { duration: 3000 });
      }
    });
  }

  changePriority(pref: UrlPreference, delta: number): void {
    const userId = this.authService.getUserId();
    const newPriority = pref.priority + delta;

    this.preferencesService.changePriority(userId, pref.strategyType, newPriority).subscribe({
      next: () => {
        this.loadPreferences();
        this.snackBar.open('Priority updated', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to update priority', 'Close', { duration: 3000 });
      }
    });
  }

  getStrategyName(type: string): string {
    switch (type) {
      case 'RANDOM': return 'Random';
      case 'CUSTOM': return 'Custom';
      case 'USER_PREFERENCE': return 'User Preference';
      default: return type;
    }
  }

  getStrategyDescription(type: string): string {
    switch (type) {
      case 'RANDOM': return 'Automatically generates random short codes';
      case 'CUSTOM': return 'Allows you to specify custom short codes';
      case 'USER_PREFERENCE': return 'Uses your default preferences';
      default: return '';
    }
  }
}
