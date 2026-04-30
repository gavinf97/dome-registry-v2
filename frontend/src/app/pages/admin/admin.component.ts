import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UsersService } from '../../services/api.service';
import { RegistryService } from '../../services/registry.service';
import { UserProfile, RegistryEntry } from '../../models/registry.models';

@Component({
  selector: 'app-admin',
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Admin Panel</h2>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button class="nav-link" [class.active]="tab === 'users'" (click)="setTab('users')">
            Users
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="tab === 'moderation'" (click)="setTab('moderation')">
            Moderation
            <span *ngIf="pendingCount > 0" class="badge bg-warning text-dark ms-1">{{ pendingCount }}</span>
          </button>
        </li>
      </ul>

      <!-- Users tab -->
      <ng-container *ngIf="tab === 'users'">
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
              <!-- Inline role editor -->
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

        <!-- Pagination -->
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" [disabled]="page === 1" (click)="prevPage()">Prev</button>
          <span class="btn btn-sm disabled">{{ page }}</span>
          <button class="btn btn-sm btn-outline-secondary" [disabled]="users.length < 50" (click)="nextPage()">Next</button>
        </div>
      </ng-container>

      <!-- Moderation tab -->
      <ng-container *ngIf="tab === 'moderation'">
        <div *ngIf="modLoading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>

        <div *ngIf="!modLoading && pendingEntries.length === 0" class="text-muted text-center py-5">
          <i class="bi bi-check-circle fs-2 d-block mb-2"></i>No entries awaiting moderation.
        </div>

        <div class="list-group" *ngIf="!modLoading && pendingEntries.length > 0">
          <div *ngFor="let entry of pendingEntries"
            class="list-group-item list-group-item-action py-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <a [routerLink]="['/registry', entry.uuid]" class="fw-semibold text-decoration-none">
                    {{ entry.publication?.['title'] || '(untitled)' }}
                  </a>
                  <span class="badge"
                    [class.bg-warning]="entry.moderationStatus === 'pending'"
                    [class.text-dark]="entry.moderationStatus === 'pending'"
                    [class.bg-info]="entry.moderationStatus === 'held'">
                    {{ entry.moderationStatus }}
                  </span>
                </div>
                <small class="text-muted">
                  ORCID: {{ entry.user }} &middot;
                  Score: {{ entry.score | number:'1.0-1' }} &middot;
                  Updated: {{ entry.updated | date:'mediumDate' }}
                </small>
              </div>
              <div class="d-flex gap-2 flex-shrink-0 ms-3">
                <button class="btn btn-sm btn-success"
                  (click)="moderate(entry, 'public')"
                  [disabled]="moderating === entry.uuid">
                  <i class="bi bi-check-lg me-1"></i>Approve
                </button>
                <button class="btn btn-sm btn-danger"
                  (click)="moderate(entry, 'rejected')"
                  [disabled]="moderating === entry.uuid">
                  <i class="bi bi-x-lg me-1"></i>Reject
                </button>
                <button class="btn btn-sm btn-outline-secondary"
                  (click)="moderate(entry, 'held')"
                  [disabled]="moderating === entry.uuid || entry.moderationStatus === 'held'">
                  Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  tab = 'users';
  users: UserProfile[] = [];
  loading = true;
  page = 1;
  editingUser: UserProfile | null = null;
  editRoles: string[] = [];
  allRoles = ['user', 'admin', 'journal_owner', 'curator'];

  // Moderation tab
  pendingEntries: RegistryEntry[] = [];
  modLoading = false;
  moderating: string | null = null;

  get pendingCount(): number {
    return this.pendingEntries.filter(e => e.moderationStatus === 'pending').length;
  }

  constructor(
    private usersService: UsersService,
    private registryService: RegistryService,
  ) {}

  ngOnInit(): void { this.loadUsers(); }

  setTab(t: string): void {
    this.tab = t;
    if (t === 'moderation' && this.pendingEntries.length === 0 && !this.modLoading) {
      this.loadPending();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.adminListUsers(this.page).subscribe(res => {
      this.users = res.users;
      this.loading = false;
    });
  }

  loadPending(): void {
    this.modLoading = true;
    this.registryService.getPendingQueue().subscribe({
      next: (entries) => { this.pendingEntries = entries; this.modLoading = false; },
      error: () => { this.modLoading = false; },
    });
  }

  moderate(entry: RegistryEntry, status: string): void {
    this.moderating = entry.uuid;
    this.registryService.moderate(entry.uuid, status).subscribe({
      next: (updated) => {
        this.pendingEntries = this.pendingEntries.filter(e => e.uuid !== updated.uuid);
        this.moderating = null;
      },
      error: () => { this.moderating = null; },
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
