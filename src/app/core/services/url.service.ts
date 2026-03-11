import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UrlResponse {
  id: number;
  shortCode: string;
  longUrl: string;
  customSlug?: string;
  expiresAt?: string;
  createdAt: string;
  clickCount: number;
}

export interface UrlStats {
  shortCode: string;
  totalClicks: number;
  firstClick?: string;
  lastClick?: string;
  deviceTypes: { [key: string]: number };
  browsers: { [key: string]: number };
  referers: { [key: string]: number };
}

export interface MyUrlsStats {
  totalUrls: number;
  totalClicks: number;
  urlStats: UrlStats[];
}

export interface UrlShortenRequest {
  longUrl: string;
  customSlug?: string;
  expiresAt?: string;
  strategy?: 'RANDOM' | 'CUSTOM' | 'USER_PREFERENCE';
}

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/urls`;

  constructor(private http: HttpClient) {}

  // Get all URLs for current user
  getMyUrls(): Observable<UrlResponse[]> {
    return this.http.get<UrlResponse[]>(`${this.apiUrl}/my-urls`);
  }

  // Get stats for all URLs
  getMyUrlsStats(): Observable<MyUrlsStats> {
    return this.http.get<MyUrlsStats>(`${this.apiUrl}/my-urls/stats`);
  }

  // Get stats for a specific URL
  getUrlStats(shortCode: string): Observable<UrlStats> {
    return this.http.get<UrlStats>(`${this.apiUrl}/${shortCode}/stats`);
  }

  // Shorten URL (random)
  shortenUrl(request: UrlShortenRequest): Observable<UrlResponse> {
    return this.http.post<UrlResponse>(`${this.apiUrl}/shorten`, request);
  }

  // Shorten URL with custom slug
  shortenUrlCustom(longUrl: string, customSlug: string, expiresAt?: string): Observable<UrlResponse> {
    const body = {
      longUrl,
      customSlug,
      expiresAt
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
}
