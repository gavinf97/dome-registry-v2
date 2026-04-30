import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RegistryEntry } from '../../models/registry.models';

interface HomeStats {
  total: number;
  public: number;
  avgScore: number;
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

    <!-- ── Stats strip ────────────────────────────────────────────────── -->
    <section class="bg-white border-bottom py-3">
      <div class="container">
        <div class="row text-center g-0">
          <div class="col-4 border-end">
            <div class="fs-2 fw-bold text-primary">{{ stats?.public ?? '–' }}</div>
            <div class="small text-muted text-uppercase stat-label">Public Entries</div>
          </div>
          <div class="col-4 border-end">
            <div class="fs-2 fw-bold text-primary">
              {{ stats ? (stats.avgScore | number:'1.0-1') : '–' }}
            </div>
            <div class="small text-muted text-uppercase stat-label">Avg. DOME Score</div>
          </div>
          <div class="col-4">
            <div class="fs-2 fw-bold text-primary">4</div>
            <div class="small text-muted text-uppercase stat-label">DOME Pillars</div>
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

    <!-- ── DOME 4 Pillars ─────────────────────────────────────────────── -->
    <section class="py-5">
      <div class="container">
        <h2 class="h4 fw-bold text-center mb-1">The DOME Framework</h2>
        <p class="text-muted text-center mb-5 pillar-subtitle">
          Four pillars of transparency for machine learning in the life sciences.
          Every registry entry is scored against these criteria.
        </p>
        <div class="row g-4">
          <div *ngFor="let p of pillars" class="col-sm-6 col-lg-3">
            <div class="card h-100 border-0 shadow-sm dome-pillar-card">
              <div class="card-body text-center p-4">
                <div class="pillar-icon mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle"
                  [style.background]="p.bg">
                  <i [class]="'bi ' + p.icon + ' fs-3'" [style.color]="p.color"></i>
                </div>
                <h5 class="fw-bold" [style.color]="p.color">{{ p.label }}</h5>
                <p class="text-muted small mb-0">{{ p.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── About / What is DOME? ──────────────────────────────────────── -->
    <section class="py-5 bg-light" id="about">
      <div class="container">
        <div class="row align-items-center g-5">
          <div class="col-lg-6">
            <h2 class="h3 fw-bold mb-3">What is the DOME Registry?</h2>
            <p class="text-muted mb-3">
              The DOME Registry is a community resource for structured annotations of machine
              learning papers in biology. It implements the
              <a href="https://dome-ml.org/guidelines" target="_blank" rel="noopener">
                DOME Recommendations</a> — a peer-reviewed checklist covering
              <strong>D</strong>ata, <strong>O</strong>ptimization, <strong>M</strong>odel,
              and <strong>E</strong>valuation.
            </p>
            <p class="text-muted mb-4">
              Each annotation captures how a published model was trained, evaluated, and released,
              making it easier to compare methods, reproduce results, and assess compliance with
              FAIR principles.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a routerLink="/search" class="btn btn-primary">
                <i class="bi bi-grid me-1"></i>Browse Entries
              </a>
              <a href="https://dome-ml.org/guidelines" target="_blank" rel="noopener"
                class="btn btn-outline-primary">
                <i class="bi bi-book me-1"></i>DOME Guidelines
              </a>
              <a href="https://doi.org/10.1093/bioinformatics/btab661" target="_blank" rel="noopener"
                class="btn btn-outline-secondary btn-sm align-self-center">
                <i class="bi bi-file-text me-1"></i>Key Publication
              </a>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="row g-3">
              <div *ngFor="let f of features" class="col-sm-6">
                <div class="d-flex gap-3 align-items-start">
                  <div class="flex-shrink-0 feature-icon-wrap d-flex align-items-center justify-content-center rounded-circle">
                    <i [class]="'bi ' + f.icon + ' text-primary'"></i>
                  </div>
                  <div>
                    <div class="fw-semibold small">{{ f.label }}</div>
                    <div class="text-muted feature-desc">{{ f.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA strip ──────────────────────────────────────────────────── -->
    <section class="py-5 bg-primary bg-gradient text-white text-center">
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

    .pillar-icon { width: 4rem; height: 4rem; }
    .pillar-subtitle { max-width: 560px; margin: 0 auto; }

    .dome-pillar-card {
      transition: box-shadow .2s, transform .15s;
    }
    .dome-pillar-card:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, .1);
      transform: translateY(-3px);
    }

    .feature-icon-wrap {
      width: 2.5rem;
      height: 2.5rem;
      background: rgba(0, 57, 88, .09);
      flex-shrink: 0;
    }
    .feature-desc { font-size: .78rem; }
  `],
})
export class HomeComponent implements OnInit {
  searchCtrl = new FormControl('');
  stats: HomeStats | null = null;
  recentEntries: RegistryEntry[] = [];
  loadingEntries = true;

  pillars = [
    {
      label: 'Data',
      icon: 'bi-database',
      color: '#003958',
      bg: 'rgba(0,57,88,.1)',
      desc: 'Dataset provenance, splits, redundancy controls, and public availability.',
    },
    {
      label: 'Optimization',
      icon: 'bi-gear-wide-connected',
      color: '#0077aa',
      bg: 'rgba(0,119,170,.1)',
      desc: 'Algorithm selection, hyperparameter tuning, feature engineering, and regularization.',
    },
    {
      label: 'Model',
      icon: 'bi-cpu',
      color: '#F66729',
      bg: 'rgba(246,103,41,.1)',
      desc: 'Architecture, interpretability, output type, and software availability.',
    },
    {
      label: 'Evaluation',
      icon: 'bi-bar-chart-line',
      color: '#2a9d8f',
      bg: 'rgba(42,157,143,.1)',
      desc: 'Validation methodology, performance metrics, comparisons, and confidence intervals.',
    },
  ];

  features = [
    { icon: 'bi-shield-check', label: 'FAIR Compliance', desc: 'Structured metadata aligned with FAIR data principles' },
    { icon: 'bi-robot', label: 'AI Copilot', desc: 'Auto-fill annotations from a PDF using LLM assistance' },
    { icon: 'bi-graph-up', label: 'DOME Score', desc: 'Per-entry compliance score against requirement weights' },
    { icon: 'bi-person-badge', label: 'ORCID Auth', desc: 'Authenticate with your ORCID iD; provenance tracked per edit' },
    { icon: 'bi-journal-text', label: 'Version History', desc: 'Every edit creates an immutable provenance snapshot' },
    { icon: 'bi-search', label: 'Full-text Search', desc: 'Search and filter across all public registry entries' },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<HomeStats>('/api/registry/stats').subscribe({
      next: s => (this.stats = s),
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
