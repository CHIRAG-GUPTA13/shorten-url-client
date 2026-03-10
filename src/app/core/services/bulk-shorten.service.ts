import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BulkShortenJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalUrls: number;
  processedUrls: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface BulkShortenResult {
  id: number;
  longUrl: string;
  shortCode?: string;
  shortUrl?: string;
  success: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BulkShortenService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/urls/bulk`;

  constructor(private http: HttpClient) {}

  // Upload CSV file
  uploadCsv(file: File): Observable<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ jobId: string }>(`${this.apiUrl}/upload`, formData);
  }

  // Submit JSON list
  submitJson(urls: string[]): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(`${this.apiUrl}/submit`, { urls });
  }

  // Get job status
  getJobStatus(jobId: string): Observable<BulkShortenJob> {
    return this.http.get<BulkShortenJob>(`${this.apiUrl}/job/${jobId}`);
  }

  // Get job results
  getJobResults(jobId: string): Observable<BulkShortenResult[]> {
    return this.http.get<BulkShortenResult[]>(`${this.apiUrl}/job/${jobId}/results`);
  }

  // Get all jobs
  getAllJobs(): Observable<BulkShortenJob[]> {
    return this.http.get<BulkShortenJob[]>(`${this.apiUrl}/jobs`);
  }
}
