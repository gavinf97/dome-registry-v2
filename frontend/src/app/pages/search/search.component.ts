import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RegistryService, SearchParams } from '../../services/registry.service';
import { RegistryEntry } from '../../models/registry.models';

@Component({
  selector: 'app-search',
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Browse DOME Registry</h2>

      <!-- Search bar -->
      <div class="row g-2 mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Search by title, authors, tags…"
              [formControl]="searchCtrl" />
          </div>
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control" placeholder="Filter by tag" [formControl]="tagCtrl" />
        </div>
        <div class="col-auto">
          <a routerLink="/registry/new" class="btn btn-primary">
            <i class="bi bi-plus-lg me-1"></i>New Entry
          </a>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <ng-container *ngIf="!loading">
        <p class="text-muted small mb-3">{{ total }} entries found</p>

        <div class="list-group">
          <a *ngFor="let entry of entries" [routerLink]="['/registry', entry.uuid]"
            class="list-group-item list-group-item-action py-3" title="View entry detail">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <strong>{{ entry.publication?.['title'] || '(untitled)' }}</strong>
                  <span *ngIf="entry.isAiGenerated" class="badge bg-primary bg-opacity-75 small">AI-assisted</span>
                </div>
                <small class="text-muted">
                  {{ entry.publication?.['authors'] }} · {{ entry.publication?.['journal'] }}
                  {{ entry.publication?.['year'] }}
                </small>
                <div class="mt-1">
                  <span *ngFor="let tag of entry.tags" class="badge bg-light text-dark border me-1">{{ tag }}</span>
                </div>
              </div>
              <div class="text-end flex-shrink-0 ms-3">
                <div class="badge bg-primary fs-6 score-badge rounded-pill">{{ entry.score | number:'1.0-1' }}</div>
                <small class="d-block text-muted mt-1">score</small>
              </div>
            </div>
          </a>
        </div>

        <!-- Pagination -->
        <div *ngIf="total > limit" class="d-flex justify-content-center mt-4">
          <div class="btn-group">
            <button class="btn btn-outline-secondary" [disabled]="page === 0" (click)="prevPage()">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="btn btn-outline-secondary disabled">{{ page + 1 }} / {{ totalPages }}</span>
            <button class="btn btn-outline-secondary" [disabled]="page >= totalPages - 1" (click)="nextPage()">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div *ngIf="entries.length === 0 && !loading" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          No entries found. <a routerLink="/registry/new">Add one!</a>
        </div>
      </ng-container>
    </div>
  `,
})
export class SearchComponent implements OnInit {
  searchCtrl = new FormControl('');
  tagCtrl = new FormControl('');

  entries: RegistryEntry[] = [];
  total = 0;
  loading = false;
  page = 0;
  limit = 20;

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  constructor(private registryService: RegistryService) {}

  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(() => { this.page = 0; this.load(); });

    this.tagCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(() => { this.page = 0; this.load(); });

    this.load();
  }

  load(): void {
    this.loading = true;
    const params: SearchParams = {
      text: this.searchCtrl.value || undefined,
      tags: this.tagCtrl.value || undefined,
      skip: this.page * this.limit,
      limit: this.limit,
    };
    this.registryService.search(params).subscribe({
      next: result => {
        this.entries = result.entries;
        this.total = result.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  nextPage(): void { this.page++; this.load(); }
  prevPage(): void { this.page--; this.load(); }
}
