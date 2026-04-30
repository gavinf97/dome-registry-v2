import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/api.service';
import { RegistryService } from '../../services/registry.service';
import { UserProfile, RegistryEntry } from '../../models/registry.models';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-secondary',
  pending: 'bg-warning text-dark',
  public: 'bg-success',
  held: 'bg-info text-dark',
  rejected: 'bg-danger',
};

@Component({
  selector: 'app-profile',
  template: `
    <div class="container py-4" style="max-width:900px">

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <ng-container *ngIf="!loading && profile">

        <!-- Profile header -->
        <div class="card mb-4">
          <div class="card-body d-flex align-items-center gap-4">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style="width:72px;height:72px;font-size:2rem">
              {{ (profile.displayName || 'U')[0].toUpperCase() }}
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-1">{{ profile.displayName }}</h3>
              <div class="text-muted small">
                <a [href]="'https://orcid.org/' + profile.orcid" target="_blank" rel="noopener" class="me-3">
                  <i class="bi bi-person-badge me-1"></i>{{ profile.orcid }}
                </a>
                <span *ngIf="profile.organisation">
                  <i class="bi bi-building me-1"></i>{{ profile.organisation }}
                </span>
              </div>
              <div class="mt-1">
                <span *ngFor="let r of profile.roles" class="badge bg-secondary me-1 small">{{ r }}</span>
              </div>
            </div>
            <div class="text-end text-muted small">
              <div>LLM calls today: <strong>{{ profile.dailyLLMCalls }}</strong></div>
              <div>Member since: {{ profile.createdAt | date:'mediumDate' }}</div>
            </div>
          </div>
        </div>

        <!-- Edit profile form -->
        <div class="card mb-4">
          <div class="card-header fw-semibold">
            <i class="bi bi-pencil me-2"></i>Edit Profile
          </div>
          <div class="card-body">
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Display Name</label>
                  <input type="text" class="form-control" formControlName="displayName" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Organisation</label>
                  <input type="text" class="form-control" formControlName="organisation" />
                </div>
              </div>
              <div class="mt-3 d-flex gap-2 align-items-center">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving || profileForm.pristine">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  Save
                </button>
                <span *ngIf="saveSuccess" class="text-success small">
                  <i class="bi bi-check-circle me-1"></i>Saved
                </span>
              </div>
            </form>
          </div>
        </div>

        <!-- My entries -->
        <div class="card">
          <div class="card-header fw-semibold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-list-ul me-2"></i>My Entries ({{ myEntries.length }})</span>
            <a routerLink="/registry/new" class="btn btn-sm btn-primary">
              <i class="bi bi-plus-lg me-1"></i>New Entry
            </a>
          </div>
          <div *ngIf="entriesLoading" class="card-body text-center py-4">
            <div class="spinner-border text-primary spinner-border-sm"></div>
          </div>
          <div *ngIf="!entriesLoading && myEntries.length === 0" class="card-body text-muted text-center py-4">
            No entries yet. <a routerLink="/upload">Import a paper with AI</a> or
            <a routerLink="/registry/new">create one manually</a>.
          </div>
          <ul *ngIf="!entriesLoading && myEntries.length > 0" class="list-group list-group-flush">
            <li *ngFor="let entry of myEntries"
              class="list-group-item d-flex justify-content-between align-items-center py-3">
              <div>
                <div class="mb-1">
                  <a [routerLink]="['/registry', entry.uuid]" class="fw-semibold text-decoration-none">
                    {{ entry.publication?.['title'] || '(untitled)' }}
                  </a>
                  <span *ngIf="entry.isAiGenerated" class="badge bg-primary bg-opacity-50 ms-2 small">AI</span>
                </div>
                <small class="text-muted">
                  Updated {{ entry.updated | date:'mediumDate' }}
                </small>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="badge rounded-pill fs-6" style="min-width:3rem"
                  [class.bg-success]="entry.score >= 75"
                  [class.bg-warning]="entry.score >= 40 && entry.score < 75"
                  [class.bg-danger]="entry.score < 40">
                  {{ entry.score | number:'1.0-1' }}
                </span>
                <span class="badge" [ngClass]="statusBadge(entry.moderationStatus)">
                  {{ entry.moderationStatus }}
                </span>
                <div class="btn-group btn-group-sm">
                  <a [routerLink]="['/registry', entry.uuid, 'edit']" class="btn btn-outline-primary">
                    <i class="bi bi-pencil"></i>
                  </a>
                  <a [routerLink]="['/registry', entry.uuid, 'history']" class="btn btn-outline-secondary">
                    <i class="bi bi-clock-history"></i>
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </div>

      </ng-container>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  myEntries: RegistryEntry[] = [];
  loading = true;
  entriesLoading = true;
  saving = false;
  saveSuccess = false;
  profileForm!: FormGroup;

  constructor(
    private usersService: UsersService,
    private registryService: RegistryService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.maxLength(200)]],
      organisation: ['', Validators.maxLength(200)],
    });

    this.usersService.getMe().subscribe({
      next: (p) => {
        this.profile = p;
        this.profileForm.patchValue({ displayName: p.displayName, organisation: p.organisation ?? '' });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    this.registryService.getMyEntries().subscribe({
      next: (entries) => { this.myEntries = entries; this.entriesLoading = false; },
      error: () => { this.entriesLoading = false; },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving) return;
    this.saving = true;
    this.saveSuccess = false;
    this.usersService.updateMe(this.profileForm.value).subscribe({
      next: (p) => {
        this.profile = p;
        this.profileForm.markAsPristine();
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: () => { this.saving = false; },
    });
  }

  statusBadge(status: string): string {
    return STATUS_BADGE[status] ?? 'bg-secondary';
  }
}
