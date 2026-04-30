import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

export type ComplianceLevel = 'REQUIREMENT' | 'RECOMMENDATION';
export type WidgetType = 'text' | 'textarea' | 'boolean' | 'integer' | 'enum' | 'enum-multi' | 'url-list' | 'tag-list' | 'url';

export interface FieldDef {
  key: string;
  path: string;           // e.g. 'data.provenance.datasetSource'
  section: string;        // e.g. 'data'
  subsection: string;     // e.g. 'provenance'
  label: string;
  description?: string;
  widget: WidgetType;
  required: boolean;
  complianceLevel?: ComplianceLevel;
  enum?: string[];
  optionsApi?: string;    // URL to fetch dynamic enum options
  format?: string;
}

export interface SubsectionDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

export interface SectionDef {
  key: string;
  label: string;
  subsections: SubsectionDef[];
}

const DOME_SECTIONS = ['publication', 'data', 'optimization', 'model', 'evaluation'];

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

function resolveWidget(propDef: any): WidgetType {
  if (propDef.type === 'boolean') return 'boolean';
  if (propDef.type === 'integer') return 'integer';
  if (propDef.enum) return 'enum';
  if (propDef.type === 'array') {
    if (propDef.items?.enum) return 'enum-multi';
    if (propDef.items?.format === 'uri') return 'url-list';
    return 'tag-list';
  }
  if (propDef.format === 'uri') return 'url';
  if (propDef['x-textarea']) return 'textarea';
  return 'text';
}

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private schema$: Observable<any> | null = null;

  constructor(private http: HttpClient) {}

  loadSchema(): Observable<any> {
    if (!this.schema$) {
      this.schema$ = this.http
        .get<any>('/assets/schema/dome-registry-schema.v2.json')
        .pipe(shareReplay(1));
    }
    return this.schema$;
  }

  parseSchema(schema: any): SectionDef[] {
    const sections: SectionDef[] = [];

    for (const sectionKey of DOME_SECTIONS) {
      const sectionSchema = schema.properties?.[sectionKey];
      if (!sectionSchema) continue;

      const sectionDef: SectionDef = {
        key: sectionKey,
        label: toLabel(sectionKey),
        subsections: [],
      };

      if (sectionKey === 'publication') {
        // publication has no subsections — flat fields
        const fields = this.parseFields(sectionSchema, sectionKey, 'publication');
        sectionDef.subsections = [{ key: 'publication', label: 'Publication', fields }];
      } else {
        // nested: sectionKey → subsection → fields
        const subsectionSchemas = sectionSchema.properties ?? {};
        for (const subKey of Object.keys(subsectionSchemas)) {
          const subSchema = subsectionSchemas[subKey];
          const fields = this.parseFields(subSchema, sectionKey, subKey);
          if (fields.length > 0) {
            sectionDef.subsections.push({
              key: subKey,
              label: toLabel(subKey),
              fields,
            });
          }
        }
      }

      if (sectionDef.subsections.length > 0) {
        sections.push(sectionDef);
      }
    }

    return sections;
  }

  private parseFields(subsectionSchema: any, section: string, subsection: string): FieldDef[] {
    const fields: FieldDef[] = [];
    const props = subsectionSchema?.properties ?? {};
    const required: string[] = subsectionSchema?.required ?? [];

    for (const [key, rawDef] of Object.entries<any>(props)) {
      const path = section === 'publication'
        ? `publication.${key}`
        : `${section}.${subsection}.${key}`;

      fields.push({
        key,
        path,
        section,
        subsection,
        label: toLabel(key),
        description: rawDef.description,
        widget: resolveWidget(rawDef),
        required: required.includes(key),
        complianceLevel: rawDef['x-complianceLevel'] as ComplianceLevel | undefined,
        enum: rawDef.enum ?? rawDef.items?.enum,
        optionsApi: rawDef['x-options-api'],
        format: rawDef.format,
      });
    }

    return fields;
  }
}
