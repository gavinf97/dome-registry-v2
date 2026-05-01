import { Component } from '@angular/core';

@Component({
  selector: 'app-about-team',
  template: `
    <section class="py-5">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          The People Behind DOME
        </div>
        <h2 class="h3 fw-bold mb-2">Our Team</h2>
        <p class="text-muted mb-5" style="max-width:800px">
          The DOME Registry is developed and maintained by a collaborative team of researchers, software engineers, and community managers dedicated to advancing FAIR machine learning in the life sciences.
        </p>

        <!-- Project Leadership -->
        <div class="mb-5">
          <h3 class="h5 fw-bold mb-4">Project Leadership</h3>
          <div class="row g-4">
            <div *ngFor="let m of leadership" class="col-md-4">
              <div class="card border shadow-sm h-100 text-center p-4 d-flex flex-column">
                <div class="mb-3">
                  <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
                       style="width:5rem;height:5rem;background:rgba(0,57,88,.1)">
                    <img *ngIf="m.img" [src]="m.img" [alt]="m.name" style="width:100%;height:100%;object-fit:cover">
                    <i *ngIf="!m.img" class="bi bi-person fs-3 text-primary"></i>
                  </div>
                </div>
                <div class="fw-bold mb-1">{{ m.name }}</div>
                <div class="text-muted small mb-2">{{ m.affiliation }}</div>
                <div class="mb-3">
                  <span class="badge rounded-pill px-3 py-2" 
                        style="background:rgba(0,57,88,.08);color:#003958;font-weight:600;font-size:0.75rem;">
                    {{ m.role }}
                  </span>
                </div>
                <div class="mt-auto d-flex gap-2 justify-content-center flex-wrap">
                  <a *ngIf="m.orcid" [href]="m.orcid" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="ORCID">
                    <img src="assets/orcid.svg" alt="ORCID" style="height:1.1rem;display:block">
                  </a>
                  <a *ngIf="m.github" [href]="m.github" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="GitHub">
                    <i class="bi bi-github"></i>
                  </a>
                  <a *ngIf="m.linkedin" [href]="m.linkedin" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="LinkedIn">
                    <i class="bi bi-linkedin" style="color:#0a66c2"></i>
                  </a>
                  <a *ngIf="m.website" [href]="m.website" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="Website">
                    <i class="bi bi-globe"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-divider mb-5"></div>

        <!-- Development Team -->
        <div class="mb-5">
          <h3 class="h5 fw-bold mb-4">Development Team</h3>
          <p class="text-muted small mb-4" style="max-width:800px">
            This team is responsible for the technical design, implementation, maintenance, and ongoing development of the DOME Registry platform, the DOME Wizard, and associated infrastructure.
          </p>
          <div class="row g-4">
            <div *ngFor="let m of developers" class="col-md-4">
              <div class="card border shadow-sm h-100 text-center p-4 d-flex flex-column">
                <div class="mb-3">
                  <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
                       style="width:5rem;height:5rem;background:rgba(0,57,88,.1)">
                    <img *ngIf="m.img" [src]="m.img" [alt]="m.name" style="width:100%;height:100%;object-fit:cover">
                    <i *ngIf="!m.img" class="bi bi-person fs-3 text-primary"></i>
                  </div>
                </div>
                <div class="fw-bold mb-1">{{ m.name }}</div>
                <div class="text-muted small mb-2">{{ m.affiliation }}</div>
                <div class="mb-3">
                  <span class="badge rounded-pill px-3 py-2" 
                        style="background:rgba(0,57,88,.08);color:#003958;font-weight:600;font-size:0.75rem;">
                    {{ m.role }}
                  </span>
                </div>
                <div class="mt-auto d-flex gap-2 justify-content-center flex-wrap">
                  <a *ngIf="m.orcid" [href]="m.orcid" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="ORCID">
                    <img src="assets/orcid.svg" alt="ORCID" style="height:1.1rem;display:block">
                  </a>
                  <a *ngIf="m.github" [href]="m.github" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="GitHub">
                    <i class="bi bi-github"></i>
                  </a>
                  <a *ngIf="m.linkedin" [href]="m.linkedin" target="_blank" rel="noopener"
                     class="btn btn-light border btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                     style="height:32px;" title="LinkedIn">
                    <i class="bi bi-linkedin" style="color:#0a66c2"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-divider mb-5"></div>

        <!-- Past Contributors -->
        <div class="mb-5">
          <h3 class="h5 fw-bold mb-4">Past Members &amp; Contributors</h3>
          <p class="text-muted small mb-4" style="max-width:800px">
            We gratefully acknowledge the valuable contributions of former team members who have helped shape and build DOME during previous phases of the project.
          </p>
          <div class="row g-4">
            <div *ngFor="let m of pastMembers" class="col-md-6">
              <div class="card border-0 bg-light h-100 p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div class="fw-bold">{{ m.name }}</div>
                  <div *ngIf="m.period" class="badge bg-secondary opacity-75 small">{{ m.period }}</div>
                </div>
                <div class="text-muted small mb-1">{{ m.role }}</div>
                <div class="text-muted small">{{ m.affiliation }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .section-divider { height: 3px; background: #F66729; }
  `],
})
export class AboutTeamComponent {
  leadership: any[] = [
    {
      name: 'Silvio Tosatto',
      role: 'Lead PI',
      affiliation: 'University of Padova',
      orcid: 'https://orcid.org/0000-0003-4525-3793',
      img: 'assets/Silvio-Tosatto.png',
      website: 'https://protein.bio.unipd.it/'
    },
    {
      name: 'Fotis Psomopoulos',
      role: 'Lead PI',
      affiliation: 'CERTH | INAB',
      orcid: 'https://orcid.org/0000-0002-0222-4273',
      img: 'assets/fotis.jpeg',
      website: 'https://biodataanalysisgroup.github.io/team/'
    },
    {
      name: 'Álvaro López García',
      role: 'DOME Copilot Co-PI',
      affiliation: 'CSIC',
      orcid: 'https://orcid.org/0000-0002-0013-4602',
      img: 'assets/Alvaro-Lopez-Garcia.png',
      website: 'https://www.esfri.eu/alvaro-lopez-garcia'
    }
  ];

  developers: any[] = [
    {
      name: 'Omar A Attafi',
      role: 'Lead Developer & PhD Researcher',
      affiliation: 'University of Padova',
      orcid: 'https://orcid.org/0009-0002-2327-9430',
      github: 'https://github.com/Abdelghaniomar',
      linkedin: 'https://www.linkedin.com/in/omar-abdelghani-attafi-3509a319a',
      img: 'assets/omar.png'
    },

    {
      name: 'Gavin Farrell',
      role: 'Scaling Curation & PhD Researcher',
      affiliation: 'University of Padova',
      orcid: 'https://orcid.org/0000-0001-5166-8551',
      github: 'https://github.com/gavinf97',
      linkedin: 'https://www.linkedin.com/in/gavin-farrell97/',
      img: 'assets/gavin.jpeg'
    },
    {
      name: 'Ivan Mičetić',
      role: 'Lab Services Manager',
      affiliation: 'University of Padova',
      orcid: 'https://orcid.org/0000-0003-1691-8425',
      github: 'https://github.com/ivanmicetic',
      img: 'assets/ivan.jpeg'
    },
    {
      name: 'Ignacio Heredia',
      role: 'DOME Copilot Developer',
      affiliation: 'CSIC',
      orcid: 'https://orcid.org/0000-0001-6317-7100',
      github: 'https://github.com/IgnacioHeredia'
    }
  ];

  pastMembers: any[] = [
    {
      name: 'Ramin Khalili',
      role: 'Developer & Lab Intern',
      affiliation: 'University of Padova'
    },
    {
      name: 'Damiano Clementel',
      role: 'Lead developer',
      affiliation: 'University of Padova',
      period: '2021-2023'
    },
    {
      name: 'Styliani-Christina (Stella) Fragkouli',
      role: 'Research Associate',
      affiliation: 'CERTH'
    },
    {
      name: 'Konstantinos Kyritsis',
      role: 'Research Associate',
      affiliation: 'CERTH'
    },
    {
      name: 'Anastasia (Natasa) Anastasiadou',
      role: 'Research Associate',
      affiliation: 'CERTH'
    }
  ];
}
