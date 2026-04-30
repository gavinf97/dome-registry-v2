import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/registry.models';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class CopilotService {
  constructor(private http: HttpClient) {}

  process(pdfFile: File, doi?: string, sections?: string[]): Observable<{ annotations: Record<string, unknown> }> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    if (doi) formData.append('doi', doi);
    if (sections?.length) formData.append('sections', sections.join(','));
    return this.http.post<{ annotations: Record<string, unknown> }>(`${API}/copilot/process`, formData);
  }
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API}/users/me`);
  }

  updateMe(patch: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${API}/users/me`, patch);
  }

  adminListUsers(page = 1): Observable<{ total: number; users: UserProfile[] }> {
    return this.http.get<{ total: number; users: UserProfile[] }>(`${API}/admin/users?page=${page}`);
  }

  adminSetRoles(orcid: string, roles: string[], journalAssignments?: any[]): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${API}/admin/users/${encodeURIComponent(orcid)}/roles`, {
      roles,
      journalAssignments,
    });
  }
}
