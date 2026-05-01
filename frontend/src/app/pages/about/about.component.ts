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

    <!-- Quick-nav tabs -->
    <div class="bg-white border-bottom sticky-top shadow-sm" style="top:0;z-index:100">
      <div class="container">
        <ul class="nav nav-tabs border-0 gap-1 py-1">
          <li class="nav-item">
            <a class="nav-link about-tab" href="#what-is-dome">
              <i class="bi bi-question-circle me-1"></i>What is DOME?
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link about-tab" href="#how-to-use">
              <i class="bi bi-book me-1"></i>How to Use
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link about-tab" href="#faq">
              <i class="bi bi-patch-question me-1"></i>FAQ
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link about-tab" href="#contact">
              <i class="bi bi-envelope me-1"></i>Contact
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
              in the life sciences, published in <em>Bioinformatics</em> (2021).
            </p>
            <p class="text-muted mb-4">
              The DOME Registry is a structured database that captures DOME-compliant
              annotations for published ML papers. Each entry includes a DOME score reflecting
              how thoroughly a paper reports key methodological details.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a href="https://doi.org/10.1093/bioinformatics/btab661" target="_blank"
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

    <!-- Section divider -->
    <div class="section-divider"></div>

    <!-- How to use -->
    <section id="how-to-use" class="py-5 bg-light">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Getting Started
        </div>
        <h2 class="h3 fw-bold mb-4">How to Use the Registry</h2>
        <div class="row g-4">
          <div *ngFor="let step of steps; let i = index" class="col-md-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4">
                <div class="step-num mb-3">{{ i + 1 }}</div>
                <h6 class="fw-bold mb-2">{{ step.title }}</h6>
                <p class="text-muted small mb-3">{{ step.desc }}</p>
                <a *ngIf="step.route" [routerLink]="step.route"
                   class="btn btn-outline-primary btn-sm">
                  {{ step.cta }} <i class="bi bi-arrow-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DOME Score explainer -->
    <section class="py-5">
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

    <!-- Section divider -->
    <div class="section-divider"></div>

    <!-- FAQ -->
    <section id="faq" class="py-5 bg-light">
      <div class="container" style="max-width:800px">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          FAQ
        </div>
        <h2 class="h3 fw-bold mb-4">Frequently Asked Questions</h2>

        <div class="accordion" id="faqAccordion">
          <div *ngFor="let faq of faqs; let i = index" class="accordion-item border mb-2 rounded">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed rounded fw-semibold" type="button"
                      [attr.data-bs-toggle]="'collapse'"
                      [attr.data-bs-target]="'#faq' + i"
                      aria-expanded="false">
                {{ faq.q }}
              </button>
            </h2>
            <div [id]="'faq' + i" class="accordion-collapse collapse"
                 [attr.data-bs-parent]="'#faqAccordion'">
              <div class="accordion-body text-muted" [innerHTML]="faq.a"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI-Assisted entries explainer -->
    <section class="py-5">
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

    <!-- Section divider -->
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
          Questions, bug reports, and contributions are welcome via GitHub.
        </p>
        <div class="d-flex flex-wrap gap-3">
          <a href="https://github.com/BioComputingUP/dome-registry" target="_blank"
             rel="noopener" class="btn btn-dark">
            <i class="bi bi-github me-2"></i>GitHub Repository
          </a>
          <a href="https://dome-ml.org" target="_blank" rel="noopener"
             class="btn btn-outline-primary">
            <i class="bi bi-globe me-2"></i>dome-ml.org
          </a>
          <a href="https://doi.org/10.1093/bioinformatics/btab661" target="_blank"
             rel="noopener" class="btn btn-outline-secondary">
            <i class="bi bi-file-earmark-text me-2"></i>Cite DOME
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .about-hero {
      background: linear-gradient(135deg, #0D3144 0%, #003958 60%, #005580 100%);
    }
    .about-tab {
      color: #495057;
      border-radius: 6px;
      &:hover { color: #003958; background: rgba(0,57,88,.06); }
    }
    .section-divider {
      height: 3px;
      background: linear-gradient(90deg, #F66729 0%, rgba(246,103,41,.2) 100%);
    }
    .pillar-dot { width: 3.2rem; height: 3.2rem; }
    .dome-pillar-chip { transition: box-shadow .2s; }
    .dome-pillar-chip:hover { box-shadow: 0 6px 20px rgba(0,0,0,.1) !important; }
    .step-num {
      width: 2rem; height: 2rem;
      background: #003958;
      color: #fff;
      font-weight: 700;
      font-size: .9rem;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
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

  steps: Array<{ title: string; desc: string; route: string | null; cta: string }> = [
    {
      title: 'Browse the Registry',
      desc: 'Search and filter structured ML annotations by keyword, year, journal, and DOME compliance score.',
      route: '/search', cta: 'Browse Entries',
    },
    {
      title: 'Sign In with ORCID',
      desc: 'All submissions require an ORCID iD — used as your persistent researcher identifier throughout the registry.',
      route: null, cta: '',
    },
    {
      title: 'Submit a Paper',
      desc: 'Fill in the DOME annotation form manually for your published ML paper. All fields are guided with tooltips.',
      route: '/registry/new', cta: 'Submit Manually',
    },
    {
      title: 'Use AI Import',
      desc: 'Upload a PDF and our AI Copilot will auto-populate the DOME form. Review all suggestions before saving.',
      route: '/upload', cta: 'AI Import',
    },
  ];

  scoreBands = [
    { label: '≥ 75', color: '#198754', title: 'High compliance', desc: 'Comprehensive DOME reporting across all four pillars.' },
    { label: '40–75', color: '#fd7e14', title: 'Partial compliance', desc: 'Key fields present; some areas need improvement.' },
    { label: '< 40', color: '#dc3545', title: 'Low compliance', desc: 'Many required fields are missing or undocumented.' },
  ];

  faqs = [
    {
      q: 'Do I need an account to browse the registry?',
      a: 'No. All public entries are freely browsable without authentication.',
    },
    {
      q: 'How do I submit an entry?',
      a: 'Sign in with your ORCID iD, then use <strong>Submit</strong> to fill in the DOME annotation form, '
        + 'or <strong>AI Import</strong> to upload a PDF and let the Copilot pre-fill the form for you.',
    },
    {
      q: 'What is the AI Copilot and can I trust its output?',
      a: 'The AI Copilot uses a large language model to extract structured information from a PDF. '
        + 'It is provided as a time-saving tool, not an authoritative source. Always review and verify '
        + 'every field before publishing an entry.',
    },
    {
      q: 'How is the DOME score calculated?',
      a: 'Each schema field has a compliance weight (REQUIREMENT = 1.0 pt, RECOMMENDATION = 0.5 pt). '
        + 'The score is the percentage of filled-in weighted fields vs. the theoretical maximum.',
    },
    {
      q: 'Can I edit an entry after submitting it?',
      a: 'Yes. Every edit creates an immutable version snapshot for provenance. Only the original '
        + 'submitter or an admin may edit an entry.',
    },
    {
      q: 'What happens after I submit an entry?',
      a: 'Entries start in <em>draft</em> state and must be submitted for review. Moderation moves entries '
        + 'through <em>draft → pending → public</em>. Entries assigned to a journal pass through an '
        + 'additional journal-owner review step.',
    },
    {
      q: 'How do I cite the DOME Registry?',
      a: 'Please cite: <em>Walsh I et al., "DOME: recommendations for supervised machine learning validation '
        + 'in biology", Nature Methods (2021)</em>. DOI: '
        + '<a href="https://doi.org/10.1093/bioinformatics/btab661" target="_blank">10.1093/bioinformatics/btab661</a>.',
    },
  ];
}
