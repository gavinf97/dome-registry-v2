import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { SchemaService, SectionDef, FieldDef } from '../../services/schema.service';
import { ScoringService } from '../../services/scoring.service';
import { RegistryService } from '../../services/registry.service';
import { RegistryEntry } from '../../models/registry.models';
import { AuthService } from '../../auth/auth.service';
import { CopilotStateService } from '../../services/copilot-state.service';

function buildFormGroupFromSchema(sections: SectionDef[], fb: FormBuilder): FormGroup {
  const top: Record<string, any> = {};

  for (const section of sections) {
    if (section.key === 'publication') {
      const pubFields: Record<string, any> = {};
      for (const sub of section.subsections) {
        for (const f of sub.fields) {
          pubFields[f.key] = fb.control(f.widget === 'boolean' ? false : f.widget.includes('list') || f.widget === 'enum-multi' ? [] : '');
        }
      }
      top['publication'] = fb.group(pubFields);
    } else {
      const subGroups: Record<string, any> = {};
      for (const sub of section.subsections) {
        const subFields: Record<string, any> = {};
        for (const f of sub.fields) {
          subFields[f.key] = fb.control(f.widget === 'boolean' ? false : f.widget.includes('list') || f.widget === 'enum-multi' ? [] : '');
        }
        subGroups[sub.key] = fb.group(subFields);
      }
      top[section.key] = fb.group(subGroups);
    }
  }

  return fb.group(top);
}

@Component({
  selector: 'app-registry-editor',
  template: `
    <!-- Login wall -->
    <div *ngIf="!auth.isLoggedIn()" class="container py-5" style="max-width:600px">
      <div class="card border-0 shadow-sm text-center p-5">
        <i class="bi bi-pencil-square fs-1 mb-3 text-primary"></i>
        <h3 class="fw-bold mb-2">Submit a Paper</h3>
        <p class="text-muted mb-4">
          Fill in the DOME annotation form to add your published machine learning paper
          to the registry. Each field is guided by the DOME checklist.
        </p>
        <button class="btn btn-orcid d-inline-flex align-items-center gap-2 mx-auto" (click)="auth.login()">
          <img src="assets/orcid.svg" alt="ORCID" style="height:1.2rem;width:1.2rem">
          Sign in with ORCID to continue
        </button>
        <div class="mt-4 pt-3 border-top">
          <a routerLink="/search" class="btn btn-outline-secondary btn-sm me-2">
            <i class="bi bi-grid me-1"></i>Browse Entries
          </a>
          <a routerLink="/about" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-question-circle me-1"></i>How it works
          </a>
        </div>
      </div>
    </div>

    <div *ngIf="auth.isLoggedIn()" class="container-fluid py-4">
      <div class="row">

        <!-- Main form column -->
        <div class="col-lg-8">
          <div class="d-flex align-items-center mb-4 gap-3">
            <h2 class="mb-0">{{ uuid ? 'Edit Entry' : 'New Registry Entry' }}</h2>
            <span *ngIf="entry?.isAiGenerated" class="ai-banner">
              <i class="bi bi-robot me-1"></i>AI-assisted entry
            </span>
          </div>

          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
          </div>

          <form *ngIf="!loading && form" [formGroup]="form" (ngSubmit)="save()">
            <app-dome-section
              *ngFor="let section of sections"
              [section]="section"
              [parentForm]="form"
              [aiSuggestedPaths]="aiSuggestedPaths">
            </app-dome-section>

            <div class="d-flex gap-2 mt-4 mb-5">
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ uuid ? 'Save Changes' : 'Create Entry' }}
              </button>
              <button *ngIf="uuid && entry?.moderationStatus === 'draft'" type="button"
                class="btn btn-success" (click)="submit()">
                <i class="bi bi-send me-1"></i>Submit for Review
              </button>
              <a routerLink="/search" class="btn btn-outline-secondary">Cancel</a>
              <button *ngIf="uuid" type="button" class="btn btn-outline-danger ms-auto"
                (click)="confirmDelete()">
                <i class="bi bi-trash me-1"></i>Delete
              </button>
            </div>
          </form>
        </div>

        <!-- Score sidebar -->
        <div class="col-lg-4">
          <div class="score-sidebar">
            <div class="card mb-3">
              <div class="card-body text-center">
                <div class="text-muted small mb-1">DOME Score</div>
                <div class="display-4 fw-bold"
                  [class.text-success]="liveScore >= 75"
                  [class.text-warning]="liveScore >= 40 && liveScore < 75"
                  [class.text-danger]="liveScore < 40">
                  {{ liveScore | number:'1.0-1' }}
                </div>
                <div class="progress mt-2" style="height:8px">
                  <div class="progress-bar"
                    [class.bg-success]="liveScore >= 75"
                    [class.bg-warning]="liveScore >= 40 && liveScore < 75"
                    [class.bg-danger]="liveScore < 40"
                    [style.width.%]="liveScore">
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-3" *ngIf="uuid">
              <div class="card-body">
                <h6 class="card-title">Status</h6>
                <span class="badge"
                  [class.bg-secondary]="entry?.moderationStatus === 'draft'"
                  [class.bg-warning]="entry?.moderationStatus === 'pending'"
                  [class.bg-success]="entry?.moderationStatus === 'public'"
                  [class.bg-danger]="entry?.moderationStatus === 'rejected'"
                  [class.bg-info]="entry?.moderationStatus === 'held'">
                  {{ entry?.moderationStatus }}
                </span>
              </div>
            </div>

            <div class="card" *ngIf="uuid">
              <div class="card-body">
                <h6 class="card-title">Version History</h6>
                <a [routerLink]="['/registry', uuid, 'history']" class="btn btn-sm btn-outline-secondary w-100">
                  <i class="bi bi-clock-history me-1"></i>View History
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegistryEditorComponent implements OnInit, OnDestroy {
  uuid: string | null = null;
  entry: RegistryEntry | null = null;
  form!: FormGroup;
  sections: SectionDef[] = [];
  liveScore = 0;
  loading = true;
  saving = false;
  aiSuggestedPaths = new Set<string>();
  private scoreWeights: Record<string, any> = {};
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private schemaService: SchemaService,
    private scoringService: ScoringService,
    private registryService: RegistryService,
    public auth: AuthService,
    private copilotStateService: CopilotStateService,
  ) {}

  ngOnInit(): void {
    this.uuid = this.route.snapshot.paramMap.get('uuid');
    if (this.uuid === 'new') this.uuid = null;

    // Check for copilot annotations — first from navigation state, then from session storage
    const navState = this.router.getCurrentNavigation()?.extras?.state
      ?? (window.history.state as any);
    const pendingAnnotations: Record<string, unknown> | null =
      navState?.copilotAnnotations ?? this.copilotStateService.load()?.annotations ?? null;

    combineLatest([
      this.schemaService.loadSchema(),
      this.scoringService.getWeights(),
    ]).pipe(takeUntil(this.destroy$)).subscribe(([schema, weights]) => {
      this.sections = this.schemaService.parseSchema(schema);
      this.scoreWeights = weights;
      this.form = buildFormGroupFromSchema(this.sections, this.fb);

      if (this.uuid) {
        this.registryService.get(this.uuid).subscribe({
          next: entry => {
            this.entry = entry;
            this.patchForm(entry);
            // Apply copilot annotations on top of the loaded entry
            if (pendingAnnotations) {
              this.applyCopilotAnnotations(pendingAnnotations);
              this.copilotStateService.clear();
            }
            this.loading = false;
          },
          error: () => {
            // Entry unreachable (deleted or permission issue) — still show blank form
            // with any pending copilot annotations so the user isn't stranded.
            if (pendingAnnotations) {
              this.applyCopilotAnnotations(pendingAnnotations);
              this.copilotStateService.clear();
            }
            this.loading = false;
          },
        });
      } else {
        if (pendingAnnotations) {
          this.applyCopilotAnnotations(pendingAnnotations);
          this.copilotStateService.clear();
        }
        this.loading = false;
      }

      this.form.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      ).subscribe(val => {
        this.liveScore = this.scoringService.computeScore(val, this.scoreWeights);
      });
    });
  }

  patchForm(entry: RegistryEntry): void {
    const sections = ['publication', 'data', 'optimization', 'model', 'evaluation'];
    for (const s of sections) {
      const group = this.form.get(s);
      if (group && (entry as any)[s]) {
        group.patchValue((entry as any)[s], { emitEvent: false });
      }
    }
  }

  /** Merges copilot annotations into the form.
   *  Accepts both flat path keys ("data/provenance/datasetSource" or "data.provenance.datasetSource")
   *  and nested objects ({ data: { provenance: { datasetSource: "..." } } }).
   */
  applyCopilotAnnotations(annotations: Record<string, unknown>): void {
    const flatPairs = this.flattenAnnotations(annotations);
    for (const [dotPath, value] of flatPairs) {
      const parts = dotPath.split('.');
      const ctrl = this.form.get(parts);
      if (ctrl) {
        ctrl.patchValue(value, { emitEvent: true });
        this.aiSuggestedPaths.add(dotPath);
      }
    }
  }

  private flattenAnnotations(
    obj: Record<string, unknown>,
    prefix = '',
  ): Array<[string, unknown]> {
    const result: Array<[string, unknown]> = [];
    for (const [rawKey, value] of Object.entries(obj)) {
      // Normalise separators (/ or .)
      const key = rawKey.replace(/\//g, '.');
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result.push(...this.flattenAnnotations(value as Record<string, unknown>, fullKey));
      } else {
        result.push([fullKey, value]);
      }
    }
    return result;
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const payload = this.form.getRawValue();

    const req = this.uuid
      ? this.registryService.update(this.uuid, payload)
      : this.registryService.create(payload);

    req.subscribe({
      next: saved => {
        this.entry = saved;
        this.uuid = saved.uuid;
        this.saving = false;
        this.router.navigate(['/registry', saved.uuid]);
      },
      error: () => { this.saving = false; },
    });
  }

  submit(): void {
    if (!this.uuid) return;
    this.registryService.submit(this.uuid).subscribe(saved => {
      this.entry = saved;
    });
  }

  confirmDelete(): void {
    if (!this.uuid || !confirm('Permanently delete this entry?')) return;
    this.registryService.delete(this.uuid).subscribe(() => {
      this.router.navigateByUrl('/search');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
