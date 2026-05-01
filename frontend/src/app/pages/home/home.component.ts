import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RegistryEntry } from '../../models/registry.models';

interface HomeStats {
  total: number;
  public: number;
  avgScore: number;
  byStatus?: Record<string, number>;
}

@Component({
  selector: 'app-home',
  template: `
    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <section class="home-hero d-flex flex-column align-items-center justify-content-center text-white text-center">
      <img src="assets/logo-white-static.svg" alt="DOME" class="logo-lg mb-3 fade-in">
      <h1 class="display-5 fw-bold mb-2 fade-in delay-1">DOME Registry</h1>
      <p class="lead mb-4 fade-in delay-2 hero-tagline">
        A structured database of annotations for published machine learning methods in biology.
        Transparent, reproducible, and FAIR.
      </p>

      <!-- Central search bar -->
      <div class="w-100 fade-in delay-3 hero-search-wrap">
        <div class="input-group input-group-lg shadow-lg">
          <input type="text" class="form-control border-0"
            placeholder="Search by title, authors, or keyword…"
            [formControl]="searchCtrl"
            (keydown.enter)="search()" />
          <button class="btn btn-secondary fw-semibold px-4" (click)="search()">
            <i class="bi bi-search me-1"></i>Search
          </button>
        </div>
        <p class="mt-2 mb-0 small hero-sub">
          or <a class="text-white fw-semibold" routerLink="/search">browse all entries →</a>
        </p>
      </div>
    </section>

    <div class="section-sep"></div>
    <!-- ── Stats strip ────────────────────────────────────────────────── -->
    <section class="bg-primary text-white py-3">
      <div class="container">
        <div class="row text-center g-0">
          <div class="col-4" style="border-right:1px solid rgba(255,255,255,.2)">
            <div class="fs-2 fw-bold text-white">{{ stats?.public ?? '–' }}</div>
            <div class="small text-uppercase stat-label" style="opacity:.7">Public Entries</div>
          </div>
          <div class="col-4" style="border-right:1px solid rgba(255,255,255,.2)">
            <div class="fs-2 fw-bold text-white">
              {{ stats ? (stats.total - stats.public) : '–' }}
            </div>
            <div class="small text-uppercase stat-label" style="opacity:.7">Private Entries</div>
          </div>
          <div class="col-4">
            <div class="fs-2 fw-bold text-white">{{ userCount ?? '–' }}</div>
            <div class="small text-uppercase stat-label" style="opacity:.7">Users</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Recently Added ─────────────────────────────────────────────── -->
    <section class="py-5 bg-light">
      <div class="container">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="h4 fw-bold mb-0">
            <i class="bi bi-clock-history text-secondary me-2"></i>Recently Added
          </h2>
          <a routerLink="/search" class="btn btn-sm btn-outline-primary">
            View all <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>

        <div *ngIf="loadingEntries" class="text-center py-4">
          <div class="spinner-border text-primary"></div>
        </div>

        <div *ngIf="!loadingEntries && recentEntries.length === 0" class="text-center text-muted py-4">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          No public entries yet. <a routerLink="/registry/new">Add the first one!</a>
        </div>

        <div *ngIf="!loadingEntries && recentEntries.length > 0" class="row g-3">
          <div *ngFor="let entry of recentEntries" class="col-md-6 col-lg-4">
            <a [routerLink]="['/registry', entry.uuid]"
               class="card h-100 text-decoration-none dome-entry-card">
              <div class="card-body d-flex flex-column p-3">
                <!-- Journal badge + score pill -->
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span *ngIf="entry.publication?.['journal']"
                    class="badge bg-light text-primary border small text-truncate journal-badge">
                    {{ entry.publication?.['journal'] }}
                  </span>
                  <span class="badge rounded-pill ms-auto flex-shrink-0"
                    [class.bg-success]="entry.score >= 75"
                    [class.bg-warning]="entry.score >= 40 && entry.score < 75"
                    [class.bg-danger]="entry.score < 40"
                    style="font-size:.82rem;min-width:2.8rem;text-align:center">
                    {{ entry.score | number:'1.0-1' }}
                  </span>
                </div>
                <!-- Title -->
                <h6 class="card-title fw-semibold text-dark mb-1 entry-title">
                  {{ truncate(entry.publication?.['title'], 90) }}
                </h6>
                <!-- Authors + year -->
                <p class="card-text text-muted small mb-0 mt-auto">
                  {{ truncate(entry.publication?.['authors'], 60) }}
                  <span *ngIf="entry.publication?.['year']"> · {{ entry.publication?.['year'] }}</span>
                </p>
                <!-- AI badge -->
                <div *ngIf="entry.isAiGenerated" class="mt-1">
                  <span class="badge ai-badge small">
                    <i class="bi bi-robot me-1"></i>AI-assisted
                  </span>
                </div>
                <!-- Tags -->
                <div class="mt-2" *ngIf="entry.tags?.length">
                  <span *ngFor="let tag of entry.tags?.slice(0, 3)"
                    class="badge bg-light border text-dark me-1 small">{{ tag }}</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA strip ──────────────────────────────────────────────────── -->
    <section class="py-5 bg-primary text-white text-center">
      <div class="container">
        <h2 class="h3 fw-bold mb-2">Add your paper to the registry</h2>
        <p class="mb-4 opacity-75">
          Manually fill in the DOME checklist, or use our AI Copilot to auto-fill from a PDF.
        </p>
        <div class="d-flex justify-content-center flex-wrap gap-3">
          <a routerLink="/registry/new" class="btn btn-light text-primary fw-semibold px-4">
            <i class="bi bi-pencil-square me-2"></i>Submit Manually
          </a>
          <a routerLink="/upload" class="btn btn-outline-light fw-semibold px-4">
            <i class="bi bi-robot me-2"></i>AI Import from PDF
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .home-hero {
      background: linear-gradient(135deg, #0D3144 0%, #003958 60%, #005580 100%);
      min-height: 400px;
      padding: 3.5rem 1rem 3rem;
    }
    .hero-tagline {
      max-width: 620px;
      opacity: .9;
    }
    .hero-search-wrap {
      max-width: 560px;
    }
    .hero-sub {
      opacity: .75;
    }

    .stat-label {
      letter-spacing: .04em;
      font-size: .7rem;
    }

    .dome-entry-card {
      border: 1px solid rgba(0, 0, 0, .08);
      transition: box-shadow .2s, transform .15s;
      color: inherit;
    }
    .dome-entry-card:hover {
      box-shadow: 0 6px 24px rgba(0, 57, 88, .14);
      transform: translateY(-3px);
      border-color: rgba(0, 57, 88, .18);
    }
    .journal-badge { max-width: 160px; }
    .entry-title { line-height: 1.4; }
    .ai-badge {
      background: linear-gradient(90deg, #7b2ff7, #2196f3);
      color: #fff;
    }
  `],
})
export class HomeComponent implements OnInit {
  searchCtrl = new FormControl('');
  stats: HomeStats | null = null;
  userCount: number | null = null;
  recentEntries: RegistryEntry[] = [];
  loadingEntries = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<HomeStats>('/api/registry/stats').subscribe({
      next: s => (this.stats = s),
      error: () => {},
    });
    this.http.get<{ count: number }>('/api/users/count').subscribe({
      next: r => (this.userCount = r.count),
      error: () => {},
    });
    this.http.get<{ items: RegistryEntry[]; total: number }>('/api/registry?limit=6').subscribe({
      next: res => {
        this.recentEntries = res.items ?? [];
        this.loadingEntries = false;
      },
      error: () => { this.loadingEntries = false; },
    });
  }

  search(): void {
    const q = (this.searchCtrl.value ?? '').trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { text: q } });
    } else {
      this.router.navigate(['/search']);
    }
  }

  truncate(s: unknown, max: number): string {
    const str = s == null ? '' : String(s);
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  }
}
