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
        <p class="text-muted mb-4">
          Stay up to date with the latest DOME Registry announcements, publications, and community events.
        </p>
        <div>
          <a href="https://dome-ml.org/news" target="_blank"
             rel="noopener" class="btn btn-primary px-4 py-2">
            <i class="bi bi-box-arrow-up-right me-2"></i>Go to DOME News &amp; Events
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AboutNewsComponent {}
