import { Component } from '@angular/core';

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

    <!-- Tab bar -->
    <div class="bg-white border-bottom sticky-top shadow-sm" style="top:0;z-index:100">
      <div class="container">
        <ul class="nav nav-tabs border-0 gap-1 py-1 flex-nowrap overflow-auto">
          <li class="nav-item flex-shrink-0">
            <a class="nav-link page-tab" routerLink="/about/overview" routerLinkActive="active">
              <i class="bi bi-info-circle me-1"></i>Overview
            </a>
          </li>
          <li class="nav-item flex-shrink-0">
            <a class="nav-link page-tab" routerLink="/about/integrations" routerLinkActive="active">
              <i class="bi bi-plug me-1"></i>Integrations
            </a>
          </li>
          <li class="nav-item flex-shrink-0">
            <a class="nav-link page-tab" routerLink="/about/governance" routerLinkActive="active">
              <i class="bi bi-people me-1"></i>Governance
            </a>
          </li>
          <li class="nav-item flex-shrink-0">
            <a class="nav-link page-tab" routerLink="/about/policies" routerLinkActive="active">
              <i class="bi bi-shield-check me-1"></i>Policies
            </a>
          </li>
          <li class="nav-item flex-shrink-0">
            <a class="nav-link page-tab" routerLink="/about/news" routerLinkActive="active">
              <i class="bi bi-newspaper me-1"></i>News &amp; Events
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Child page content -->
    <router-outlet></router-outlet>
  `,
  styles: [`
    .about-hero {
      background: linear-gradient(135deg, #0D3144 0%, #003958 60%, #005580 100%);
    }
    .page-tab {
      color: #495057;
      border-radius: 6px;
      white-space: nowrap;
      &:hover { color: #003958; background: rgba(0,57,88,.06); }
      &.active { color: #003958; background: rgba(0,57,88,.08); font-weight: 600; }
    }
  `],
})
export class AboutComponent {}
