import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistryEntry, SearchResult, VersionSnapshot } from '../models/registry.models';

const API = '/api';

export interface SearchParams {
  text?: string;
  tags?: string;
  status?: string;
  sortBy?: string;         // 'created' | 'oldest' | 'score'
  isAiGenerated?: boolean; // true = AI only, false = human only
  minScore?: number;
  year?: string;
  journal?: string;
  skip?: number;
  limit?: number;
}

export interface AdminQueueFilters {
  text?: string;
  status?: string;
  journal?: string;
  isAiGenerated?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegistryService {
  constructor(private http: HttpClient) {}

  search(params: SearchParams = {}): Observable<SearchResult> {
    let p = new HttpParams();
    if (params.text) p = p.set('text', params.text);
    if (params.tags) p = p.set('tags', params.tags);
    if (params.status) p = p.set('status', params.status);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.isAiGenerated !== undefined) p = p.set('isAiGenerated', String(params.isAiGenerated));
    if (params.minScore !== undefined) p = p.set('minScore', String(params.minScore));
    if (params.year) p = p.set('year', params.year);
    if (params.journal) p = p.set('journal', params.journal);
    if (params.skip !== undefined) p = p.set('skip', String(params.skip));
    if (params.limit !== undefined) p = p.set('limit', String(params.limit));
    return this.http.get<SearchResult>(`${API}/registry`, { params: p });
  }

  get(uuid: string): Observable<RegistryEntry> {
    return this.http.get<RegistryEntry>(`${API}/registry/${uuid}`);
  }

  create(entry: Partial<RegistryEntry>): Observable<RegistryEntry> {
    return this.http.post<RegistryEntry>(`${API}/registry`, entry);
  }

  update(uuid: string, patch: Partial<RegistryEntry>, changeNote?: string): Observable<RegistryEntry> {
    return this.http.patch<RegistryEntry>(`${API}/registry/${uuid}`, { data: patch, changeNote });
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${API}/registry/${uuid}`);
  }

  getHistory(uuid: string): Observable<VersionSnapshot[]> {
    return this.http.get<VersionSnapshot[]>(`${API}/registry/${uuid}/history`);
  }

  submit(uuid: string, journalId?: string): Observable<RegistryEntry> {
    return this.http.post<RegistryEntry>(`${API}/registry/${uuid}/submit`, { journalId });
  }

  getMyEntries(): Observable<RegistryEntry[]> {
    return this.http.get<RegistryEntry[]>(`${API}/registry/mine`);
  }

  getPendingQueue(): Observable<RegistryEntry[]> {
    return this.http.get<RegistryEntry[]>(`${API}/registry/admin/pending`);
  }

  moderate(uuid: string, status: string, journalId?: string): Observable<RegistryEntry> {
    return this.http.patch<RegistryEntry>(`${API}/registry/admin/${uuid}/moderate`, { status, journalId });
  }

  getJournalQueue(journalId: string): Observable<RegistryEntry[]> {
    return this.http.get<RegistryEntry[]>(`${API}/registry/journals/${journalId}/queue`);
  }

  getAdminQueue(filters: AdminQueueFilters = {}): Observable<RegistryEntry[]> {
    let p = new HttpParams();
    if (filters.text) p = p.set('text', filters.text);
    if (filters.status) p = p.set('status', filters.status);
    if (filters.journal) p = p.set('journal', filters.journal);
    if (filters.isAiGenerated !== undefined) p = p.set('isAiGenerated', String(filters.isAiGenerated));
    return this.http.get<RegistryEntry[]>(`${API}/registry/admin/queue`, { params: p });
  }

  sendModerationNotification(uuid: string, message: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${API}/registry/admin/${uuid}/notify`, { message });
  }
}
