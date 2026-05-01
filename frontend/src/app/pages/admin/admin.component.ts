import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UsersService } from '../../services/api.service';
import { RegistryService, AdminQueueFilters } from '../../services/registry.service';
import { AuthService } from '../../auth/auth.service';
import { UserProfile, RegistryEntry } from '../../models/registry.models';

@Component({
  selector: 'app-admin',
  template: `
    <div class="container py-4">
      <h2 class="mb-1">Admin Panel</h2>
      <p class="text-muted small mb-4">Manage users and review submissions awaiting moderation.</p>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item" *ngIf="isAdmin">
          <button class="nav-link" [class.active]="tab === 'users'" (click)="setTab('users')">
            <i class="bi bi-people me-1"></i>Users
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="tab === 'moderation'" (click)="setTab('moderation')">
            <i class="bi bi-shield-check me-1"></i>Moderation
            <span *ngIf="queueEntries.length > 0" class="badge bg-warning text-dark ms-1">{{ queueEntries.length }}</span>
          </button>
        </li>
      </ul>

      <!-- ── Users tab ─────────────────────────────────────────── -->
      <ng-container *ngIf="tab === 'users' && isAdmin">
        <div *ngIf="loading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>

        <table *ngIf="!loading" class="table table-sm table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>ORCID</th>
              <th>Display Name</th>
              <th>Roles</th>
              <th>Daily LLM</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let user of users">
              <tr>
                <td><small class="text-muted">{{ user.orcid }}</small></td>
                <td>{{ user.displayName }}</td>
                <td>
                  <span *ngFor="let r of user.roles" class="badge bg-secondary me-1">{{ r }}</span>
                </td>
                <td>{{ user.dailyLLMCalls }}</td>
                <td><small>{{ user.lastLoginAt | date:'short' }}</small></td>
                <td>
                  <button class="btn btn-xs btn-outline-primary btn-sm"
                    (click)="editingUser = user; editRoles = user.roles.slice()">
                    Edit Roles
                  </button>
                </td>
              </tr>
              <tr *ngIf="editingUser?.orcid === user.orcid">
                <td colspan="6" class="bg-light p-3">
                  <div class="d-flex gap-2 flex-wrap mb-2">
                    <button *ngFor="let role of allRoles" type="button"
                      [class]="editRoles.includes(role) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-secondary'"
                      (click)="toggleRole(role)">{{ role }}</button>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-success" (click)="saveRoles(user)">Save</button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="editingUser = null">Cancel</button>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>

        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" [disabled]="page === 1" (click)="prevPage()">Prev</button>
          <span class="btn btn-sm disabled">{{ page }}</span>
          <button class="btn btn-sm btn-outline-secondary" [disabled]="users.length < 50" (click)="nextPage()">Next</button>
        </div>
      </ng-container>

      <!-- ── Moderation tab ─────────────────────────────────────── -->
      <ng-container *ngIf="tab === 'moderation'">

        <!-- KPI status chips -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button *ngFor="let s of statusChips"
            class="btn btn-sm d-flex align-items-center gap-1"
            [class]="filterStatus === s.value ? s.activeClass : 'btn-outline-secondary'"
            (click)="setStatusFilter(s.value)">
            {{ s.label }}
            <span class="badge rounded-pill ms-1"
              [class]="filterStatus === s.value ? 'bg-white text-dark' : 'bg-secondary'">
              {{ countByStatus(s.value) }}
            </span>
          </button>
        </div>

        <!-- Filter bar -->
        <div class="row g-2 mb-3 align-items-center">
          <div class="col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search title or ORCID…"
                [formControl]="searchControl">
            </div>
          </div>
          <div class="col-md-3">
            <input class="form-control form-control-sm" placeholder="Filter by journal ID…"
              [(ngModel)]="filterJournal" (change)="loadQueue()">
          </div>
          <div class="col-md-2">
            <select class="form-select form-select-sm" [(ngModel)]="filterAI" (change)="loadQueue()">
              <option [ngValue]="null">All sources</option>
              <option [ngValue]="true">AI-generated only</option>
              <option [ngValue]="false">Human only</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-sm btn-outline-secondary w-100" (click)="clearFilters()">
              <i class="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>

        <div *ngIf="modLoading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>

        <div *ngIf="!modLoading && filteredEntries.length === 0" class="text-muted text-center py-5">
          <i class="bi bi-check-circle fs-2 d-block mb-2 text-success"></i>
          No entries match the current filters.
        </div>

        <!-- Entry list -->
        <div class="list-group" *ngIf="!modLoading && filteredEntries.length > 0">
          <div *ngFor="let entry of filteredEntries"
            class="list-group-item py-3 px-3">
            <div class="d-flex justify-content-between align-items-start gap-3">

              <!-- Meta -->
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <a [routerLink]="['/registry', entry.uuid]" target="_blank"
                    class="fw-semibold text-decoration-none text-truncate" style="max-width:380px">
                    {{ entry.publication?.['title'] || '(untitled)' }}
                  </a>
                  <span class="badge"
                    [class.bg-warning]="entry.moderationStatus === 'pending'"
                    [class.text-dark]="entry.moderationStatus === 'pending'"
                    [class.bg-info]="entry.moderationStatus === 'held'"
                    [class.bg-danger]="entry.moderationStatus === 'rejected'"
                    [class.bg-secondary]="entry.moderationStatus === 'draft'">
                    {{ entry.moderationStatus }}
                  </span>
                  <span *ngIf="entry.isAiGenerated" class="badge ai-badge">
                    <i class="bi bi-robot me-1"></i>AI
                  </span>
                </div>
                <div class="text-muted small d-flex flex-wrap gap-2">
                  <span><i class="bi bi-person me-1"></i>{{ entry.user }}</span>
                  <span *ngIf="entry.publication?.['journal']">
                    <i class="bi bi-journal me-1"></i>{{ entry.publication?.['journal'] }}
                    <span *ngIf="entry.publication?.['year']"> {{ entry.publication?.['year'] }}</span>
                  </span>
                  <span *ngIf="entry.journalId"><i class="bi bi-tag me-1"></i>{{ entry.journalId }}</span>
                  <span class="badge rounded-pill"
                    [class.bg-success]="entry.score >= 75"
                    [class.bg-warning]="entry.score >= 40 && entry.score < 75"
                    [class.text-dark]="entry.score >= 40 && entry.score < 75"
                    [class.bg-danger]="entry.score < 40">
                    {{ entry.score | number:'1.0-1' }}%
                  </span>
                  <span><i class="bi bi-clock me-1"></i>{{ entry.updated | date:'mediumDate' }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex gap-1 flex-shrink-0 flex-wrap justify-content-end" style="min-width:240px">
                <button class="btn btn-sm btn-success" title="Approve → Public"
                  (click)="moderate(entry, 'public')"
                  [disabled]="moderating === entry.uuid">
                  <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" title="Hold"
                  (click)="moderate(entry, 'held')"
                  [disabled]="moderating === entry.uuid || entry.moderationStatus === 'held'">
                  <i class="bi bi-pause-circle"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" title="Reject"
                  (click)="moderate(entry, 'rejected')"
                  [disabled]="moderating === entry.uuid">
                  <i class="bi bi-x-lg"></i>
                </button>
                <button *ngIf="isAdmin" class="btn btn-sm btn-outline-primary" title="Send message to submitter"
                  (click)="openNotifyModal(entry)">
                  <i class="bi bi-envelope"></i>
                </button>
                <button *ngIf="isAdmin" class="btn btn-sm btn-outline-secondary" title="Delete entry"
                  (click)="openDeleteModal(entry)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- ── Delete modal ───────────────────────────────────────────── -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">
              <i class="bi bi-trash text-danger me-2"></i>Delete Entry
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">
              This will permanently delete
              <strong>{{ entryToDelete?.publication?.['title'] || entryToDelete?.uuid }}</strong>.
              This action cannot be undone.
            </p>
            <label class="form-label small fw-semibold">
              Reason for deletion
              <span class="text-muted fw-normal">(optional — will be emailed to the submitter)</span>
            </label>
            <textarea class="form-control" rows="3" placeholder="Enter a reason…"
              [(ngModel)]="deleteReason"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-1"></span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Notify modal ───────────────────────────────────────────── -->
    <div class="modal fade" id="notifyModal" tabindex="-1" aria-labelledby="notifyModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="notifyModalLabel">
              <i class="bi bi-envelope me-2"></i>Send Message to Submitter
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">
              Send a message to the submitter of
              <strong>{{ entryToNotify?.publication?.['title'] || entryToNotify?.uuid }}</strong>.
            </p>
            <label class="form-label small fw-semibold">Message</label>
            <textarea class="form-control" rows="5" placeholder="Enter your message…"
              [(ngModel)]="notifyMessage"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirmNotify()" [disabled]="notifying || !notifyMessage">
              <span *ngIf="notifying" class="spinner-border spinner-border-sm me-1"></span>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-badge { background: linear-gradient(135deg, #7b2ff7, #2196f3); color: #fff; }
    .list-group-item { border-left: 3px solid transparent; transition: border-color .15s; }
    .list-group-item:hover { border-left-color: #003958; }
  `],
})
export class AdminComponent implements OnInit, OnDestroy {
  tab = 'users';
  users: UserProfile[] = [];
  loading = true;
  page = 1;
  editingUser: UserProfile | null = null;
  editRoles: string[] = [];
  allRoles = ['user', 'admin', 'journal_owner', 'curator'];

  // Moderation tab
  queueEntries: RegistryEntry[] = [];
  modLoading = false;
  moderating: string | null = null;

  // Filters
  searchControl = new FormControl('');
  filterStatus: string = '';
  filterJournal = '';
  filterAI: boolean | null = null;

  // Delete modal state
  entryToDelete: RegistryEntry | null = null;
  deleteReason = '';
  deleting = false;

  // Notify modal state
  entryToNotify: RegistryEntry | null = null;
  notifyMessage = '';
  notifying = false;

  private destroy$ = new Subject<void>();

  statusChips = [
    { value: '', label: 'All', activeClass: 'btn-secondary' },
    { value: 'pending', label: 'Pending', activeClass: 'btn-warning text-dark' },
    { value: 'held', label: 'Held', activeClass: 'btn-info text-dark' },
    { value: 'rejected', label: 'Rejected', activeClass: 'btn-danger' },
    { value: 'draft', label: 'Draft', activeClass: 'btn-secondary' },
  ];

  get isAdmin(): boolean {
    return this.auth.hasRole('admin');
  }

  get filteredEntries(): RegistryEntry[] {
    const q = this.searchControl.value?.toLowerCase() ?? '';
    return this.queueEntries.filter(e => {
      if (this.filterStatus && e.moderationStatus !== this.filterStatus) return false;
      if (this.filterJournal && e['journalId'] !== this.filterJournal) return false;
      if (this.filterAI !== null && !!e.isAiGenerated !== this.filterAI) return false;
      if (q) {
        const title = (e.publication?.['title'] ?? '').toLowerCase();
        const orcid = (e.user ?? '').toLowerCase();
        if (!title.includes(q) && !orcid.includes(q)) return false;
      }
      return true;
    });
  }

  countByStatus(status: string): number {
    if (!status) return this.queueEntries.length;
    return this.queueEntries.filter(e => e.moderationStatus === status).length;
  }

  constructor(
    private usersService: UsersService,
    private registryService: RegistryService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.isAdmin) {
      this.tab = 'users';
      this.loadUsers();
    } else {
      this.tab = 'moderation';
    }
    this.loadQueue();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => { /* filtering done client-side via filteredEntries getter */ });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(t: string): void {
    this.tab = t;
  }

  setStatusFilter(status: string): void {
    this.filterStatus = status;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.filterStatus = '';
    this.filterJournal = '';
    this.filterAI = null;
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.adminListUsers(this.page).subscribe(res => {
      this.users = res.users;
      this.loading = false;
    });
  }

  loadQueue(): void {
    this.modLoading = true;
    this.registryService.getAdminQueue().subscribe({
      next: (entries) => { this.queueEntries = entries; this.modLoading = false; },
      error: () => { this.modLoading = false; },
    });
  }

  moderate(entry: RegistryEntry, status: string): void {
    this.moderating = entry.uuid;
    this.registryService.moderate(entry.uuid, status).subscribe({
      next: (updated) => {
        const idx = this.queueEntries.findIndex(e => e.uuid === updated.uuid);
        if (idx !== -1) this.queueEntries[idx] = updated;
        if (status === 'public') {
          this.queueEntries = this.queueEntries.filter(e => e.uuid !== updated.uuid);
        }
        this.moderating = null;
      },
      error: () => { this.moderating = null; },
    });
  }

  openDeleteModal(entry: RegistryEntry): void {
    this.entryToDelete = entry;
    this.deleteReason = '';
    this.deleting = false;
    const el = document.getElementById('deleteModal');
    if (el) (window as any).bootstrap?.Modal.getOrCreateInstance(el).show();
  }

  confirmDelete(): void {
    if (!this.entryToDelete) return;
    this.deleting = true;
    const entry = this.entryToDelete;

    const doDelete = () => {
      this.registryService.delete(entry.uuid).subscribe({
        next: () => {
          this.queueEntries = this.queueEntries.filter(e => e.uuid !== entry.uuid);
          this.deleting = false;
          const el = document.getElementById('deleteModal');
          if (el) (window as any).bootstrap?.Modal.getOrCreateInstance(el).hide();
        },
        error: () => { this.deleting = false; },
      });
    };

    if (this.deleteReason.trim()) {
      this.registryService.sendModerationNotification(entry.uuid, this.deleteReason).subscribe({
        next: doDelete,
        error: doDelete, // still delete even if email fails
      });
    } else {
      doDelete();
    }
  }

  openNotifyModal(entry: RegistryEntry): void {
    this.entryToNotify = entry;
    this.notifyMessage = '';
    this.notifying = false;
    const el = document.getElementById('notifyModal');
    if (el) (window as any).bootstrap?.Modal.getOrCreateInstance(el).show();
  }

  confirmNotify(): void {
    if (!this.entryToNotify || !this.notifyMessage) return;
    this.notifying = true;
    this.registryService.sendModerationNotification(this.entryToNotify.uuid, this.notifyMessage).subscribe({
      next: () => {
        this.notifying = false;
        const el = document.getElementById('notifyModal');
        if (el) (window as any).bootstrap?.Modal.getOrCreateInstance(el).hide();
      },
      error: () => { this.notifying = false; },
    });
  }

  toggleRole(role: string): void {
    if (this.editRoles.includes(role)) {
      this.editRoles = this.editRoles.filter(r => r !== role);
    } else {
      this.editRoles = [...this.editRoles, role];
    }
  }

  saveRoles(user: UserProfile): void {
    this.usersService.adminSetRoles(user.orcid, this.editRoles).subscribe(updated => {
      const idx = this.users.findIndex(u => u.orcid === user.orcid);
      if (idx !== -1) this.users[idx] = updated;
      this.editingUser = null;
    });
  }

  nextPage(): void { this.page++; this.loadUsers(); }
  prevPage(): void { this.page--; this.loadUsers(); }
}

