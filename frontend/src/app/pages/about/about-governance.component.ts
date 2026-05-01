import { Component } from '@angular/core';

@Component({
  selector: 'app-about-governance',
  template: `
    <section class="py-5">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Structure &amp; Oversight
        </div>
        <h2 class="h3 fw-bold mb-2">Governance</h2>
        <p class="text-muted mb-5" style="max-width:800px">
          DOME's development is guided by a transparent governance model integrating advice from
          a formal Scientific Advisory Board, continuous input from key ELIXIR groups, and feedback
          from publishers, industry, and ML experts.
        </p>

        <!-- SAB -->
        <div class="mb-5">
          <h3 class="h5 fw-bold mb-1">Scientific Advisory Board (SAB)</h3>
          <p class="text-muted small mb-4">
            The DOME SAB consists of internationally recognized external experts who provide
            independent strategic advice and critical evaluation, ensuring DOME remains aligned
            with evolving community needs and best practices.
          </p>
          <div class="row g-4">
            <div *ngFor="let m of sabMembers" class="col-md-4">
              <div class="card border-0 shadow-sm h-100 text-center p-4">
                <div class="mb-3">
                  <div class="sab-avatar mx-auto d-flex align-items-center justify-content-center rounded-circle"
                       style="width:4rem;height:4rem;background:rgba(0,57,88,.1)">
                    <i class="bi bi-person fs-3 text-primary"></i>
                  </div>
                </div>
                <div class="fw-bold mb-1">{{ m.name }}</div>
                <div class="text-muted small mb-1">{{ m.affiliation }}</div>
                <div class="badge bg-light text-secondary border small mb-2">{{ m.expertise }}</div>
                <div>
                  <a [href]="m.orcid" target="_blank" rel="noopener"
                     class="btn btn-outline-secondary btn-sm">
                    <img src="assets/orcid.svg" alt="ORCID" style="height:.9rem;opacity:.7"> ORCID
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-divider mb-5"></div>

        <!-- ELIXIR groups -->
        <div class="row g-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 dome-section-card p-4">
              <div class="d-flex align-items-start gap-3">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded"
                     style="width:3rem;height:3rem;background:rgba(0,57,88,.07)">
                  <i class="bi bi-cpu fs-5 text-primary"></i>
                </div>
                <div>
                  <div class="fw-bold mb-1">ELIXIR AI Ecosystem Focus Group</div>
                  <p class="text-muted small mb-2">
                    The primary source of scientific AI/ML expertise and community feedback. DOME
                    originated from this group's prior efforts in the ELIXIR Machine Learning Focus
                    Group to address ML reporting challenges in life sciences.
                  </p>
                  <p class="text-muted small mb-2">
                    Provides crucial input on the practical needs of researchers applying AI/ML,
                    ensuring DOME features remain relevant to scientific practice.
                  </p>
                  <a href="https://elixir-europe.org/focus-groups/machine-learning" target="_blank"
                     rel="noopener" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100 dome-section-card p-4">
              <div class="d-flex align-items-start gap-3">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded"
                     style="width:3rem;height:3rem;background:rgba(0,57,88,.07)">
                  <i class="bi bi-database fs-5 text-primary"></i>
                </div>
                <div>
                  <div class="fw-bold mb-1">ELIXIR Data Platform</div>
                  <p class="text-muted small mb-2">
                    Provides strategic context and guidance related to data infrastructure best
                    practices within ELIXIR, focusing on FAIR principles, sustainability, and
                    interoperability.
                  </p>
                  <p class="text-muted small mb-2">
                    Input from the Platform helps ensure the DOME Registry adheres to robust
                    technical standards using recommended interoperability solutions such as
                    Bioschemas and Identifiers.org.
                  </p>
                  <a href="https://elixir-europe.org/platforms/data" target="_blank"
                     rel="noopener" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Learn More
                  </a>
                </div>
              </div>
            </div>
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
export class AboutGovernanceComponent {
  sabMembers = [
    {
      name: 'Sirarat Sarntivijai',
      affiliation: 'Boehringer Ingelheim',
      expertise: 'Industry & Interoperability',
      orcid: 'https://orcid.org/0000-0002-2548-641X',
    },
    {
      name: 'Daniel Garijo',
      affiliation: 'Universidad Politécnica de Madrid',
      expertise: 'Academia, AI & Ontologies',
      orcid: 'https://orcid.org/0000-0003-0454-7145',
    },
    {
      name: 'Chris Hunter',
      affiliation: 'GigaScience & GigaDB',
      expertise: 'Publishing & Open Science',
      orcid: 'https://orcid.org/0000-0002-1335-0881',
    },
  ];
}
