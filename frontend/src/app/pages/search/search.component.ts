import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RegistryService, SearchParams } from '../../services/registry.service';
import { RegistryEntry } from '../../models/registry.models';

@Component({
  selector: 'app-search',
  template: `
    <div class="container-fluid py-4">
      <div class="row g-4">

        <!-- ─── Filter Sidebar ─── -->
        <div class="col-lg-3">
          <div class="card border-0 shadow-sm sticky-top" style="top: 80px">
            <div class="card-header bg-primary text-white d-flex align-items-center justify-content-between py-2">
              <span class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filters</span>
              <button class="btn btn-sm btn-link text-white p-0" (click)="clearFilters()" title="Clear all filters">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
            <div class="card-body p-3">

              <!-- Text search -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Keyword search</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control" placeholder="Title, authors, tags…" [formControl]="searchCtrl" />
                </div>
              </div>

              <!-- Tags -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Tag</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g. protein, RNA" [formControl]="tagCtrl" />
              </div>

              <!-- Year -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Publication Year</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g. 2022" [formControl]="yearCtrl" />
              </div>

              <!-- Journal -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Journal</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g. Nature Methods" [formControl]="journalCtrl" />
              </div>

              <!-- Sort -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Sort by</label>
                <select class="form-select form-select-sm" [formControl]="sortCtrl">
                  <option value="">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="score">Highest score</option>
                </select>
              </div>

              <!-- Min score -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">
                  Min score: <strong>{{ minScoreCtrl.value }}</strong>
                </label>
                <input type="range" class="form-range" min="0" max="100" step="5" [formControl]="minScoreCtrl" />
              </div>

              <!-- AI-generated toggle -->
              <div class="mb-3">
                <div class="fw-semibold small text-muted mb-2">AI-Assisted Content</div>
                <div class="d-flex gap-2">
                  <button type="button"
                    class="flex-fill btn btn-sm fw-semibold"
                    [class.btn-primary]="aiCtrl.value === ''"
                    [class.btn-outline-secondary]="aiCtrl.value !== ''"
                    (click)="aiCtrl.setValue('')">
                    All
                  </button>
                  <button type="button"
                    class="flex-fill btn btn-sm fw-semibold"
                    [class.btn-danger]="aiCtrl.value === 'false'"
                    [class.btn-outline-secondary]="aiCtrl.value !== 'false'"
                    (click)="aiCtrl.setValue('false')">
                    <i class="bi bi-person-check me-1"></i>Human
                  </button>
                  <button type="button"
                    class="flex-fill btn btn-sm fw-semibold"
                    style="white-space:nowrap"
                    [class.btn-warning]="aiCtrl.value === 'true'"
                    [class.btn-outline-secondary]="aiCtrl.value !== 'true'"
                    (click)="aiCtrl.setValue('true')">
                    <i class="bi bi-robot me-1"></i>AI
                  </button>
                </div>
                <div *ngIf="aiCtrl.value === 'true'"
                  class="mt-2 p-2 rounded small"
                  style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);color:#7c3aed">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>
                  AI-assisted entries require human verification.
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ─── Results Column ─── -->
        <div class="col-lg-9">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="mb-0 fw-bold text-primary">Browse DOME Registry</h5>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-secondary rounded-pill">{{ total }} results</span>
              <a routerLink="/registry/new" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-lg me-1"></i>New Entry
              </a>
            </div>
          </div>

          <!-- Active filter chips -->
          <div class="d-flex flex-wrap gap-1 mb-3" *ngIf="hasActiveFilters">
            <span *ngIf="searchCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-search me-1"></i>{{ searchCtrl.value }}
              <button class="btn-close btn-close ms-1" style="font-size:0.5rem" (click)="searchCtrl.setValue('')"></button>
            </span>
            <span *ngIf="tagCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-tag me-1"></i>{{ tagCtrl.value }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="tagCtrl.setValue('')"></button>
            </span>
            <span *ngIf="yearCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-calendar3 me-1"></i>{{ yearCtrl.value }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="yearCtrl.setValue('')"></button>
            </span>
            <span *ngIf="journalCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-journal-text me-1"></i>{{ journalCtrl.value }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="journalCtrl.setValue('')"></button>
            </span>
            <span *ngIf="sortCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-sort-down me-1"></i>{{ sortLabelFor(sortCtrl.value) }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="sortCtrl.setValue('')"></button>
            </span>
            <span *ngIf="(minScoreCtrl.value ?? 0) > 0" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-star me-1"></i>Score ≥ {{ minScoreCtrl.value }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="minScoreCtrl.setValue(0)"></button>
            </span>
            <span *ngIf="aiCtrl.value" class="badge bg-light text-dark border rounded-pill">
              <i class="bi bi-robot me-1"></i>{{ aiCtrl.value === 'true' ? 'AI-assisted' : 'Manual only' }}
              <button class="btn-close ms-1" style="font-size:0.5rem" (click)="aiCtrl.setValue('')"></button>
            </span>
          </div>

          <!-- Spinner -->
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
          </div>

          <!-- Entry cards -->
          <ng-container *ngIf="!loading">
            <div class="list-group list-group-flush shadow-sm rounded overflow-hidden">
              <a *ngFor="let entry of entries"
                [routerLink]="['/registry', entry.shortid || entry.uuid]"
                class="list-group-item list-group-item-action py-3 px-4 border-bottom">
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <div class="flex-grow-1 min-w-0">

                    <!-- Title + AI badge -->
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <span class="fw-semibold text-truncate">{{ entry.publication?.['title'] || '(untitled)' }}</span>
                      <span *ngIf="entry.isAiGenerated"
                        class="badge rounded-pill"
                        style="background: linear-gradient(90deg,#7c3aed,#2563eb); color:#fff; font-size:0.7rem;">
                        <i class="bi bi-robot me-1"></i>AI-assisted
                      </span>
                    </div>

                    <!-- Authors / journal / year -->
                    <div class="text-muted small mb-1">
                      <span *ngIf="entry.publication?.['authors']">{{ entry.publication?.['authors'] }}</span>
                      <span *ngIf="entry.publication?.['journal']"> · <em>{{ entry.publication?.['journal'] }}</em></span>
                      <span *ngIf="entry.publication?.['year']"> ({{ entry.publication?.['year'] }})</span>
                    </div>

                    <!-- DOI badge -->
                    <div class="d-flex flex-wrap align-items-center gap-1 mb-1">
                      <a *ngIf="entry.publication?.['doi']"
                        [href]="'https://doi.org/' + entry.publication?.['doi']"
                        target="_blank" rel="noopener"
                        class="badge bg-light text-dark border text-decoration-none"
                        (click)="$event.stopPropagation()">
                        DOI
                      </a>
                      <a *ngIf="entry.publication?.['pmid']"
                        [href]="'https://pubmed.ncbi.nlm.nih.gov/' + entry.publication?.['pmid']"
                        target="_blank" rel="noopener"
                        class="badge bg-light text-dark border text-decoration-none"
                        (click)="$event.stopPropagation()">
                        PubMed
                      </a>
                    </div>

                    <!-- Tags -->
                    <div *ngIf="entry.tags?.length" class="mt-1">
                      <span *ngFor="let tag of entry.tags"
                        class="badge bg-light text-dark border me-1 mb-1 small">{{ tag }}</span>
                    </div>

                    <!-- Shortid -->
                    <code class="text-muted" style="font-size:0.7rem">#{{ entry.shortid }}</code>

                  </div>

                  <!-- Score pill -->
                  <div class="text-center flex-shrink-0">
                    <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      [style.background]="scoreColor(entry.score)"
                      style="width:48px;height:48px;font-size:0.85rem;">
                      {{ entry.score | number:'1.0-0' }}
                    </div>
                    <div class="text-muted mt-1" style="font-size:0.65rem">score</div>
                  </div>
                </div>
              </a>
            </div>

            <!-- Empty state -->
            <div *ngIf="entries.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              No entries found matching your filters.
            </div>

            <!-- Pagination -->
            <div *ngIf="total > limit" class="d-flex justify-content-center align-items-center gap-3 mt-4">
              <button class="btn btn-outline-secondary btn-sm" [disabled]="page === 0" (click)="prevPage()">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="small text-muted">Page {{ page + 1 }} of {{ totalPages }}</span>
              <button class="btn btn-outline-secondary btn-sm" [disabled]="page >= totalPages - 1" (click)="nextPage()">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-group-item { transition: background 0.15s; }
    .list-group-item:hover { background: #f8f9fa; }
  `],
})
export class SearchComponent implements OnInit {
  searchCtrl  = new FormControl('');
  tagCtrl     = new FormControl('');
  sortCtrl     = new FormControl('');
  minScoreCtrl = new FormControl(0);
  aiCtrl       = new FormControl('');
  yearCtrl     = new FormControl('');
  journalCtrl  = new FormControl('');

  entries: RegistryEntry[] = [];
  total   = 0;
  loading = false;
  page    = 0;
  limit   = 20;

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  get hasActiveFilters(): boolean {
    return !!(this.searchCtrl.value || this.tagCtrl.value || this.sortCtrl.value ||
              +this.minScoreCtrl.value! > 0 || this.aiCtrl.value ||
              this.yearCtrl.value || this.journalCtrl.value);
  }

  constructor(private registryService: RegistryService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const preText = this.route.snapshot.queryParamMap.get('text');
    if (preText) { this.searchCtrl.setValue(preText, { emitEvent: false }); }

    const resetAndLoad = () => { this.page = 0; this.load(); };

    [this.searchCtrl, this.tagCtrl, this.yearCtrl, this.journalCtrl].forEach(ctrl =>
      ctrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(resetAndLoad));

    this.sortCtrl.valueChanges.pipe(debounceTime(150)).subscribe(resetAndLoad);
    this.minScoreCtrl.valueChanges.pipe(debounceTime(150)).subscribe(resetAndLoad);
    this.aiCtrl.valueChanges.pipe(debounceTime(150)).subscribe(resetAndLoad);

    this.load();
  }

  load(): void {
    this.loading = true;
    const minScore = +this.minScoreCtrl.value!;
    const params: SearchParams = {
      text:          this.searchCtrl.value  || undefined,
      tags:          this.tagCtrl.value     || undefined,
      sortBy:        this.sortCtrl.value    || undefined,
      minScore:      minScore > 0 ? minScore : undefined,
      isAiGenerated: this.aiCtrl.value === 'true'  ? true
                   : this.aiCtrl.value === 'false' ? false
                   : undefined,
      year:          this.yearCtrl.value    || undefined,
      journal:       this.journalCtrl.value || undefined,
      skip:  this.page * this.limit,
      limit: this.limit,
    };
    this.registryService.search(params).subscribe({
      next: result => {
        this.entries = result.items;
        this.total   = result.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  clearFilters(): void {
    this.searchCtrl.setValue('',  { emitEvent: false });
    this.tagCtrl.setValue('',     { emitEvent: false });
    this.sortCtrl.setValue('',    { emitEvent: false });
    this.minScoreCtrl.setValue(0, { emitEvent: false });
    this.aiCtrl.setValue('',      { emitEvent: false });
    this.yearCtrl.setValue('',    { emitEvent: false });
    this.journalCtrl.setValue('', { emitEvent: false });
    this.page = 0;
    this.load();
  }

  sortLabelFor(val: string): string {
    return val === 'score' ? 'Top score' : val === 'oldest' ? 'Oldest' : '';
  }

  /** Interpolate score from red (0) → orange (50) → teal (100) */
  scoreColor(score: number): string {
    const s = Math.max(0, Math.min(100, score ?? 0));
    if (s < 50) {
      const r = 220, g = Math.round((s / 50) * 120);
      return `rgb(${r},${g},53)`;
    } else {
      const g = 120 + Math.round(((s - 50) / 50) * 86);
      const b = Math.round(((s - 50) / 50) * 150);
      return `rgb(0,${g},${b})`;
    }
  }

  nextPage(): void { this.page++; this.load(); }
  prevPage(): void { this.page--; this.load(); }
}
