import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UrlPreference {
  id: number;
  userId: number;
  strategyType: 'RANDOM' | 'CUSTOM' | 'USER_PREFERENCE';
  enabled: boolean;
  priority: number;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/url-preferences`;

  constructor(private http: HttpClient) {}

  // Get all preferences
  getPreferences(): Observable<UrlPreference[]> {
    return this.http.get<UrlPreference[]>(`${this.apiUrl}/`);
  }

  // Toggle strategy
  toggleStrategy(userId: number, strategyType: string): Observable<UrlPreference> {
    return this.http.patch<UrlPreference>(
      `${this.apiUrl}/user/${userId}/strategy/${strategyType}/toggle`,
      {}
    );
  }

  // Change priority
  changePriority(userId: number, strategyType: string, priority: number): Observable<UrlPreference> {
    return this.http.patch<UrlPreference>(
      `${this.apiUrl}/user/${userId}/strategy/${strategyType}/priority`,
      { priority }
    );
  }
}
