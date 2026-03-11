export interface LoginResponse {
  token: string;
  email: string;
  userId: number;
  success: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token?: string;
  userId?: number;
  email?: string;
}

export interface UrlResponse {
  id: number;
  shortCode: string;
  originalUrl: string;
  clickCount?: number;
  createdAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export interface UrlStats {
  shortCode: string;
  totalClicks: number;
  firstClick: string;
  lastClick: string;
  deviceTypes: Record<string, number>;
  browsers: Record<string, number>;
}

export interface MyUrlsStatsDto {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
}

export interface UrlSummaryStats {
  totalUrls: number;
  totalClicks: number;
  activeLinks: number;
  expiredLinks: number;
}

export interface UrlFullMetadata {
  id: number;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  clickCount: number;
}

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
  success: boolean;
  errorMessage?: string;
}

export interface HealthResponse {
  status: string;
  timestamp?: number;
  [key: string]: any;
}
