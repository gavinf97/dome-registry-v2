import { Component } from '@angular/core';

@Component({
  selector: 'app-about-news',
  template: `
    <section class="py-5">
      <div class="container" style="max-width:800px">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          Updates &amp; Community
        </div>
        <h2 class="h3 fw-bold mb-2">News &amp; Events</h2>
        <p class="text-muted mb-5">
          Stay up to date with the latest DOME Registry announcements, publications, and community events.
        </p>

        <div class="text-center py-5">
          <div class="mb-4" style="opacity:.35">
            <i class="bi bi-newspaper" style="font-size:5rem;color:#003958"></i>
          </div>
          <h4 class="fw-bold mb-2">Coming Soon</h4>
          <p class="text-muted mb-4" style="max-width:500px;margin:0 auto">
            News and events content will be published here. Check back soon for updates on
            DOME Registry releases, community workshops, and publications.
          </p>
          <div class="d-flex flex-wrap gap-3 justify-content-center">
            <a href="https://github.com/BioComputingUP/dome-registry" target="_blank"
               rel="noopener" class="btn btn-dark btn-sm">
              <i class="bi bi-github me-2"></i>Follow on GitHub
            </a>
            <a href="mailto:contact&#64;dome-ml.org" class="btn btn-outline-primary btn-sm">
              <i class="bi bi-envelope me-2"></i>Mailing List
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AboutNewsComponent {}
