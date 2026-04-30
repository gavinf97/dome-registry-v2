import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtPayload, UserProfile } from '../models/registry.models';

const TOKEN_KEY = 'dome_jwt';
const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<UserProfile | null>(null);
  readonly user$ = this._user$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token && !this.isExpired(token)) {
      this.fetchProfile().subscribe();
    }
  }

  // ---- Token storage ----
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
      return payload.exp ? Date.now() / 1000 > payload.exp : false;
    } catch {
      return true;
    }
  }

  get currentUser(): UserProfile | null {
    return this._user$.value;
  }

  isLoggedIn(): boolean {
    const t = this.getToken();
    return !!t && !this.isExpired(t);
  }

  hasRole(role: string): boolean {
    return this._user$.value?.roles?.includes(role) ?? false;
  }

  // ---- ORCID OAuth ----
  login(): void {
    window.location.href = `${API}/auth/orcid`;
  }

  /** Called from AuthCallbackComponent after receiving token in URL param */
  handleCallback(token: string): void {
    this.setToken(token);
    this.fetchProfile().subscribe(() => this.router.navigateByUrl('/'));
  }

  /** Called from AuthCallbackComponent after receiving ORCID ?code= directly */
  exchangeCode(code: string): Observable<void> {
    return this.http.post<{ token: string }>(`${API}/auth/orcid/exchange`, { code }).pipe(
      tap(res => {
        this.setToken(res.token);
      }),
      map(() => undefined),
      tap(() => this.fetchProfile().subscribe()),
    );
  }

  fetchProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API}/users/me`).pipe(
      tap(user => this._user$.next(user)),
      catchError(() => {
        this.clearToken();
        return of(null as any);
      }),
    );
  }

  logout(): void {
    this.clearToken();
    this._user$.next(null);
    this.router.navigateByUrl('/');
  }
}
