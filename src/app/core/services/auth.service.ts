import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginResponse, RegisterResponse } from '../models/models';

export interface UserState {
  userId: number;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'linkcore_auth_token';
  private readonly USER_KEY = 'linkcore_auth_user';
  
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  authStatus$ = this.authStatusSubject.asObservable();
  
  private userSubject = new BehaviorSubject<UserState | null>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): UserState | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.authStatusSubject.value;
  }

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res.token, { userId: res.userId, email: res.email });
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  register(credentials: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiBaseUrl}/api/auth/register`, credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.userId) {
          this.setSession(res.token, { userId: res.userId, email: res.email || credentials.email });
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  private setSession(token: string, user: UserState): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.authStatusSubject.next(true);
    this.userSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authStatusSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getUsername(): string {
    return this.userSubject.value?.email.split('@')[0] || 'GUEST';
  }

  getEmail(): string {
    return this.userSubject.value?.email || '';
  }

  getUserId(): number | null {
    return this.userSubject.value?.userId || null;
  }
}
