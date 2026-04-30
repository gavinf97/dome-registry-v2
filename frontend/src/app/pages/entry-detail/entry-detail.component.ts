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

      <!-- AI banner -->
      <div *ngIf="entry.isAiGenerated" class="ai-banner mb-3">
        <i class="bi bi-robot me-2"></i>
        This entry was generated or substantially assisted by the DOME Copilot AI. All values require human verification.
      </div>

      <!-- Publication header -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h2 class="mb-1">{{ entry.publication?.['title'] || '(Untitled)' }}</h2>
              <p class="text-muted mb-1">
                {{ entry.publication?.['authors'] }}
              </p>
              <p class="text-muted mb-2">
                <strong>{{ entry.publication?.['journal'] }}</strong>
                <span *ngIf="entry.publication?.['year']"> · {{ entry.publication?.['year'] }}</span>
              </p>
              <div class="d-flex gap-2 flex-wrap mt-2">
                <a *ngIf="entry.publication?.['doi']"
                  href="https://doi.org/{{ entry.publication?.['doi'] }}" target="_blank" rel="noopener"
                  class="badge bg-light text-dark border text-decoration-none">
                  DOI: {{ entry.publication?.['doi'] }}
                </a>
                <a *ngIf="entry.publication?.['pmid']"
                  href="https://pubmed.ncbi.nlm.nih.gov/{{ entry.publication?.['pmid'] }}" target="_blank" rel="noopener"
                  class="badge bg-light text-dark border text-decoration-none">
                  PMID: {{ entry.publication?.['pmid'] }}
                </a>
                <span *ngFor="let tag of entry.tags" class="badge bg-secondary">{{ tag }}</span>
              </div>
            </div>
            <div class="text-center ms-4 flex-shrink-0">
              <div class="display-5 fw-bold"
                [class.text-success]="entry.score >= 75"
                [class.text-warning]="entry.score >= 40 && entry.score < 75"
                [class.text-danger]="entry.score < 40">
                {{ entry.score | number:'1.0-1' }}
              </div>
              <div class="small text-muted">DOME Score</div>
              <div class="progress mt-1" style="width:80px; height:6px">
                <div class="progress-bar"
                  [class.bg-success]="entry.score >= 75"
                  [class.bg-warning]="entry.score >= 40 && entry.score < 75"
                  [class.bg-danger]="entry.score < 40"
                  [style.width.%]="entry.score">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex gap-3 align-items-center small text-muted">
          <span><i class="bi bi-person me-1"></i>{{ entry.user }}</span>
          <span><i class="bi bi-calendar me-1"></i>{{ entry.created | date:'mediumDate' }}</span>
          <span><i class="bi bi-arrow-repeat me-1"></i>Updated {{ entry.updated | date:'mediumDate' }}</span>
          <div class="ms-auto d-flex gap-2">
            <a *ngIf="canEdit" [routerLink]="['/registry', entry.uuid]" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-pencil me-1"></i>Edit
            </a>
            <a [routerLink]="['/registry', entry.uuid, 'history']" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-clock-history me-1"></i>History
            </a>
          </div>
        </div>
      </div>

      <!-- DOME sections -->
      <div *ngFor="let section of sections" class="card dome-section-card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="mb-0 me-auto text-capitalize">{{ section.label }}</h5>
        </div>
        <div class="card-body">
          <ng-container *ngFor="let sub of section.subsections">
            <h6 class="text-uppercase text-muted small fw-bold border-bottom pb-2 mt-3">{{ sub.label }}</h6>
            <dl class="row mb-0">
              <ng-container *ngFor="let field of sub.fields">
                <ng-container *ngIf="getFieldValue(entry, field) as val">
                  <dt class="col-sm-4 col-lg-3 text-muted small fw-normal">
                    {{ field.label }}
                    <span *ngIf="field.complianceLevel === 'REQUIREMENT'"
                      class="badge badge-requirement ms-1" style="font-size:0.6rem">R</span>
                    <span *ngIf="field.complianceLevel === 'RECOMMENDATION'"
                      class="badge badge-recommendation ms-1" style="font-size:0.6rem">REC</span>
                  </dt>
                  <dd class="col-sm-8 col-lg-9">
                    <span *ngIf="isArray(val)">
                      <span *ngFor="let v of asArray(val)" class="badge bg-light text-dark border me-1">{{ v }}</span>
                    </span>
                    <span *ngIf="!isArray(val) && val !== null && val !== undefined">{{ val }}</span>
                  </dd>
                </ng-container>
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
    const uuid = this.route.snapshot.paramMap.get('uuid')!;
    combineLatest([
      this.registryService.get(uuid),
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
}
