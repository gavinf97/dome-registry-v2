import { Component } from '@angular/core';

@Component({
  selector: 'app-about-policies',
  template: `
    <section class="py-5">
      <div class="container" style="max-width:900px">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Usage &amp; Data
        </div>
        <h2 class="h3 fw-bold mb-2">Policies</h2>
        <p class="text-muted mb-5">
          This page outlines the key policies governing the use of the DOME Registry and its
          content, as well as how we handle user data.
        </p>

        <!-- Licensing -->
        <div class="mb-5">
          <h3 class="h5 fw-bold mb-3"><i class="bi bi-cc-circle text-secondary me-2"></i>Licensing</h3>
          <div class="card border-0 shadow-sm p-4 dome-section-card">
            <p class="text-muted mb-3">
              The content submitted to and displayed by the DOME Registry, representing the
              curated method descriptions, is made available under an open license to promote
              sharing and reuse.
            </p>
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="badge bg-success fs-6 px-3 py-2">CC BY 4.0</div>
              <div>
                <div class="fw-semibold">Creative Commons Attribution 4.0 International</div>
                <div class="text-muted small">Free to share and adapt for any purpose, with attribution.</div>
              </div>
            </div>
            <ul class="text-muted small mb-3 ps-3">
              <li>You are free to <strong>share</strong> — copy and redistribute the material in any medium or format.</li>
              <li>You are free to <strong>adapt</strong> — remix, transform, and build upon the material for any purpose, even commercially.</li>
              <li>You must give <strong>appropriate credit</strong> to the original creators and the DOME Registry and provide a link to the license.</li>
            </ul>
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener"
               class="btn btn-outline-primary btn-sm">
              <i class="bi bi-box-arrow-up-right me-1"></i>View CC BY 4.0 License
            </a>
          </div>
        </div>

        <div class="section-divider mb-5"></div>

        <!-- Privacy Policy -->
        <div>
          <h3 class="h5 fw-bold mb-3"><i class="bi bi-shield-check text-secondary me-2"></i>Privacy Policy</h3>
          <p class="text-muted mb-4">
            This privacy notice explains what personal data is collected when you interact with
            the DOME Registry, for what purposes, how it is processed, and how we keep it secure,
            in compliance with applicable data protection regulations (including GDPR).
          </p>

          <div class="accordion" id="privacyAccordion">
            <div *ngFor="let item of privacySections; let i = index" class="accordion-item border mb-2 rounded">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed rounded fw-semibold small" type="button"
                        [attr.data-bs-toggle]="'collapse'"
                        [attr.data-bs-target]="'#priv' + i"
                        aria-expanded="false">
                  {{ item.title }}
                </button>
              </h2>
              <div [id]="'priv' + i" class="accordion-collapse collapse">
                <div class="accordion-body text-muted small" [innerHTML]="item.body"></div>
              </div>
            </div>
          </div>

          <div class="alert alert-info mt-4 small">
            <i class="bi bi-info-circle me-2"></i>
            For privacy-related inquiries please contact
            <a href="mailto:contact&#64;dome-ml.org">contact&#64;dome-ml.org</a>.
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .section-divider { height: 3px; background: #F66729; }
    .dome-section-card { border-left: 4px solid #003958; }
  `],
})
export class AboutPoliciesComponent {
  privacySections = [
    {
      title: 'Who controls your personal data (data controller)?',
      body: `Professor Silvio Tosatto — University of Padua, Department of Biomedical Sciences.
             Viale G. Colombo 3, 35131 Padua, Italy.
             Email: <a href="mailto:contact&#64;dome-ml.org">contact&#64;dome-ml.org</a>`,
    },
    {
      title: 'What personal data is collected and why?',
      body: `<p>We collect your ORCID iD and optionally your display name and email address
             (retrieved via ORCID OAuth). This data is used to:</p>
             <ul>
               <li>Provide authenticated access to the submission and editing features</li>
               <li>Attribute submitted entries to the correct researcher</li>
               <li>Create anonymous usage statistics</li>
             </ul>`,
    },
    {
      title: 'What is our lawful basis for processing your personal data?',
      body: `Processing your personal data is necessary for our legitimate interest of allowing
             the day-to-day management, operation and functioning of DOME Registry.`,
    },
    {
      title: 'Who will have access to your personal data?',
      body: `The personal data will be disclosed only to authorized DOME Registry staff.`,
    },
    {
      title: 'Will your personal data be transferred to third countries?',
      body: `Personal data is transferred to Google Analytics (a service provider based outside
             the EU/EEA). There are no personal data transfers to international organisations.`,
    },
    {
      title: 'How long do we keep your personal data?',
      body: `Any personal data directly obtained from you will be retained as long as the service
             is live, even if you stop using the service. We will keep the personal data for the
             minimum amount of time possible to ensure legal compliance and to facilitate audits if
             they arise.`,
    },
    {
      title: 'Your rights regarding your personal data',
      body: `<p>You have the right to:</p>
             <ol>
               <li>Not be subject to decisions based solely on automated processing of data without your views being taken into consideration.</li>
               <li>Request information about personal data processed about you at reasonable intervals.</li>
               <li>Object at any time to the processing of your personal data.</li>
               <li>Request free-of-charge rectification or erasure of your personal data (where processing is not required for legal compliance or public interest purposes).</li>
             </ol>`,
    },
  ];
}
