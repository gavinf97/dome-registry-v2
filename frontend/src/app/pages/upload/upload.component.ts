import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { CopilotService } from '../../services/api.service';
import { RegistryService } from '../../services/registry.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-upload',
  template: `
    <!-- Login wall -->
    <div *ngIf="!auth.isLoggedIn()" class="container py-5" style="max-width:600px">
      <div class="card border-0 shadow-sm text-center p-5">
        <i class="bi bi-robot fs-1 mb-3" style="color:#7b2ff7"></i>
        <h3 class="fw-bold mb-2">AI Import from PDF</h3>
        <p class="text-muted mb-1">
          Upload a paper PDF and the DOME AI Copilot will automatically extract structured
          annotations for all four DOME pillars.
        </p>
        <p class="text-muted mb-4">
          You need to be signed in with your ORCID iD to use this feature. Your ORCID is
          used to attribute the annotation to you.
        </p>
        <button class="btn btn-orcid d-inline-flex align-items-center gap-2 mx-auto" (click)="auth.login()">
          <img src="assets/orcid.svg" alt="ORCID" style="height:1.2rem;width:1.2rem">
          Sign in with ORCID to continue
        </button>
        <div class="mt-4 pt-3 border-top">
          <p class="small text-muted mb-1">
            <i class="bi bi-info-circle me-1"></i>
            AI-generated entries are clearly labelled and require human review before publication.
          </p>
          <a routerLink="/about" class="small text-decoration-none">Learn more about AI Import →</a>
        </div>
      </div>
    </div>

    <div *ngIf="auth.isLoggedIn()" class="container py-5" style="max-width: 700px">
      <h2 class="mb-2">Import Paper with AI Copilot</h2>
      <p class="text-muted mb-4">Upload a PDF and the AI Copilot will extract structured DOME annotations automatically.
        You can review and edit all suggestions before saving.</p>

      <!-- Drop zone -->
      <div class="drop-zone"
        [class.drag-over]="isDragOver"
        (click)="fileInput.click()"
        (dragover)="$event.preventDefault(); isDragOver = true"
        (dragleave)="isDragOver = false"
        (drop)="onDrop($event)">
        <input #fileInput type="file" accept="application/pdf" class="d-none" (change)="onFileSelect($event)" />
        <i class="bi bi-file-earmark-pdf fs-1 text-muted d-block mb-2"></i>
        <ng-container *ngIf="!selectedFile">
          <strong>Drop your PDF here</strong>
          <span class="text-muted d-block">or click to browse (max 20 MB)</span>
        </ng-container>
        <ng-container *ngIf="selectedFile">
          <strong class="text-primary">{{ selectedFile.name }}</strong>
          <span class="text-muted d-block">{{ formatSize(selectedFile.size) }}</span>
        </ng-container>
      </div>

      <!-- DOI hint -->
      <div class="mt-3">
        <label class="form-label small fw-semibold">DOI (optional — helps the AI find metadata)</label>
        <input type="text" class="form-control form-control-sm" placeholder="10.1234/example"
          [formControl]="doiCtrl" />
      </div>

      <!-- Error / progress -->
      <div *ngIf="errorMsg" class="alert alert-danger mt-3">{{ errorMsg }}</div>
      <div *ngIf="processing" class="mt-3">
        <div class="progress" style="height: 8px">
          <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
        </div>
        <small class="text-muted d-block mt-1">Processing PDF — this may take up to 2 minutes…</small>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-2 mt-4">
        <button class="btn btn-primary" [disabled]="!selectedFile || processing" (click)="process()">
          <span *ngIf="processing" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!processing" class="bi bi-robot me-1"></i>
          Process with Copilot
        </button>
        <a routerLink="/registry/new" class="btn btn-outline-secondary">
          <i class="bi bi-pencil me-1"></i>Start manually instead
        </a>
      </div>

      <!-- Quota info -->
      <p class="text-muted small mt-3">
        <i class="bi bi-info-circle me-1"></i>
        Copilot calls consume your daily quota. Results are suggestions only and must be reviewed.
      </p>
    </div>
  `,
})
export class UploadComponent {
  selectedFile: File | null = null;
  doiCtrl = new FormControl('');
  isDragOver = false;
  processing = false;
  errorMsg = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private copilotService: CopilotService,
    private registryService: RegistryService,
    private router: Router,
    public auth: AuthService,
  ) {}

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.errorMsg = 'Only PDF files are accepted.';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.errorMsg = 'File exceeds 20 MB limit.';
      return;
    }
    this.errorMsg = '';
    this.selectedFile = file;
  }

  process(): void {
    if (!this.selectedFile) return;
    this.processing = true;
    this.errorMsg = '';

    this.copilotService
      .process(this.selectedFile, this.doiCtrl.value || undefined)
      .subscribe({
        next: response => {
          this.processing = false;
          // Create a draft, then navigate to the editor with annotations in navigation state
          this.registryService.create({ isAiGenerated: true }).subscribe(entry => {
            this.router.navigate(['/registry', entry.uuid, 'edit'], {
              state: { copilotAnnotations: response.annotations },
            });
          });
        },
        error: err => {
          this.processing = false;
          this.errorMsg =
            err.status === 429
              ? 'Daily Copilot quota reached. Try again tomorrow.'
              : 'Copilot processing failed. Please try again or start manually.';
        },
      });
  }

  formatSize(bytes: number): string {
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  }
}
