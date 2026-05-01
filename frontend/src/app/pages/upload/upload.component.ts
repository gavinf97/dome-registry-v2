import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { CopilotService } from '../../services/api.service';
import { CopilotStateService, CopilotResult } from '../../services/copilot-state.service';
import { RegistryService } from '../../services/registry.service';
import { AuthService } from '../../auth/auth.service';
import { SchemaService, SectionDef } from '../../services/schema.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ProgressLine {
  type: 'info' | 'ok' | 'ai' | 'warn' | 'error';
  text: string;
  ts: Date;
}

interface SelectedFile {
  file: File;
  role: 'main' | 'supplementary';
}

@Component({
  selector: 'app-upload',
  template: `
    <!-- ── Login wall ─────────────────────────────────────────────── -->
    <div *ngIf="!auth.isLoggedIn()" class="container py-5" style="max-width:600px">
      <div class="card border-0 shadow-sm text-center p-5">
        <i class="bi bi-robot fs-1 mb-3" style="color:#7b2ff7"></i>
        <h3 class="fw-bold mb-2">AI Import from PDF</h3>
        <p class="text-muted mb-4">
          Upload your paper PDF and the DOME AI Copilot will extract structured
          annotations automatically. Sign in to continue.
        </p>
        <button class="btn btn-orcid d-inline-flex align-items-center gap-2 mx-auto" (click)="auth.login()">
          <img src="assets/orcid.svg" alt="ORCID" style="height:1.2rem;width:1.2rem">
          Sign in with ORCID to continue
        </button>
        <div class="mt-4 pt-3 border-top">
          <a routerLink="/about" class="small text-decoration-none me-3">
            <i class="bi bi-info-circle me-1"></i>How does AI Import work?
          </a>
          <a routerLink="/help/docs" class="small text-decoration-none">
            <i class="bi bi-code-square me-1"></i>API Documentation
          </a>
        </div>
      </div>
    </div>

    <!-- ── Stage: Upload ──────────────────────────────────────────── -->
    <div *ngIf="auth.isLoggedIn() && stage === 'upload'" class="container py-5" style="max-width:760px">
      <div class="d-flex align-items-start gap-3 mb-1 flex-wrap">
        <h2 class="mb-0">AI Import from PDF</h2>
        <div class="ms-auto d-flex gap-2 flex-shrink-0">
          <a routerLink="/about" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-question-circle me-1"></i>How it works
          </a>
          <a routerLink="/help/docs" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-code-square me-1"></i>API Documentation
          </a>
        </div>
      </div>
      <p class="text-muted mb-4">
        Upload your paper PDF. The AI Copilot reads the text and pre-fills all DOME fields.
        You review and correct everything before submitting.
      </p>

      <!-- Callout note -->
      <div class="alert alert-info d-flex gap-2 py-2 mb-3" style="font-size:.85rem">
        <i class="bi bi-lightbulb-fill flex-shrink-0 mt-1"></i>
        <div>
          <strong>Text-based PDFs only.</strong> Scanned images won't extract well.
          If your Methods section is in a separate supplementary PDF, add it below — the AI will use both.
        </div>
      </div>

      <!-- Selected file chips -->
      <div *ngFor="let sf of selectedFiles; let i = index"
        class="d-flex align-items-center gap-2 mb-2 p-2 border rounded bg-light">
        <i class="bi bi-file-earmark-pdf text-danger fs-5 flex-shrink-0"></i>
        <div class="flex-grow-1 min-w-0">
          <div class="fw-semibold text-truncate" style="font-size:.85rem">{{ sf.file.name }}</div>
          <div class="text-muted" style="font-size:.73rem">{{ formatSize(sf.file.size) }}</div>
        </div>
        <select class="form-select form-select-sm" style="width:auto" [(ngModel)]="sf.role">
          <option value="main">Main paper</option>
          <option value="supplementary">Supplementary / Methods</option>
        </select>
        <button class="btn btn-sm btn-outline-danger px-2" (click)="removeFile(i)">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <!-- Drop zone -->
      <div class="drop-zone mb-3"
        [class.drag-over]="isDragOver"
        (click)="fileInput.click()"
        (dragover)="$event.preventDefault(); isDragOver = true"
        (dragleave)="isDragOver = false"
        (drop)="onDrop($event)">
        <input #fileInput type="file" accept="application/pdf" multiple class="d-none"
          (change)="onFileSelect($event)" />
        <i class="bi bi-file-earmark-pdf fs-2 text-muted d-block mb-1"></i>
        <strong>Drop PDF(s) here or click to browse</strong>
        <div class="text-muted small mt-1">Main paper + supplementary methods (optional) &middot; max 20 MB each</div>
      </div>

      <!-- DOI -->
      <div class="mb-3">
        <label class="form-label small fw-semibold">
          DOI
          <span class="text-muted fw-normal">(optional &mdash; helps pre-fill publication metadata)</span>
        </label>
        <input type="text" class="form-control form-control-sm"
          placeholder="e.g. 10.1038/s41592-021-01205-4" [formControl]="doiCtrl" />
      </div>

      <div *ngIf="errorMsg" class="alert alert-danger d-flex gap-2 py-2">
        <i class="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>{{ errorMsg }}
      </div>

      <!-- Quota badge -->
      <div class="mb-3">
        <span *ngIf="quotaLoading" class="badge bg-secondary py-2 px-3">
          <span class="spinner-border spinner-border-sm me-1"></span>Loading quota&#x2026;
        </span>
        <span *ngIf="!quotaLoading && quota" class="badge py-2 px-3"
          [class.bg-success]="quota.isUnlimited"
          [class.bg-primary]="!quota.isUnlimited && quota.used < quota.max"
          [class.bg-danger]="!quota.isUnlimited && quota.used >= quota.max">
          <i class="bi bi-cpu me-1"></i>
          <ng-container *ngIf="quota.isUnlimited">Unlimited (dev mode)</ng-container>
          <ng-container *ngIf="!quota.isUnlimited">{{ quota.used }} / {{ quota.max }} credits used today</ng-container>
        </span>
      </div>

      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button class="btn btn-primary" [disabled]="selectedFiles.length === 0 || quotaExhausted" (click)="process()">
          <i class="bi bi-robot me-1"></i>
          {{ selectedFiles.length > 1 ? 'Process ' + selectedFiles.length + ' PDFs with Copilot' : 'Process with Copilot' }}
        </button>
        <a routerLink="/registry/new" class="btn btn-outline-secondary">
          <i class="bi bi-pencil me-1"></i>Start manually instead
        </a>
        <span *ngIf="!quotaExhausted" class="text-muted small ms-auto">Uses 1 of your daily Copilot calls</span>
        <span *ngIf="quotaExhausted" class="text-danger small ms-auto"><i class="bi bi-exclamation-triangle me-1"></i>Daily quota reached</span>
      </div>

      <!-- Dev-only: instant dummy entry for debugging without waiting for LLM -->
      <div *ngIf="quota?.isUnlimited" class="mt-3 p-3 border border-warning rounded bg-warning bg-opacity-10">
        <small class="fw-semibold d-block mb-2" style="color:#856404">
          <i class="bi bi-wrench me-1"></i>Dev tools &#x2014; not shown in production
        </small>
        <button class="btn btn-sm btn-warning" [disabled]="devLoading" (click)="useDummyData()">
          <span *ngIf="devLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i *ngIf="!devLoading" class="bi bi-lightning me-1"></i>
          Fill with test data (skip LLM)
        </button>
        <span *ngIf="devCreatedUuid" class="ms-3 small text-success">
          <i class="bi bi-check-circle-fill me-1"></i>
          Draft created &#x2014; <a [routerLink]="['/registry', devCreatedUuid, 'edit']" class="fw-semibold">Open in Editor</a>
        </span>
      </div>
    </div>

    <!-- ── Stage: Processing ──────────────────────────────────────── -->
    <div *ngIf="auth.isLoggedIn() && stage === 'processing'" class="container py-5" style="max-width:760px">
      <h2 class="mb-1">Processing with AI Copilot&hellip;</h2>
      <p class="text-muted mb-4 small">
        The AI is reading your PDF and extracting DOME fields. This can take 3&ndash;5 minutes depending on your hardware.
      </p>

      <!-- Animated progress bar -->
      <div class="progress mb-2" style="height:8px">
        <div class="progress-bar"
          [class.progress-bar-striped]="processing"
          [class.progress-bar-animated]="processing"
          [class.bg-success]="!processing && progressPct === 100"
          [style.width]="progressPct + '%'"
          style="transition: width .5s ease"></div>
      </div>
      <div class="text-muted small mb-3">{{ progressPct }}% &mdash; {{ currentStep }}</div>

      <!-- Terminal log -->
      <div class="log-terminal rounded p-3 mb-3" #logBox>
        <div *ngFor="let line of progressLog" class="log-line d-flex gap-2 align-items-start mb-1">
          <span class="log-ts">{{ line.ts | date:'HH:mm:ss' }}</span>
          <i class="bi flex-shrink-0 mt-1"
            [class.bi-info-circle]="line.type==='info'"
            [class.bi-check-circle-fill]="line.type==='ok'"
            [class.bi-robot]="line.type==='ai'"
            [class.bi-exclamation-triangle-fill]="line.type==='warn'"
            [class.bi-x-circle-fill]="line.type==='error'"
            [class.text-log-muted]="line.type==='info'"
            [class.text-log-green]="line.type==='ok'"
            [class.text-log-purple]="line.type==='ai'"
            [class.text-log-yellow]="line.type==='warn'"
            [class.text-log-red]="line.type==='error'"></i>
          <span class="log-text">{{ line.text }}</span>
        </div>
        <div *ngIf="processing" class="d-flex gap-2 align-items-center mt-2">
          <span class="spinner-border spinner-border-sm" style="color:#4a5568"></span>
          <span class="log-text" style="color:#6e7681">Working&hellip;</span>
        </div>
      </div>

      <div *ngIf="errorMsg" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMsg }}
        <div class="mt-2 d-flex gap-2">
          <button class="btn btn-sm btn-outline-danger" (click)="reset()">Try Again</button>
          <a routerLink="/registry/new" class="btn btn-sm btn-outline-secondary">Fill in manually</a>
        </div>
      </div>
    </div>

    <!-- ── Stage: Review ──────────────────────────────────────────── -->
    <div *ngIf="auth.isLoggedIn() && stage === 'review'" class="container py-4">
      <div class="d-flex align-items-center gap-3 mb-2 flex-wrap">
        <h2 class="mb-0">Review AI Annotations</h2>
        <span class="badge fs-6 px-3 py-2"
          style="background:linear-gradient(135deg,#7b2ff7,#2196f3);color:#fff">
          <i class="bi bi-robot me-1"></i>{{ annotationCount }} fields extracted
        </span>
      </div>

      <div class="alert border-0 d-flex gap-3 align-items-start mb-4"
        style="background:linear-gradient(135deg,rgba(123,47,247,.08),rgba(33,150,243,.08))">
        <i class="bi bi-shield-exclamation fs-4 flex-shrink-0 mt-1" style="color:#7b2ff7"></i>
        <div class="small">
          <strong>Review every field before submitting.</strong>
          AI suggestions can contain errors or hallucinations. Fields marked
          <span class="badge" style="background:rgba(123,47,247,.15);color:#7b2ff7;font-size:.7rem">AI</span>
          were extracted. Correct anything wrong, then click Submit.
        </div>
      </div>

      <div class="row g-4">
        <!-- Section cards -->
        <div class="col-lg-9">
          <div *ngFor="let section of reviewSections" class="card dome-section-card mb-3">
            <div class="card-header d-flex align-items-center py-2">
              <h5 class="mb-0 me-auto text-capitalize">{{ section.label }}</h5>
              <span class="badge bg-secondary small">
                {{ countFilled(section) }} / {{ countTotal(section) }} filled
              </span>
            </div>
            <div class="card-body py-2">
              <ng-container *ngFor="let sub of section.subsections">
                <h6 class="text-uppercase text-muted fw-bold border-bottom pb-1 mt-3 mb-2"
                  style="font-size:.7rem;letter-spacing:.08em">{{ sub.label }}</h6>
                <div *ngFor="let field of sub.fields"
                  class="review-row d-flex align-items-baseline gap-2 py-1 px-2 rounded mb-1"
                  [class.review-ai]="isAiField(field.path)"
                  [class.review-empty]="!getAnnotationValue(field.path)">
                  <div class="review-label text-muted" style="min-width:200px;max-width:200px;font-size:.8rem">
                    {{ field.label }}
                    <span *ngIf="field.complianceLevel==='REQUIREMENT'"
                      class="badge badge-requirement ms-1" style="font-size:.55rem">R</span>
                    <span *ngIf="field.complianceLevel==='RECOMMENDATION'"
                      class="badge badge-recommendation ms-1" style="font-size:.55rem">REC</span>
                  </div>
                  <div class="flex-grow-1" style="font-size:.83rem">
                    <span *ngIf="isAiField(field.path)"
                      class="badge me-1"
                      style="font-size:.6rem;background:rgba(123,47,247,.15);color:#7b2ff7;vertical-align:middle">AI</span>
                    <span *ngIf="getAnnotationValue(field.path)">{{ getAnnotationDisplay(field.path) }}</span>
                    <em *ngIf="!getAnnotationValue(field.path)" class="text-muted">&mdash;</em>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- Sticky sidebar -->
        <div class="col-lg-3">
          <div class="sticky-top" style="top:80px">
            <div class="card border-0 shadow-sm p-3 mb-3">
              <div class="fw-semibold small text-uppercase mb-2" style="letter-spacing:.06em">AI Coverage</div>
              <div class="progress mb-1" style="height:10px">
                <div class="progress-bar" style="background:linear-gradient(90deg,#7b2ff7,#2196f3)"
                  [style.width]="coveragePct + '%'"></div>
              </div>
              <div class="text-muted small mt-1">{{ annotationCount }} fields &middot; {{ coveragePct }}%</div>
            </div>
            <div class="d-grid gap-2">
              <button class="btn btn-success" (click)="saveAndSubmit()" [disabled]="submitting">
                <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!submitting" class="bi bi-send me-1"></i>
                Save &amp; Submit for Review
              </button>
              <button class="btn btn-outline-primary" (click)="saveAndEdit()" [disabled]="submitting">
                <i class="bi bi-pencil-square me-1"></i>Edit in Full Form
              </button>
              <button class="btn btn-outline-secondary btn-sm" (click)="reset()">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Start Over
              </button>
            </div>
            <div class="mt-3 small text-muted">
              <i class="bi bi-info-circle me-1"></i>
              "Submit for Review" sends the entry to the moderation queue. You can still edit it afterwards.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Stage: Done ────────────────────────────────────────────── -->
    <div *ngIf="auth.isLoggedIn() && stage === 'done'"
      class="container py-5 text-center" style="max-width:560px">
      <i class="bi bi-check-circle-fill text-success d-block mb-3" style="font-size:3.5rem"></i>
      <h2 class="fw-bold mb-2">Submitted for Review</h2>
      <p class="text-muted mb-4">
        Your AI-assisted entry has been saved and sent to the moderation queue.
        A moderator will review it before it becomes publicly visible.
      </p>
      <div class="d-flex flex-wrap gap-2 justify-content-center">
        <a *ngIf="createdUuid" [routerLink]="['/registry', createdUuid, 'edit']"
          class="btn btn-outline-primary">
          <i class="bi bi-pencil me-1"></i>Continue Editing
        </a>
        <a *ngIf="createdUuid" [routerLink]="['/registry', createdUuid]"
          class="btn btn-outline-secondary">
          <i class="bi bi-eye me-1"></i>View Entry
        </a>
        <button class="btn btn-primary" (click)="reset()">
          <i class="bi bi-robot me-1"></i>Import Another
        </button>
      </div>
    </div>
  `,
  styles: [`
    .log-terminal {
      background: #0d1117;
      min-height: 140px;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Fira Mono', 'Consolas', monospace;
    }
    .log-line { line-height: 1.4; }
    .log-ts   { color: #6e7681; font-size: .68rem; white-space: nowrap; padding-top: 2px; min-width: 64px; }
    .log-text { color: #e6edf3; font-size: .78rem; }
    .text-log-muted  { color: #8b949e !important; }
    .text-log-green  { color: #3fb950 !important; }
    .text-log-purple { color: #bc8cff !important; }
    .text-log-yellow { color: #e3b341 !important; }
    .text-log-red    { color: #f85149 !important; }
    .review-ai    { background: rgba(123,47,247,.06); border-left: 2px solid rgba(123,47,247,.3); }
    .review-empty { opacity: .55; }
    .review-label { flex-shrink: 0; }
  `],
})
export class UploadComponent implements OnInit, OnDestroy {
  stage: 'upload' | 'processing' | 'review' | 'done' = 'upload';

  // Upload stage
  selectedFiles: SelectedFile[] = [];
  doiCtrl = new FormControl('');
  isDragOver = false;
  errorMsg = '';

  // Processing stage
  processing = false;
  progressLog: ProgressLine[] = [];
  progressPct = 0;
  currentStep = 'Preparing\u2026';
  private progressTimer: any;

  // Review stage
  annotations: Record<string, unknown> = {};
  reviewSections: SectionDef[] = [];

  // Done stage
  createdUuid = '';
  submitting = false;

  // Quota
  quota: { used: number; max: number; isUnlimited: boolean } | null = null;
  quotaLoading = true;

  // Dev dummy
  devLoading = false;
  devCreatedUuid = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('logBox') logBox!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();

  constructor(
    private copilotService: CopilotService,
    private copilotStateService: CopilotStateService,
    private registryService: RegistryService,
    private schemaService: SchemaService,
    private router: Router,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.schemaService.loadSchema().pipe(takeUntil(this.destroy$)).subscribe(schema => {
      this.reviewSections = this.schemaService.parseSchema(schema);
    });
    if (this.auth.isLoggedIn()) {
      this.copilotService.getQuota().subscribe({
        next: q => { this.quota = q; this.quotaLoading = false; },
        error: () => { this.quotaLoading = false; },
      });
    }
  }

  get quotaExhausted(): boolean {
    return !!this.quota && !this.quota.isUnlimited && this.quota.used >= this.quota.max;
  }


  /** Dev-only: create a pre-filled AI draft instantly without running the LLM.
   *  Only available when quota.isUnlimited (dev/local instance). */
  useDummyData(): void {
    this.devLoading = true;
    this.devCreatedUuid = '';
    const dummyAnnotations: Record<string, unknown> = {
      'publication/title': 'Deep Learning for Protein Secondary Structure Prediction',
      'publication/authors': ['Smith J', 'Doe A', 'Chen L'],
      'publication/journal': 'Bioinformatics',
      'publication/year': 2024,
      'publication/doi': '10.1093/bioinformatics/test2024',
      'publication/tags': ['deep learning', 'protein structure', 'CNN'],
      'data/provenance/datasetSource': 'RCSB PDB',
      'data/provenance/pointsPerClass': 8500,
      'data/provenance/previouslyUsed': true,
      'data/dataSplits/trainTestPoints': '80/20 split',
      'data/dataSplits/validationUsed': true,
      'data/redundancy/splitMethod': 'CD-HIT 30% identity cutoff',
      'data/redundancy/setsIndependent': true,
      'data/availability/isDataPublic': true,
      'data/availability/dataUrl': 'https://zenodo.org/record/example',
      'data/availability/dataLicence': 'CC BY 4.0',
      'optimization/algorithm/algorithmClass': 'Deep Learning',
      'optimization/algorithm/isAlgorithmNew': false,
      'optimization/encoding/dataEncodingMethod': 'One-hot encoding',
      'optimization/parameters/numberOfParameters': 2100000,
      'optimization/parameters/parameterSelectionMethod': 'Adam lr=0.0001',
      'optimization/fitting/overfittingPrevention': 'L2 + dropout 0.3',
      'optimization/fitting/underfittingPrevention': 'Early stopping',
      'optimization/regularization/regularizationUsed': true,
      'optimization/configAvailability/configReported': true,
      'optimization/configAvailability/configUrl': 'https://github.com/example/deepss',
      'optimization/configAvailability/configLicence': 'MIT',
      'model/interpretability/interpretabilityType': 'Post-hoc',
      'model/output/outputType': 'Classification',
      'model/output/targetVariable': 'Secondary structure class (helix/sheet/coil)',
      'model/execution/trainingTime': '4 hours on NVIDIA A100',
      'model/execution/inferenceTime': '12 ms per sequence',
      'model/execution/hardwareUsed': 'NVIDIA A100 80 GB',
      'model/softwareAvailability/sourceCodeReleased': true,
      'model/softwareAvailability/softwareUrl': 'https://github.com/example/deepss',
      'model/softwareAvailability/softwareLicence': 'MIT',
      'evaluation/method/evaluationMethod': 'Independent test set',
      'evaluation/performanceMeasures/performanceMetrics': ['AUC-ROC 0.924', 'MCC 0.83', 'F1 0.84'],
      'evaluation/performanceMeasures/metricsRepresentative': true,
      'evaluation/comparison/comparisonPublicMethods': true,
      'evaluation/comparison/comparisonBaselines': true,
      'evaluation/comparison/comparedToolsAndBaselines': ['NetSurf-2', 'PSIPRED'],
      'evaluation/confidence/hasConfidenceIntervals': true,
      'evaluation/confidence/statisticallySignificant': true,
      'evaluation/confidence/confidenceNumericalValues': '95 pct CI bootstrap n=1000 p<0.05',
      'evaluation/evaluationAvailability/rawFilesAvailable': true,
      'evaluation/evaluationAvailability/rawFilesUrl': 'https://zenodo.org/record/99999',
      'evaluation/evaluationAvailability/rawFilesLicence': 'MIT',
    };
    const nested = this.flatToNested(dummyAnnotations);
    this.registryService.create({ isAiGenerated: true, ...nested }).subscribe({
      next: entry => {
        const result: CopilotResult = {
          annotations: dummyAnnotations,
          filename: 'test-paper-dev.pdf',
          processedAt: Date.now(),
          draftUuid: entry.uuid,
        };
        this.copilotStateService.save(result);
        this.devCreatedUuid = entry.uuid;
        this.devLoading = false;
      },
      error: () => { this.devLoading = false; this.errorMsg = 'Failed to create test entry.'; },
    });
  }

  private flatToNested(flat: Record<string, unknown>): Record<string, unknown> {
    const root: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(flat)) {
      const parts = rawKey.replace(/\./g, '/').split('/');
      let node: Record<string, unknown> = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
        node = node[parts[i]] as Record<string, unknown>;
      }
      node[parts[parts.length - 1]] = value;
    }
    return root;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.progressTimer);
  }

  // ── File selection ───────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    files.forEach(f => this.addFile(f));
    (event.target as HTMLInputElement).value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    Array.from(event.dataTransfer?.files ?? []).forEach(f => this.addFile(f));
  }

  private addFile(file: File): void {
    if (file.type !== 'application/pdf') { this.errorMsg = file.name + ': Only PDF files are accepted.'; return; }
    if (file.size > 20 * 1024 * 1024) { this.errorMsg = file.name + ': Exceeds 20 MB limit.'; return; }
    this.errorMsg = '';
    const role: 'main' | 'supplementary' = this.selectedFiles.length === 0 ? 'main' : 'supplementary';
    this.selectedFiles = [...this.selectedFiles, { file, role }];
  }

  removeFile(i: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, idx) => idx !== i);
    if (this.selectedFiles.length > 0 && !this.selectedFiles.find(f => f.role === 'main')) {
      this.selectedFiles[0].role = 'main';
    }
  }

  // ── Processing ───────────────────────────────────────────────────

  process(): void {
    const mainFile = this.selectedFiles.find(f => f.role === 'main')?.file;
    if (!mainFile) { this.errorMsg = 'Please select at least one PDF.'; return; }

    this.stage = 'processing';
    this.processing = true;
    this.errorMsg = '';
    this.progressLog = [];
    this.progressPct = 0;

    const suppCount = this.selectedFiles.filter(f => f.role === 'supplementary').length;
    this.log('info', 'Sending ' + mainFile.name + ' (' + this.formatSize(mainFile.size) + ') for AI extraction\u2026');
    if (suppCount > 0) this.log('info', suppCount + ' supplementary PDF(s) noted for context.');

    this.copilotService.processStream(mainFile, this.doiCtrl.value || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: any) => {
          if (event.type === 'progress') {
             this.progressPct = event.pct;
             this.currentStep = event.msg;
             this.log('ai', event.msg);
          } else if (event.type === 'info') {
             this.log('info', event.msg);
          } else if (event.type === 'done') {
             this.progressPct = 100;
             this.currentStep = 'Complete';
             const count = Object.keys(event.annotations || {}).length;
             this.log('ok', 'Extraction complete \u2014 ' + count + ' field(s) returned.');
             this.annotations = event.annotations || {};
             this.processing = false;
             setTimeout(() => { this.stage = 'review'; }, 500);
          } else if (event.type === 'error') {
             this.log('error', event.msg);
             this.errorMsg = event.msg;
             this.processing = false;
          }
        },
        error: err => {
          this.processing = false;
          const msg = err.status === 429
            ? 'Daily Copilot quota reached. Try again tomorrow.'
            : (err.message ?? 'Copilot processing failed. Please try again or fill in manually.');
          this.log('error', msg);
          this.errorMsg = msg;
        },
      });
  }



  private log(type: ProgressLine['type'], text: string): void {
    this.progressLog = [...this.progressLog, { type, text, ts: new Date() }];
    setTimeout(() => {
      if (this.logBox?.nativeElement) {
        this.logBox.nativeElement.scrollTop = this.logBox.nativeElement.scrollHeight;
      }
    }, 30);
  }

  // ── Review helpers ───────────────────────────────────────────────

  get annotationCount(): number {
    return Object.values(this.annotations)
      .filter(v => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
  }

  get coveragePct(): number {
    const total = this.reviewSections.reduce(
      (s, sec) => s + sec.subsections.reduce((ss, sub) => ss + sub.fields.length, 0), 0);
    return total > 0 ? Math.round((this.annotationCount / total) * 100) : 0;
  }

  isAiField(path: string): boolean {
    return (path.replace(/\./g, '/') in this.annotations) || (path in this.annotations);
  }

  getAnnotationValue(path: string): unknown {
    const val = this.annotations[path.replace(/\./g, '/')] ?? this.annotations[path];
    if (val === null || val === undefined || val === '') return null;
    if (Array.isArray(val) && val.length === 0) return null;
    return val;
  }

  getAnnotationDisplay(path: string): string {
    const val = this.getAnnotationValue(path);
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return (val as unknown[]).map(String).join(', ');
    return String(val);
  }

  countFilled(section: SectionDef): number {
    return section.subsections.reduce(
      (sum, sub) => sum + sub.fields.filter(f => !!this.getAnnotationValue(f.path)).length, 0);
  }

  countTotal(section: SectionDef): number {
    return section.subsections.reduce((sum, sub) => sum + sub.fields.length, 0);
  }

  // ── Submit actions ───────────────────────────────────────────────

  saveAndEdit(): void {
    this.submitting = true;
    this.registryService.create({ isAiGenerated: true }).subscribe({
      next: entry => {
        this.submitting = false;
        this.router.navigate(['/registry', entry.uuid, 'edit'], {
          state: { copilotAnnotations: this.annotations },
        });
      },
      error: () => { this.submitting = false; this.errorMsg = 'Failed to create entry.'; },
    });
  }

  saveAndSubmit(): void {
    this.submitting = true;
    this.registryService.create({ isAiGenerated: true }).subscribe({
      next: entry => {
        this.createdUuid = entry.uuid;
        this.registryService.update(entry.uuid, { data: this.annotations } as any).subscribe({
          next: () => {
            this.registryService.submit(entry.uuid).subscribe({
              next: () => { this.submitting = false; this.stage = 'done'; },
              error: () => { this.submitting = false; this.stage = 'done'; },
            });
          },
          error: () => { this.submitting = false; this.stage = 'done'; },
        });
      },
      error: () => { this.submitting = false; this.errorMsg = 'Failed to create entry. Please try again.'; },
    });
  }

  reset(): void {
    clearInterval(this.progressTimer);
    this.stage = 'upload';
    this.selectedFiles = [];
    this.doiCtrl.reset();
    this.processing = false;
    this.submitting = false;
    this.errorMsg = '';
    this.progressLog = [];
    this.progressPct = 0;
    this.annotations = {};
    this.createdUuid = '';
  }

  formatSize(bytes: number): string {
    return bytes > 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  }
}
