import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/registry.models';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class CopilotService {
  constructor(private http: HttpClient) {}

  getQuota(): Observable<{ used: number; max: number; isUnlimited: boolean }> {
    return this.http.get<{ used: number; max: number; isUnlimited: boolean }>(`${API}/copilot/quota`);
  }

  processStream(pdfFile: File, doi?: string, sections?: string[]): Observable<any> {
    return new Observable(observer => {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      if (doi) formData.append('doi', doi);
      if (sections?.length) formData.append('sections', sections.join(','));

      const token = localStorage.getItem('dome_jwt');
      
      fetch(`${API}/copilot/process`, {
        method: 'POST',
        body: formData,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      .then(async response => {
        if (!response.ok) {
           const err = await response.json().catch(() => ({ message: 'HTTP error ' + response.status }));
           observer.error(err);
           return;
        }
        const reader = response.body?.getReader();
        if (!reader) {
            observer.error(new Error('Response body is not readable'));
            return;
        }
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep the last incomplete line
          for (const line of lines) {
            if (line.trim()) {
              try {
                observer.next(JSON.parse(line));
              } catch (e) {
                console.error('JSON parse error on stream:', line);
              }
            }
          }
        }
        // process any remaining buffer
        if (buffer.trim()) {
          try { observer.next(JSON.parse(buffer)); } catch (e) {}
        }
        observer.complete();
      })
      .catch(err => observer.error(err));
    });
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
