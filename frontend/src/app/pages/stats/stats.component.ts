import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface StatsData {
  total: number;
  public: number;
  aiGenerated: number;
  avgScore: number;
  byStatus: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  topTags: { tag: string; count: number }[];
  byYear: { year: string; count: number }[];
  topJournals: { journal: string; count: number }[];
  recentEntries: { uuid: string; shortid: string; title: string; score: number; created: string; isAiGenerated: boolean }[];
}

@Component({
  selector: 'app-stats',
  template: `
    <div class="container py-4">
      <h4 class="fw-bold text-primary mb-4"><i class="bi bi-bar-chart-line me-2"></i>Registry Statistics</h4>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <ng-container *ngIf="!loading && stats">

        <!-- KPI strip -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-primary">{{ stats.total }}</div>
                <div class="text-muted small mt-1">Total Entries</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-success">{{ stats.public }}</div>
                <div class="text-muted small mt-1">Public</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold" [style.color]="scoreColor(stats.avgScore)">
                  {{ stats.avgScore | number:'1.0-1' }}
                </div>
                <div class="text-muted small mt-1">Avg DOME Score</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold" style="color:#7c3aed">{{ stats.aiGenerated ?? 0 }}</div>
                <div class="text-muted small mt-1"><i class="bi bi-robot me-1"></i>AI-Assisted</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 1: Score distribution + Status -->
        <div class="row g-3 mb-3">
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-bar-chart me-2"></i>Score Distribution
              </div>
              <div class="card-body">
                <div *ngFor="let bucket of stats.scoreDistribution; let i = index" class="mb-3">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold">{{ bucket.range }}</span>
                    <span class="text-muted">{{ bucket.count }} entries</span>
                  </div>
                  <div class="rounded-pill overflow-hidden" style="height:18px;background:#e9ecef">
                    <div class="rounded-pill"
                      [style.width.%]="stats.public ? (bucket.count / stats.public * 100) : 0"
                      [style.background]="scoreBucketColor(i)"
                      style="height:18px;transition:width .4s"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-pie-chart me-2"></i>Moderation Status
              </div>
              <div class="card-body">
                <div *ngFor="let status of statusEntries()" class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1 small">
                    <span class="badge rounded-pill"
                      [class.bg-success]="status[0] === 'public'"
                      [class.bg-warning]="status[0] === 'pending' || status[0] === 'held'"
                      [class.bg-secondary]="status[0] === 'draft'"
                      [class.bg-danger]="status[0] === 'rejected'">
                      {{ status[0] }}
                    </span>
                    <span class="text-muted">{{ status[1] }}</span>
                  </div>
                  <div class="rounded-pill overflow-hidden" style="height:12px;background:#e9ecef">
                    <div class="rounded-pill"
                      [style.width.%]="stats.total ? (status[1] / stats.total * 100) : 0"
                      [class.bg-success]="status[0] === 'public'"
                      [class.bg-warning]="status[0] === 'pending' || status[0] === 'held'"
                      [class.bg-secondary]="status[0] === 'draft'"
                      [class.bg-danger]="status[0] === 'rejected'"
                      style="height:12px;transition:width .4s"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: By year + Top journals -->
        <div class="row g-3 mb-3">
          <div class="col-lg-6" *ngIf="stats.byYear?.length">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-calendar3 me-2"></i>Entries by Publication Year
              </div>
              <div class="card-body">
                <div *ngFor="let y of stats.byYear" class="mb-2">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold">{{ y.year }}</span>
                    <span class="text-muted">{{ y.count }}</span>
                  </div>
                  <div class="rounded-pill overflow-hidden" style="height:14px;background:#e9ecef">
                    <div class="rounded-pill bg-primary"
                      [style.width.%]="maxYear ? (y.count / maxYear * 100) : 0"
                      style="height:14px;transition:width .4s;opacity:.8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6" *ngIf="stats.topJournals?.length">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-journal-text me-2"></i>Top Journals
              </div>
              <div class="card-body">
                <div *ngFor="let j of stats.topJournals" class="mb-2">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="text-truncate fw-semibold" style="max-width:75%">{{ j.journal }}</span>
                    <span class="text-muted flex-shrink-0">{{ j.count }}</span>
                  </div>
                  <div class="rounded-pill overflow-hidden" style="height:12px;background:#e9ecef">
                    <div class="rounded-pill"
                      [style.width.%]="maxJournal ? (j.count / maxJournal * 100) : 0"
                      style="height:12px;background:#F66729;transition:width .4s;opacity:.8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Tags + Recent entries -->
        <div class="row g-3">
          <div class="col-lg-5" *ngIf="stats.topTags?.length">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-tags me-2"></i>Top Tags
              </div>
              <div class="card-body">
                <div *ngFor="let t of stats.topTags" class="mb-2">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-secondary flex-shrink-0">{{ t.tag }}</span>
                    <div class="progress flex-grow-1" style="height:10px">
                      <div class="progress-bar bg-secondary"
                        [style.width.%]="stats.topTags[0].count ? (t.count / stats.topTags[0].count * 100) : 0">
                      </div>
                    </div>
                    <small class="text-muted flex-shrink-0">{{ t.count }}</small>
                  </div>
                </div>
                <div *ngIf="stats.topTags.length === 0" class="text-muted small">No tags yet.</div>
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-muted py-2">
                <i class="bi bi-clock-history me-2"></i>Recent Public Entries
              </div>
              <div class="list-group list-group-flush">
                <a *ngFor="let e of stats.recentEntries"
                  [routerLink]="['/registry', e.shortid || e.uuid]"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3">
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center gap-2">
                      <span class="small fw-semibold text-truncate">{{ e.title || '(untitled)' }}</span>
                      <span *ngIf="e.isAiGenerated"
                        class="badge rounded-pill flex-shrink-0"
                        style="background:linear-gradient(90deg,#7c3aed,#2563eb);color:#fff;font-size:0.65rem">
                        <i class="bi bi-robot"></i>
                      </span>
                    </div>
                    <small class="text-muted">{{ e.created | date:'mediumDate' }}</small>
                  </div>
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ms-3 flex-shrink-0"
                    [style.background]="scoreColor(e.score)"
                    style="width:36px;height:36px;font-size:0.75rem">
                    {{ e.score | number:'1.0-0' }}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

      </ng-container>
    </div>
  `,
})
export class StatsComponent implements OnInit {
  stats: StatsData | null = null;
  loading = true;

  get maxYear(): number {
    return Math.max(...(this.stats?.byYear?.map(y => y.count) ?? [1]));
  }
  get maxJournal(): number {
    return Math.max(...(this.stats?.topJournals?.map(j => j.count) ?? [1]));
  }

  statusEntries(): [string, number][] {
    return Object.entries(this.stats?.byStatus ?? {}).sort((a, b) => b[1] - a[1]);
  }

  scoreColor(score: number): string {
    const s = score ?? 0;
    if (s >= 75) return '#198754';
    if (s >= 40) return '#ffc107';
    return '#dc3545';
  }

  scoreBucketColor(index: number): string {
    return ['#dc3535', '#e87c2b', '#2ea86e', '#1a7fbf'][index] ?? '#6c757d';
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<StatsData>('/api/registry/stats').subscribe({
      next: data => { this.stats = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
