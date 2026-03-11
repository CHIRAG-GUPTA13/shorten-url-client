import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/health`;

  constructor(private http: HttpClient) {}

  getCoreHealth(): Observable<HealthResponse> {
    const start = Date.now();
    return this.http.get<HealthResponse>(this.apiUrl).pipe(
      map(res => ({ ...res, timestamp: Date.now() - start })),
      catchError(() => of({ status: 'DOWN', timestamp: 0 }))
    );
  }

  getRedisHealth(): Observable<HealthResponse> {
    const start = Date.now();
    return this.http.get<HealthResponse>(`${this.apiUrl}/redis`).pipe(
      map(res => ({ ...res, timestamp: Date.now() - start })),
      catchError(() => of({ status: 'DOWN', timestamp: 0 }))
    );
  }
}
