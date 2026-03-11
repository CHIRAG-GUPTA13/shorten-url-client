import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { UrlStats, MyUrlsStatsDto, UrlSummaryStats } from '../models/models';
import { environment } from '../../../environments/environment';

export interface TopPerformingUrl {
  shortCode: string;
  clicks: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api`;
  private readonly urlsApiUrl = `${environment.apiBaseUrl}/api/urls`;

  constructor(private http: HttpClient, private urlService: UrlService) { }

  getUrlStats(shortCode: string): Observable<UrlStats> {
    return this.urlService.getUrlStats(shortCode);
  }

  getOverallStats(): Observable<MyUrlsStatsDto[]> {
    return this.urlService.getMyUrlsStats();
  }

  // Get summary stats - calls new backend endpoint
  getSummaryStats(): Observable<UrlSummaryStats> {
    return this.http.get<UrlSummaryStats>(`${this.urlsApiUrl}/my-urls/stats/summary`);
  }

  // Get top performing URLs - calls new backend endpoint
  getTopPerformingUrls(limit: number = 10): Observable<TopPerformingUrl[]> {
    const params = { limit: limit.toString() };
    return this.http.get<TopPerformingUrl[]>(`${this.apiUrl}/analytics/top-performing`, { params });
  }
}
