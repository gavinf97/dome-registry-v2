import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistryEntry, SearchResult, VersionSnapshot } from '../models/registry.models';

const API = '/api';

export interface SearchParams {
  text?: string;
  tags?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class RegistryService {
  constructor(private http: HttpClient) {}

  search(params: SearchParams = {}): Observable<SearchResult> {
    let p = new HttpParams();
    if (params.text) p = p.set('text', params.text);
    if (params.tags) p = p.set('tags', params.tags);
    if (params.status) p = p.set('status', params.status);
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

  update(uuid: string, patch: Partial<RegistryEntry>): Observable<RegistryEntry> {
    return this.http.patch<RegistryEntry>(`${API}/registry/${uuid}`, patch);
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
}
