import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserPreference {
  strategyId: string;
  isEnabled: boolean;
  priority: number;
}

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/preferences`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<UserPreference[]> {
    return this.http.get<UserPreference[]>(`${this.apiUrl}/`);
  }

  toggleStrategy(strategyId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/toggle`, { strategyId });
  }

  updatePriority(priorities: string[]): Observable<void> {
    // Send raw JSON array as per contract
    return this.http.post<void>(`${this.apiUrl}/priority`, priorities);
  }
}
