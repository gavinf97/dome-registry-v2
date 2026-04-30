import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface WeightEntry {
  weight: number;
  level: string;
}

const NOT_DEFINED_STRINGS = new Set([
  '', 'n/a', 'na', 'not applicable', 'none', 'null', 'undefined',
  'not available', 'not provided', 'unknown', 'not reported',
  'not defined', 'not specified', 'not stated', 'not described',
  'not given', 'not mentioned', 'not indicated', 'not shown',
]);

function isFieldValid(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') {
    const normalised = value.toLowerCase().replace(/[\s\-_.,;:!?'"]/g, '');
    return normalised.length > 0 && !NOT_DEFINED_STRINGS.has(normalised);
  }
  return false;
}

function getNestedValue(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function flattenWeights(
  obj: Record<string, any>,
  prefix = '',
  result: Record<string, WeightEntry> = {},
): Record<string, WeightEntry> {
  for (const [key, val] of Object.entries(obj)) {
    if (key === '$comment') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && 'weight' in val && 'level' in val) {
      result[path] = val as WeightEntry;
    } else if (val && typeof val === 'object') {
      flattenWeights(val, path, result);
    }
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class ScoringService {
  private weights$: Observable<Record<string, WeightEntry>> | null = null;

  constructor(private http: HttpClient) {}

  private loadWeights(): Observable<Record<string, WeightEntry>> {
    if (!this.weights$) {
      this.weights$ = this.http
        .get<Record<string, any>>('/assets/schema/scoring-weights.json')
        .pipe(
          map(raw => flattenWeights(raw)),
          shareReplay(1),
        );
    }
    return this.weights$;
  }

  computeScore(entry: Record<string, any>, weights: Record<string, WeightEntry>): number {
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const [path, def] of Object.entries(weights)) {
      const value = getNestedValue(entry, path);
      totalWeight += def.weight;
      if (isFieldValid(value)) {
        earnedWeight += def.weight;
      }
    }

    return totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 1000) / 10;
  }

  getWeights(): Observable<Record<string, WeightEntry>> {
    return this.loadWeights();
  }
}
