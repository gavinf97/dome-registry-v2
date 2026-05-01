import { Component } from '@angular/core';

@Component({
  selector: 'app-help',
  template: `
    <!-- Hero -->
    <section class="help-hero text-white py-5">
      <div class="container text-center py-3">
        <i class="bi bi-question-circle-fill fs-1 mb-3 d-block" style="opacity:.9"></i>
        <h1 class="display-6 fw-bold mb-2">Help &amp; Documentation</h1>
        <p class="lead mb-0" style="opacity:.85;max-width:600px;margin:0 auto">
          Learn how to use the DOME Registry — browse, submit, and annotate machine learning papers.
        </p>
      </div>
    </section>

    <!-- Page tabs: About | Help -->
    <div class="bg-white border-bottom sticky-top shadow-sm" style="top:0;z-index:100">
      <div class="container">
        <ul class="nav nav-tabs border-0 gap-1 py-1">
          <li class="nav-item">
            <a class="nav-link page-tab" routerLink="/about">
              <i class="bi bi-info-circle me-1"></i>About
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link page-tab active fw-semibold" routerLink="/help">
              <i class="bi bi-question-circle me-1"></i>Help
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- How to Use -->
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

    <div class="section-divider"></div>

    <!-- How to Submit -->
    <section id="how-to-submit" class="py-5">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Submitting to the Registry
        </div>
        <h2 class="h3 fw-bold mb-2">How to Submit an Entry</h2>
        <p class="text-muted mb-4" style="max-width:800px">
          The DOME Registry welcomes annotations for any published supervised machine learning
          method in biology or medicine. Submissions are community-driven — if you authored
          or reviewed a paper using ML, you can annotate it.
        </p>

        <div class="row g-3 mb-4">
          <div *ngFor="let step of submitSteps; let i = index" class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4">
                <div class="step-num mb-3">{{ i + 1 }}</div>
                <h6 class="fw-bold mb-2">{{ step.title }}</h6>
                <p class="text-muted small mb-0">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Copilot callout -->
        <div class="alert border-0 shadow-sm d-flex gap-3 align-items-start" style="background:linear-gradient(135deg,rgba(123,47,247,.07),rgba(33,150,243,.07));">
          <div class="ai-icon-sm flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
               style="width:3rem;height:3rem;background:linear-gradient(135deg,#7b2ff7,#2196f3);">
            <i class="bi bi-robot text-white"></i>
          </div>
          <div>
            <div class="fw-bold mb-1">Speed up annotation with the AI Copilot</div>
            <p class="text-muted small mb-2">
              Upload your paper PDF and the AI Copilot will automatically extract structured
              DOME annotations from the text. Review each suggested value before saving —
              AI-generated entries are clearly flagged so the community can verify them.
            </p>
            <a routerLink="/upload" class="btn btn-sm btn-primary">
              <i class="bi bi-robot me-1"></i>Try AI Import
            </a>
          </div>
        </div>
      </div>
    </section>

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
  `,
  styles: [`
    .help-hero {
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
    .step-num {
      width: 2rem; height: 2rem;
      background: #003958;
      color: #fff;
      font-weight: 700;
      font-size: .9rem;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
  `],
})
export class HelpComponent {
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

  submitSteps: Array<{ title: string; desc: string }> = [
    {
      title: 'Sign in with ORCID',
      desc: 'Create a free ORCID iD at orcid.org if you do not have one. ORCID is your persistent researcher identifier.',
    },
    {
      title: 'Start a new entry',
      desc: 'Click Submit in the navbar to open the schema-driven annotation form. Enter the paper DOI to pre-fill publication metadata.',
    },
    {
      title: 'Fill in the DOME fields',
      desc: 'Complete the four sections — Data, Optimization, Model, Evaluation. Fields marked REQUIREMENT carry the most weight toward the DOME score.',
    },
    {
      title: 'Or use AI Import',
      desc: 'Upload the paper PDF for AI-assisted pre-filling. The Copilot extracts annotations automatically. Always review and correct before saving.',
    },
    {
      title: 'Submit for review',
      desc: 'Once satisfied, submit the entry for moderation. It will enter a public peer review queue and be published after approval.',
    },
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
        + '<a href="https://doi.org/10.1038/s41592-021-01205-4" target="_blank">10.1038/s41592-021-01205-4</a>.',
    },
  ];
}
