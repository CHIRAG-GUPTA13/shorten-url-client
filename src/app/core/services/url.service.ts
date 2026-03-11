import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UrlResponse, UrlStats, MyUrlsStatsDto, UrlSummaryStats, UrlFullMetadata } from '../models/models';

export interface UrlShortenRequest {
  originalUrl: string;
  shortCode?: string;
  expiryDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/urls`;

  constructor(private http: HttpClient) { }

  // Get all URLs for current user
  getMyUrls(): Observable<UrlResponse[]> {
    return this.http.get<UrlResponse[]>(`${this.apiUrl}/my-urls`);
  }

  // Get stats for all URLs
  getMyUrlsStats(): Observable<MyUrlsStatsDto[]> {
    return this.http.get<MyUrlsStatsDto[]>(`${this.apiUrl}/my-urls/stats`);
  }

  // Get stats for a specific URL
  getUrlStats(shortCode: string): Observable<UrlStats> {
    return this.http.get<UrlStats>(`${this.apiUrl}/${shortCode}/stats`);
  }

  // Shorten URL (random)
  shortenUrl(originalUrl: string, expiryDate?: string): Observable<UrlResponse> {
    const body: any = { originalUrl };
    if (expiryDate) body.expiryDate = expiryDate;
    return this.http.post<UrlResponse>(`${this.apiUrl}/shorten`, body);
  }

  // Shorten URL with custom slug
  shortenUrlCustom(originalUrl: string, shortCode: string, expiryDate?: string): Observable<UrlResponse> {
    const body: any = { 
      originalUrl,
      shortCode,
      expiryDate: expiryDate || null
    };
    return this.http.post<UrlResponse>(`${this.apiUrl}/shorten/custom`, body);
  }

  // Delete a URL (soft delete)
  deleteUrl(shortCode: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${shortCode}`);
  }

  // Get QR code image as blob
  getQrCodeImage(shortCode: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${shortCode}/qr/image`, {
      responseType: 'blob'
    });
  }

  // Get QR code as base64 JSON
  getQrCode(shortCode: string): Observable<{ image: string }> {
    return this.http.get<{ image: string }>(`${this.apiUrl}/${shortCode}/qr`);
  }

  // Get summary stats for all URLs (new endpoint)
  getMyUrlsStatsSummary(): Observable<UrlSummaryStats> {
    return this.http.get<UrlSummaryStats>(`${this.apiUrl}/my-urls/stats/summary`);
  }

  // Get full metadata for a URL including clickCount and ownerInfo (new endpoint)
  getUrlFullMetadata(shortCode: string): Observable<UrlFullMetadata> {
    return this.http.get<UrlFullMetadata>(`${this.apiUrl}/${shortCode}/metadata`);
  }
}
