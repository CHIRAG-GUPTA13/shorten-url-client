import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UrlResponse, UrlStats, MyUrlsStatsDto, UrlSummaryStats, UrlFullMetadata, ApiResponse, QrCodeResponse } from '../models/models';

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
    return this.http.get<ApiResponse<UrlResponse[]>>(`${this.apiUrl}/my-urls`).pipe(map(res => res.data));
  }

  // Get stats for all URLs
  getMyUrlsStats(): Observable<MyUrlsStatsDto[]> {
    return this.http.get<ApiResponse<MyUrlsStatsDto[]>>(`${this.apiUrl}/my-urls/stats`).pipe(map(res => res.data));
  }

  // Get stats for a specific URL
  getUrlStats(shortCode: string): Observable<UrlStats> {
    return this.http.get<ApiResponse<UrlStats>>(`${this.apiUrl}/${shortCode}/stats`).pipe(map(res => res.data));
  }

  // Shorten URL (random)
  shortenUrl(originalUrl: string, expiryDate?: string): Observable<UrlResponse> {
    const body: any = { originalUrl };
    if (expiryDate) body.expiryDate = expiryDate;
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/shorten`, body).pipe(
      map(res => ({
        id: 0,
        shortCode: res.data,
        originalUrl: originalUrl,
        createdAt: new Date().toISOString()
      } as UrlResponse))
    );
  }

  // Shorten URL with custom slug
  shortenUrlCustom(originalUrl: string, shortCode: string, expiryDate?: string): Observable<UrlResponse> {
    const body: any = { 
      originalUrl,
      shortCode,
      expiryDate: expiryDate || null
    };
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/shorten/custom`, body).pipe(
      map(res => ({
        id: 0,
        shortCode: res.data,
        originalUrl: originalUrl,
        createdAt: new Date().toISOString()
      } as UrlResponse))
    );
  }

  // Delete a URL (soft delete)
  deleteUrl(shortCode: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${shortCode}`).pipe(map(() => undefined));
  }

  // Get QR code image as blob
  getQrCodeImage(shortCode: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${shortCode}/qr/image`, {
      responseType: 'blob'
    });
  }

  // Get QR code as base64 JSON
  getQrCode(shortCode: string): Observable<QrCodeResponse> {
    return this.http.get<ApiResponse<QrCodeResponse>>(`${this.apiUrl}/${shortCode}/qr`).pipe(map(res => res.data));
  }

  // Get summary stats for all URLs (new endpoint)
  getMyUrlsStatsSummary(): Observable<UrlSummaryStats> {
    return this.http.get<ApiResponse<UrlSummaryStats>>(`${this.apiUrl}/my-urls/stats/summary`).pipe(map(res => res.data));
  }

  // Get full metadata for a URL including clickCount and ownerInfo (new endpoint)
  getUrlFullMetadata(shortCode: string): Observable<UrlFullMetadata> {
    return this.http.get<ApiResponse<UrlFullMetadata>>(`${this.apiUrl}/${shortCode}/metadata`).pipe(map(res => res.data));
  }
}
