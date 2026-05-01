import { Injectable } from '@angular/core';

export interface CopilotResult {
  annotations: Record<string, unknown>;
  filename: string;
  processedAt: number;
  /** UUID of the draft entry auto-created from these annotations, if save succeeded */
  draftUuid?: string;
}

const STORAGE_KEY = 'dome_copilot_result';

@Injectable({ providedIn: 'root' })
export class CopilotStateService {
  save(result: CopilotResult): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }

  load(): CopilotResult | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as CopilotResult; }
    catch { return null; }
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
