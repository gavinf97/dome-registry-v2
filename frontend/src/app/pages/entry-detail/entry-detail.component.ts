import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistryService } from '../../services/registry.service';
import { SchemaService, SectionDef, FieldDef } from '../../services/schema.service';
import { RegistryEntry } from '../../models/registry.models';
import { AuthService } from '../../auth/auth.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-entry-detail',
  template: `
    <div class="container py-4" *ngIf="entry; else loading">

      <!-- ─── AI-generated banner ─── -->
      <div *ngIf="entry.isAiGenerated"
        class="rounded-3 d-flex align-items-start gap-3 p-3 mb-4 text-white"
        style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);">
        <i class="bi bi-robot fs-3 flex-shrink-0 mt-1"></i>
        <div>
          <strong class="fs-6 d-block mb-1">AI-Assisted Entry</strong>
          <span class="small opacity-90">
            This entry was generated or substantially assisted by the DOME Copilot AI.
            All annotation values require independent human verification before being treated as ground truth.
          </span>
        </div>
      </div>

      <!-- ─── Publication header card ─── -->
      <div class="card mb-4 shadow-sm">
        <div class="card-body pb-2">
          <div class="d-flex justify-content-between align-items-start gap-4">
            <div class="flex-grow-1 min-w-0">

              <!-- Title -->
              <h2 class="mb-2 lh-base">{{ entry.publication?.['title'] || '(Untitled)' }}</h2>

              <!-- Authors -->
              <p class="text-muted mb-1" *ngIf="entry.publication?.['authors']">
                {{ entry.publication?.['authors'] }}
              </p>

              <!-- Journal / Year -->
              <p class="text-muted mb-3">
                <em *ngIf="entry.publication?.['journal']">{{ entry.publication?.['journal'] }}</em>
                <span *ngIf="entry.publication?.['year']"> · {{ entry.publication?.['year'] }}</span>
              </p>

              <!-- DOI / PMID / PMCID as prominent cross-link buttons -->
              <div class="d-flex flex-wrap gap-2 mb-3">
                <a *ngIf="entry.publication?.['doi']"
                  [href]="'https://doi.org/' + entry.publication?.['doi']"
                  target="_blank" rel="noopener"
                  class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-box-arrow-up-right me-1"></i>
                  DOI: {{ entry.publication?.['doi'] }}
                </a>
                <a *ngIf="entry.publication?.['pmid']"
                  [href]="'https://pubmed.ncbi.nlm.nih.gov/' + entry.publication?.['pmid']"
                  target="_blank" rel="noopener"
                  class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-journal-medical me-1"></i>
                  PubMed: {{ entry.publication?.['pmid'] }}
                </a>
                <a *ngIf="entry.publication?.['pmcid']"
                  [href]="'https://www.ncbi.nlm.nih.gov/pmc/articles/' + entry.publication?.['pmcid']"
                  target="_blank" rel="noopener"
                  class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-journal-medical me-1"></i>
                  PMC: {{ entry.publication?.['pmcid'] }}
                </a>
              </div>

              <!-- Tags -->
              <div *ngIf="entry.tags?.length" class="mb-2">
                <span *ngFor="let tag of entry.tags" class="badge bg-secondary me-1">{{ tag }}</span>
              </div>

            </div>

            <!-- Score circle -->
            <div class="text-center flex-shrink-0">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mb-1"
                [style.background]="scoreColor(entry.score)"
                style="width:72px;height:72px;font-size:1.3rem;">
                {{ entry.score | number:'1.0-0' }}
              </div>
              <div class="small text-muted">DOME Score</div>
            </div>
          </div>
        </div>

        <!-- Card footer: metadata + action buttons -->
        <div class="card-footer d-flex flex-wrap gap-3 align-items-center small text-muted py-2">
          <span><i class="bi bi-person me-1"></i>{{ entry.user }}</span>
          <span><i class="bi bi-calendar me-1"></i>{{ entry.created | date:'mediumDate' }}</span>
          <span><i class="bi bi-arrow-repeat me-1"></i>Updated {{ entry.updated | date:'mediumDate' }}</span>
          <code class="ms-1 text-muted" style="font-size:0.75rem">#{{ entry.shortid }}</code>
          <span *ngIf="entry.schemaVersion" class="badge bg-light text-dark border">
            schema {{ entry.schemaVersion }}
          </span>
          <div class="ms-auto d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" (click)="downloadJson()" title="Download full schema JSON">
              <i class="bi bi-download me-1"></i>JSON
            </button>
            <a *ngIf="canEdit" [routerLink]="['/registry', entry.uuid, 'edit']"
              class="btn btn-sm btn-outline-primary">
              <i class="bi bi-pencil me-1"></i>Edit
            </a>
            <a [routerLink]="['/registry', entry.uuid, 'history']"
              class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-clock-history me-1"></i>History
            </a>
          </div>
        </div>
      </div>

      <!-- ─── DOME sections ─── -->
      <div *ngFor="let section of sections" class="card dome-section-card mb-3">
        <div class="card-header d-flex align-items-center py-2">
          <h5 class="mb-0 me-auto text-capitalize">{{ section.label }}</h5>
        </div>
        <div class="card-body pt-2">
          <ng-container *ngFor="let sub of section.subsections">
            <h6 class="text-uppercase text-muted small fw-bold border-bottom pb-2 mt-3">{{ sub.label }}</h6>
            <dl class="row mb-0">
              <ng-container *ngFor="let field of sub.fields">
                <dt class="col-sm-4 col-lg-3 text-muted small fw-normal">
                  {{ field.label }}
                  <span *ngIf="field.complianceLevel === 'REQUIREMENT'"
                    class="badge badge-requirement ms-1" style="font-size:0.6rem">R</span>
                  <span *ngIf="field.complianceLevel === 'RECOMMENDATION'"
                    class="badge badge-recommendation ms-1" style="font-size:0.6rem">REC</span>
                </dt>
                <dd class="col-sm-8 col-lg-9">
                  <ng-container *ngIf="getFieldValue(entry, field) as val; else notReported">

                    <!-- Array values as chips -->
                    <span *ngIf="isArray(val)">
                      <span *ngFor="let v of asArray(val)" class="badge bg-light text-dark border me-1">{{ v }}</span>
                    </span>

                    <!-- Boolean -->
                    <span *ngIf="!isArray(val) && val === true" class="text-success fw-semibold">
                      <i class="bi bi-check-circle-fill me-1"></i>Yes
                    </span>
                    <span *ngIf="!isArray(val) && val === false" class="text-muted">
                      <i class="bi bi-x-circle me-1"></i>No
                    </span>

                    <!-- URL — clickable link -->
                    <a *ngIf="!isArray(val) && val !== true && val !== false && isUrl(val)"
                      [href]="val" target="_blank" rel="noopener"
                      class="text-break text-decoration-none">
                      <i class="bi bi-box-arrow-up-right me-1"></i>{{ val }}
                    </a>

                    <!-- Plain text -->
                    <span *ngIf="!isArray(val) && val !== true && val !== false && !isUrl(val)">{{ val }}</span>

                  </ng-container>
                  <ng-template #notReported>
                    <span class="text-muted fst-italic" style="font-size:.85rem">Not reported</span>
                  </ng-template>
                </dd>
              </ng-container>
            </dl>
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="d-flex justify-content-center align-items-center" style="height:60vh">
        <div class="spinner-border text-primary"></div>
      </div>
    </ng-template>
  `,
})
export class EntryDetailComponent implements OnInit {
  entry: RegistryEntry | null = null;
  sections: SectionDef[] = [];
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private registryService: RegistryService,
    private schemaService: SchemaService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    // Param is named `:uuid` in routing but the backend accepts both UUID and shortid
    const id = this.route.snapshot.paramMap.get('uuid')!;
    combineLatest([
      this.registryService.get(id),
      this.schemaService.loadSchema(),
    ]).subscribe({
      next: ([entry, schema]) => {
        this.entry = entry;
        this.sections = this.schemaService.parseSchema(schema);
        const user = this.auth.currentUser;
        this.canEdit = !!user && (user.orcid === entry.user || user.roles.includes('admin'));
      },
      error: () => this.router.navigateByUrl('/search'),
    });
  }

  getFieldValue(entry: RegistryEntry, field: FieldDef): unknown {
    const parts = field.path.split('.');
    let val: any = entry;
    for (const p of parts) val = val?.[p];
    return val !== undefined && val !== null && val !== '' ? val : null;
  }

  isArray(val: unknown): boolean { return Array.isArray(val); }
  asArray(val: unknown): unknown[] { return val as unknown[]; }

  downloadJson(): void {
    if (!this.entry) return;

    // Build provenance block
    const doc: Record<string, unknown> = {
      uuid: this.entry.uuid,
      shortid: this.entry.shortid,
      schemaVersion: this.entry.schemaVersion,
      isAiGenerated: this.entry.isAiGenerated,
      score: this.entry.score,
      user: this.entry.user,
      created: this.entry.created,
      updated: this.entry.updated,
      data: {},
    };

    // Deep-merge all schema fields (null for missing)
    for (const section of this.sections) {
      for (const sub of section.subsections) {
        for (const field of sub.fields) {
          const val = this.getFieldValue(this.entry, field);
          // Build nested path into doc.data
          const parts = field.path.split('.');
          let cursor: any = doc['data'];
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cursor[parts[i]]) cursor[parts[i]] = {};
            cursor = cursor[parts[i]];
          }
          cursor[parts[parts.length - 1]] = val ?? null;
        }
      }
    }

    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dome-' + (this.entry.shortid ?? this.entry.uuid) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  isUrl(val: unknown): boolean {
    if (typeof val !== 'string') return false;
    return val.startsWith('http://') || val.startsWith('https://');
  }

  /** Interpolate score colour red → orange → teal */
  scoreColor(score: number): string {
    const s = Math.max(0, Math.min(100, score ?? 0));
    if (s < 50) {
      return `rgb(220,${Math.round((s / 50) * 120)},53)`;
    }
    const g = 120 + Math.round(((s - 50) / 50) * 86);
    const b = Math.round(((s - 50) / 50) * 150);
    return `rgb(0,${g},${b})`;
  }
}
