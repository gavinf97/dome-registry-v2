import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface WeightEntry {
  weight: number;
  level: 'REQUIREMENT' | 'RECOMMENDATION';
}

type WeightMap = Record<string, Record<string, Record<string, WeightEntry>>>;

const NOT_DEFINED_VALUES: Set<string> = new Set(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'schema', 'notDefinedValues.json'),
      'utf8',
    ),
  ).map((v: string) => v.toLowerCase().trim()),
);

const WEIGHTS: WeightMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'schema', 'scoring-weights.json'),
    'utf8',
  ),
);

@Injectable()
export class ScoringService {
  isFieldValid(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return true;
    if (typeof value === 'number') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') {
      const normalised = value.replace(/\s+/g, ' ').replace(/[/.]/g, '').trim().toLowerCase();
      return !NOT_DEFINED_VALUES.has(normalised);
    }
    return false;
  }

  computeScore(entry: Record<string, unknown>): number {
    let totalWeight = 0;
    let validWeight = 0;

    for (const [section, subsections] of Object.entries(WEIGHTS)) {
      const sectionData = (entry[section] ?? {}) as Record<string, Record<string, unknown>>;

      for (const [subsection, fields] of Object.entries(subsections)) {
        const subsectionData = (sectionData[subsection] ?? {}) as Record<string, unknown>;

        for (const [fieldName, { weight }] of Object.entries(fields)) {
          totalWeight += weight;
          if (this.isFieldValid(subsectionData[fieldName])) {
            validWeight += weight;
          }
        }
      }
    }

    if (totalWeight === 0) return 0;
    return Math.round((validWeight / totalWeight) * 100 * 10) / 10;
  }
}
