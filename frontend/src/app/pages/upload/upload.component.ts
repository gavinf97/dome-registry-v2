import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { CopilotService } from '../../services/api.service';
import { RegistryService } from '../../services/registry.service';

@Component({
  selector: 'app-upload',
  template: `
    <div class="container py-5" style="max-width: 700px">
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
