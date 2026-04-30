import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface StatsData {
  total: number;
  public: number;
  avgScore: number;
  byStatus: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  topTags: { tag: string; count: number }[];
  recentEntries: { uuid: string; title: string; score: number; created: string }[];
}

@Component({
  selector: 'app-stats',
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Registry Statistics</h2>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <ng-container *ngIf="!loading && stats">
        <!-- KPI cards -->
        <div class="row g-3 mb-4">
          <div class="col-sm-6 col-lg-3">
            <div class="card text-center h-100">
              <div class="card-body">
                <div class="display-5 fw-bold text-primary">{{ stats.total }}</div>
                <div class="text-muted small">Total Entries</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card text-center h-100">
              <div class="card-body">
                <div class="display-5 fw-bold text-success">{{ stats.public }}</div>
                <div class="text-muted small">Public Entries</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card text-center h-100">
              <div class="card-body">
                <div class="display-5 fw-bold"
                  [class.text-success]="stats.avgScore >= 75"
                  [class.text-warning]="stats.avgScore >= 40 && stats.avgScore < 75"
                  [class.text-danger]="stats.avgScore < 40">
                  {{ stats.avgScore | number:'1.0-1' }}
                </div>
                <div class="text-muted small">Average DOME Score</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card text-center h-100">
              <div class="card-body">
                <div class="display-5 fw-bold text-info">{{ stats.byStatus['pending'] || 0 }}</div>
                <div class="text-muted small">Pending Review</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <!-- Score distribution -->
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header">Score Distribution</div>
              <div class="card-body">
                <div *ngFor="let bucket of stats.scoreDistribution" class="mb-2">
                  <div class="d-flex justify-content-between small mb-1">
                    <span>{{ bucket.range }}</span>
                    <span class="text-muted">{{ bucket.count }}</span>
                  </div>
                  <div class="progress" style="height: 12px">
                    <div class="progress-bar bg-primary"
                      [style.width.%]="stats.total ? (bucket.count / stats.total * 100) : 0">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top tags -->
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header">Top Tags</div>
              <div class="card-body">
                <div *ngFor="let t of stats.topTags" class="d-flex align-items-center mb-2">
                  <span class="badge bg-secondary me-2">{{ t.tag }}</span>
                  <div class="progress flex-grow-1 me-2" style="height: 10px">
                    <div class="progress-bar bg-secondary"
                      [style.width.%]="stats.topTags[0]?.count ? (t.count / stats.topTags[0].count * 100) : 0">
                    </div>
                  </div>
                  <small class="text-muted">{{ t.count }}</small>
                </div>
                <div *ngIf="stats.topTags.length === 0" class="text-muted small">No tags yet.</div>
              </div>
            </div>
          </div>

          <!-- Recent entries -->
          <div class="col-12">
            <div class="card">
              <div class="card-header">Recent Public Entries</div>
              <div class="list-group list-group-flush">
                <a *ngFor="let e of stats.recentEntries"
                  [routerLink]="['/entry', e.uuid]"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ e.title || '(untitled)' }}</strong>
                    <small class="text-muted ms-2">{{ e.created | date:'mediumDate' }}</small>
                  </div>
                  <span class="badge bg-primary rounded-pill">{{ e.score | number:'1.0-1' }}</span>
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<StatsData>('/api/registry/stats').subscribe({
      next: data => { this.stats = data; this.loading = false; },
      error: () => {
        // Build synthetic stats from search endpoint if /stats not yet available
        this.http.get<any>('/api/registry?limit=5').subscribe(res => {
          this.stats = {
            total: res.total ?? 0,
            public: res.total ?? 0,
            avgScore: 0,
            byStatus: {},
            scoreDistribution: [],
            topTags: [],
            recentEntries: (res.entries ?? []).map((e: any) => ({
              uuid: e.uuid,
              title: e.publication?.title,
              score: e.score,
              created: e.created,
            })),
          };
          this.loading = false;
        });
      },
    });
  }
}
