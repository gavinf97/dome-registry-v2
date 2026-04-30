import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { RegistryService } from '../../services/registry.service';
import { RegistryEntry, UserProfile } from '../../models/registry.models';

@Component({
  selector: 'app-journal-queue',
  template: `
    <div class="container py-4" style="max-width:960px">
      <h2 class="mb-1">Journal Review Queue</h2>
      <p class="text-muted mb-4">Entries submitted to your assigned journal(s) for peer review.</p>

      <!-- Journal tabs when multiple assignments -->
      <ul *ngIf="journals.length > 1" class="nav nav-tabs mb-4">
        <li *ngFor="let j of journals" class="nav-item">
          <button class="nav-link" [class.active]="selectedJournalId === j.journalId"
            (click)="selectJournal(j.journalId)">
            {{ j.journalName }}
            <span *ngIf="countFor(j.journalId) > 0" class="badge bg-warning text-dark ms-1">
              {{ countFor(j.journalId) }}
            </span>
          </button>
        </li>
      </ul>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div *ngIf="!loading && !selectedJournalId" class="alert alert-info">
        No journal assignments found. Contact an admin to assign you to a journal.
      </div>

      <ng-container *ngIf="!loading && selectedJournalId">
        <div *ngIf="entries.length === 0" class="text-muted text-center py-5">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>No entries awaiting review for this journal.
        </div>

        <div class="list-group">
          <div *ngFor="let entry of entries"
            class="list-group-item py-3">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1 me-3">
                <div class="fw-semibold mb-1">
                  <a [routerLink]="['/registry', entry.uuid]" class="text-decoration-none">
                    {{ entry.publication?.['title'] || '(untitled)' }}
                  </a>
                  <span *ngIf="entry.isAiGenerated" class="badge bg-primary bg-opacity-50 ms-2 small">AI</span>
                </div>
                <small class="text-muted">
                  {{ entry.publication?.['authors'] }} &middot;
                  {{ entry.publication?.['journal'] }} {{ entry.publication?.['year'] }} &middot;
                  Score: <strong>{{ entry.score | number:'1.0-1' }}</strong> &middot;
                  Submitted: {{ entry.updated | date:'mediumDate' }}
                </small>
                <div class="mt-1">
                  <span *ngFor="let tag of entry.tags" class="badge bg-light text-dark border me-1">{{ tag }}</span>
                </div>
              </div>
              <div class="d-flex flex-column gap-2 flex-shrink-0">
                <button class="btn btn-sm btn-success"
                  (click)="approve(entry)"
                  [disabled]="moderating === entry.uuid">
                  <span *ngIf="moderating === entry.uuid" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="moderating !== entry.uuid" class="bi bi-check-lg me-1"></i>Approve
                </button>
                <button class="btn btn-sm btn-outline-danger"
                  (click)="reject(entry)"
                  [disabled]="moderating === entry.uuid">
                  <i class="bi bi-x-lg me-1"></i>Reject
                </button>
                <a [routerLink]="['/registry', entry.uuid]" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-eye me-1"></i>View
                </a>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class JournalQueueComponent implements OnInit {
  journals: { journalId: string; journalName: string }[] = [];
  selectedJournalId: string | null = null;
  entries: RegistryEntry[] = [];
  // counts per journalId loaded already
  private loadedCounts: Record<string, number> = {};
  loading = true;
  moderating: string | null = null;

  constructor(
    private auth: AuthService,
    private registryService: RegistryService,
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(user => {
      if (!user) { this.loading = false; return; }
      this.journals = (user as UserProfile).journalAssignments ?? [];
      if (this.journals.length > 0) {
        this.selectJournal(this.journals[0].journalId);
      } else {
        this.loading = false;
      }
    });
  }

  selectJournal(journalId: string): void {
    this.selectedJournalId = journalId;
    this.loading = true;
    this.registryService.getJournalQueue(journalId).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loadedCounts[journalId] = entries.length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  countFor(journalId: string): number {
    return this.loadedCounts[journalId] ?? 0;
  }

  approve(entry: RegistryEntry): void {
    this.moderating = entry.uuid;
    this.registryService.moderate(entry.uuid, 'public', this.selectedJournalId ?? undefined).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.uuid !== entry.uuid);
        if (this.selectedJournalId) this.loadedCounts[this.selectedJournalId] = this.entries.length;
        this.moderating = null;
      },
      error: () => { this.moderating = null; },
    });
  }

  reject(entry: RegistryEntry): void {
    this.moderating = entry.uuid;
    this.registryService.moderate(entry.uuid, 'rejected').subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.uuid !== entry.uuid);
        if (this.selectedJournalId) this.loadedCounts[this.selectedJournalId] = this.entries.length;
        this.moderating = null;
      },
      error: () => { this.moderating = null; },
    });
  }
}
