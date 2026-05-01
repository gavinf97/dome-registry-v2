import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-about',
  template: `
    <!-- Hero -->
    <section class="about-hero text-white py-5">
      <div class="container text-center py-3">
        <i class="bi bi-info-circle-fill fs-1 mb-3 d-block" style="opacity:.9"></i>
        <h1 class="display-6 fw-bold mb-2">About the DOME Registry</h1>
        <p class="lead mb-0" style="opacity:.85;max-width:600px;margin:0 auto">
          A community resource for structured, transparent annotation of machine learning
          methods in the life sciences.
        </p>
      </div>
    </section>

    <!-- Page tabs: About | Help -->
    <div class="bg-white border-bottom sticky-top shadow-sm" style="top:0;z-index:100">
      <div class="container">
        <ul class="nav nav-tabs border-0 gap-1 py-1">
          <li class="nav-item">
            <a class="nav-link page-tab active fw-semibold" routerLink="/about">
              <i class="bi bi-info-circle me-1"></i>About
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link page-tab" routerLink="/help">
              <i class="bi bi-question-circle me-1"></i>Help
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- What is DOME -->
    <section id="what-is-dome" class="py-5">
      <div class="container">
        <div class="row align-items-center g-5">
          <div class="col-lg-6">
            <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
              Background
            </div>
            <h2 class="h3 fw-bold mb-3">What is the DOME Checklist?</h2>
            <p class="text-muted mb-3">
              DOME stands for <strong>D</strong>ata, <strong>O</strong>ptimization,
              <strong>M</strong>odel, and <strong>E</strong>valuation. It is a
              peer-reviewed set of recommendations for reporting machine learning methods
              in the life sciences, published in <em>Nature Methods</em> (2021).
            </p>
            <p class="text-muted mb-4">
              The DOME Registry is a structured database that captures DOME-compliant
              annotations for published ML papers. Each entry includes a DOME score reflecting
              how thoroughly a paper reports key methodological details.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a href="https://doi.org/10.1038/s41592-021-01205-4" target="_blank"
                 rel="noopener" class="btn btn-primary btn-sm">
                <i class="bi bi-file-earmark-text me-1"></i>Read the Paper
              </a>
              <a href="https://dome-ml.org/guidelines" target="_blank"
                 rel="noopener" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-list-check me-1"></i>DOME Guidelines
              </a>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="row g-3">
              <div *ngFor="let p of pillars" class="col-6">
                <div class="card border-0 shadow-sm h-100 dome-pillar-chip">
                  <div class="card-body p-3 text-center">
                    <div class="pillar-dot mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
                         [style.background]="p.bg">
                      <i [class]="'bi ' + p.icon + ' fs-4'" [style.color]="p.color"></i>
                    </div>
                    <div class="fw-bold small" [style.color]="p.color">{{ p.label }}</div>
                    <p class="text-muted" style="font-size:.75rem;margin:0">{{ p.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <!-- DOME Score explainer -->
    <section id="scoring" class="py-5 bg-light">
      <div class="container">
        <div class="row align-items-center g-5">
          <div class="col-lg-6">
            <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
              Scoring
            </div>
            <h2 class="h3 fw-bold mb-3">How is the DOME Score calculated?</h2>
            <p class="text-muted mb-3">
              Each entry is scored against the DOME schema fields. Fields marked as
              <span class="badge badge-requirement">REQUIREMENT</span> carry full weight (1.0 pt),
              while <span class="badge badge-recommendation">RECOMMENDATION</span> fields
              contribute 0.5 pt. The score is expressed as a percentage of the maximum
              achievable points.
            </p>
            <p class="text-muted mb-0">
              Scores update in real time as you fill in the form. Hover over any field badge
              to see its weight.
            </p>
          </div>
          <div class="col-lg-6">
            <div class="score-legend">
              <div *ngFor="let band of scoreBands" class="d-flex align-items-center gap-3 mb-3">
                <div class="score-chip fw-bold text-white text-center rounded"
                     [style.background]="band.color">{{ band.label }}</div>
                <div>
                  <div class="fw-semibold small">{{ band.title }}</div>
                  <div class="text-muted small">{{ band.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <!-- AI-Assisted entries explainer -->
    <section id="ai-entries" class="py-5">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-2 text-center">
            <div class="ai-icon-wrap mx-auto d-flex align-items-center justify-content-center rounded-circle">
              <i class="bi bi-robot fs-1 text-white"></i>
            </div>
          </div>
          <div class="col-lg-10">
            <h4 class="fw-bold mb-2">AI-Assisted Entries</h4>
            <p class="text-muted mb-2">
              Entries marked with the <strong class="text-purple">AI-assisted</strong> badge were
              pre-filled using the DOME AI Copilot, which leverages an LLM to extract structured
              annotations from a PDF automatically.
            </p>
            <p class="text-muted mb-0">
              AI-generated content may contain errors. All AI-assisted entries should be
              independently verified by a human expert before being considered authoritative.
              The badge persists until removed by a registry editor.
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <!-- DOME Recommendations -->
    <section id="dome-recommendations" class="py-5 bg-light">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          The DOME Checklist
        </div>
        <h2 class="h3 fw-bold mb-2">DOME Recommendations for ML in Biology</h2>
        <p class="text-muted mb-4" style="max-width:800px">
          Machine learning is increasingly used to make predictions in biology and medicine.
          However, benchmarking and comparative assessment of ML methods is often difficult
          due to inconsistent reporting of key methodological details. DOME was created to
          address this challenge.
        </p>
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 p-3 dome-section-card">
              <div class="fw-bold mb-2"><i class="bi bi-exclamation-circle text-secondary me-2"></i>The Challenge</div>
              <p class="text-muted small mb-0">
                The lack of standardised reporting makes it impossible to objectively assess
                ML methods and reproduce published results. Benchmarking is hindered by
                inconsistent reporting of training data, model configuration, and evaluation
                methodology across publications.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 p-3 dome-section-card">
              <div class="fw-bold mb-2"><i class="bi bi-lightbulb text-secondary me-2"></i>The Solution</div>
              <p class="text-muted small mb-0">
                DOME provides a minimal set of community-agreed, peer-reviewed recommendations
                covering the four key aspects of any supervised ML method: Data, Optimization,
                Model, and Evaluation. Authors are encouraged to report these items with their
                publications.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 p-3 dome-section-card">
              <div class="fw-bold mb-2"><i class="bi bi-check2-all text-secondary me-2"></i>Key Principles</div>
              <ul class="text-muted small mb-0 ps-3">
                <li>Clearly document dataset provenance, splits and redundancy control</li>
                <li>Report the full optimisation procedure and hyperparameter selection</li>
                <li>Describe model architecture, interpretability, and software availability</li>
                <li>Use representative performance metrics with confidence intervals</li>
                <li>Compare against established baselines using the same data</li>
              </ul>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 p-3 dome-section-card">
              <div class="fw-bold mb-2"><i class="bi bi-award text-secondary me-2"></i>The Goal</div>
              <p class="text-muted small mb-0">
                DOME strives for FAIR ML — Findable, Accessible, Interoperable, and Reusable
                machine learning methods. By following DOME, authors make it easier for the
                community to reproduce, compare, and build upon published methods, ultimately
                accelerating scientific progress.
              </p>
            </div>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a href="https://dome-ml.org/guidelines" target="_blank" rel="noopener"
             class="btn btn-primary btn-sm">
            <i class="bi bi-list-check me-1"></i>Full DOME Guidelines
          </a>
          <a href="https://doi.org/10.1038/s41592-021-01205-4" target="_blank" rel="noopener"
             class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-file-earmark-text me-1"></i>Walsh et al., Nature Methods 2021
          </a>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <!-- Citing DOME -->
    <section id="cite" class="py-5">
      <div class="container" style="max-width:900px">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Citations
        </div>
        <h2 class="h3 fw-bold mb-4">Citing DOME</h2>
        <p class="text-muted mb-4">
          If you use the DOME Registry or the DOME recommendations in your work, please cite
          the appropriate publications below.
        </p>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body p-4">
            <div class="d-flex gap-3">
              <div class="flex-shrink-0 text-secondary text-center" style="width:2.5rem;">
                <i class="bi bi-file-earmark-text fs-3"></i>
              </div>
              <div>
                <div class="fw-semibold mb-1">DOME Recommendations (original paper)</div>
                <p class="text-muted small mb-2">
                  Walsh I, Fishman D, Garcia-Gasulla D, Titma T, Pollastri G; ELIXIR Machine
                  Learning Focus Group; Harrow J, Psomopoulos FE, Tosatto SCE.
                  <em>DOME: recommendations for supervised machine learning validation in biology.</em>
                  <strong>Nature Methods</strong>, 2021; 18(10):1122–1127.
                </p>
                <a href="https://doi.org/10.1038/s41592-021-01205-4" target="_blank" rel="noopener"
                   class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-box-arrow-up-right me-1"></i>DOI: 10.1038/s41592-021-01205-4
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body p-4">
            <div class="d-flex gap-3">
              <div class="flex-shrink-0 text-secondary text-center" style="width:2.5rem;">
                <i class="bi bi-file-earmark-text fs-3"></i>
              </div>
              <div>
                <div class="fw-semibold mb-1">DOME Registry</div>
                <p class="text-muted small mb-2">
                  Attafi IM, Minervini G, Farrell G, Longhi S, Tosatto SCE.
                  <em>DOME Registry: a community resource for structured ML annotations in biology.</em>
                  <strong>GigaScience</strong>, 2024; 13: giae094.
                </p>
                <a href="https://doi.org/10.1093/gigascience/giae094" target="_blank" rel="noopener"
                   class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-box-arrow-up-right me-1"></i>DOI: 10.1093/gigascience/giae094
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <div class="d-flex gap-3">
              <div class="flex-shrink-0 text-secondary text-center" style="width:2.5rem;">
                <i class="bi bi-bookmark fs-3"></i>
              </div>
              <div>
                <div class="fw-semibold mb-1">Citing a specific registry entry</div>
                <p class="text-muted small mb-2">
                  Each entry has a permanent URL. To cite a specific entry, use the entry's
                  UUID URL together with the registry citation above:
                </p>
                <code class="d-block bg-light border rounded p-2 small">
                  DOME Registry entry: https://registry.dome-ml.org/registry/&lt;uuid&gt;
                  — Attafi et al., GigaScience 2024 (DOI 10.1093/gigascience/giae094).
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <!-- Contact -->
    <section id="contact" class="py-5 bg-light">
      <div class="container" style="max-width:700px">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Get in Touch
        </div>
        <h2 class="h3 fw-bold mb-3">Contact &amp; Contributing</h2>
        <p class="text-muted mb-4">
          The DOME Registry is developed and maintained by BioComputingUP at the University of Padua.
          Questions, bug reports, and contributions are welcome via GitHub or email.
        </p>
        <div class="d-flex flex-wrap gap-3">
          <a href="https://github.com/BioComputingUP/dome-registry" target="_blank"
             rel="noopener" class="btn btn-dark">
            <i class="bi bi-github me-2"></i>GitHub Repository
          </a>
          <a href="mailto:contact&#64;dome-ml.org" class="btn btn-outline-primary">
            <i class="bi bi-envelope me-2"></i>contact&#64;dome-ml.org
          </a>
          <a href="https://dome-ml.org" target="_blank" rel="noopener"
             class="btn btn-outline-secondary">
            <i class="bi bi-globe me-2"></i>dome-ml.org
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .about-hero {
      background: linear-gradient(135deg, #0D3144 0%, #003958 60%, #005580 100%);
    }
    .page-tab {
      color: #495057;
      border-radius: 6px;
      &:hover { color: #003958; background: rgba(0,57,88,.06); }
      &.active { color: #003958; background: rgba(0,57,88,.08); font-weight: 600; }
    }
    .section-divider {
      height: 3px;
      background: linear-gradient(90deg, #F66729 0%, rgba(246,103,41,.2) 100%);
    }
    .pillar-dot { width: 3.2rem; height: 3.2rem; }
    .dome-pillar-chip { transition: box-shadow .2s; }
    .dome-pillar-chip:hover { box-shadow: 0 6px 20px rgba(0,0,0,.1) !important; }
    .score-chip {
      width: 4.5rem; height: 2.5rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem;
    }
    .ai-icon-wrap {
      width: 5rem; height: 5rem;
      background: linear-gradient(135deg, #7b2ff7, #2196f3);
    }
    .text-purple { color: #7b2ff7; }
  `],
})
export class AboutComponent {
  constructor(public auth: AuthService) {}

  pillars = [
    { label: 'Data', icon: 'bi-database', color: '#003958', bg: 'rgba(0,57,88,.1)',
      desc: 'Provenance, splits, redundancy &amp; availability' },
    { label: 'Optimization', icon: 'bi-gear-wide-connected', color: '#0077aa', bg: 'rgba(0,119,170,.1)',
      desc: 'Algorithm, encoding, feature selection' },
    { label: 'Model', icon: 'bi-cpu', color: '#F66729', bg: 'rgba(246,103,41,.1)',
      desc: 'Architecture, interpretability, software' },
    { label: 'Evaluation', icon: 'bi-bar-chart-line', color: '#2a9d8f', bg: 'rgba(42,157,143,.1)',
      desc: 'Metrics, comparisons, confidence intervals' },
  ];

  scoreBands = [
    { label: '≥ 75', color: '#198754', title: 'High compliance', desc: 'Comprehensive DOME reporting across all four pillars.' },
    { label: '40–75', color: '#fd7e14', title: 'Partial compliance', desc: 'Key fields present; some areas need improvement.' },
    { label: '< 40', color: '#dc3545', title: 'Low compliance', desc: 'Many required fields are missing or undocumented.' },
  ];
}
