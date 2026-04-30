import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  template: `<div class="d-flex justify-content-center align-items-center vh-100">
    <div class="text-center">
      <div class="spinner-border text-primary mb-3"></div>
      <p *ngIf="!error">Completing login…</p>
      <p *ngIf="error" class="text-danger">Login failed: {{ error }}</p>
    </div>
  </div>`,
})
export class AuthCallbackComponent implements OnInit {
  error: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    // Path 1: backend redirected here with ?token= (legacy)
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.auth.handleCallback(token);
      return;
    }

    // Path 2: ORCID redirected here directly with ?code=
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.auth.exchangeCode(code).subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (err) => { this.error = err?.error?.message ?? 'Unknown error'; },
      });
      return;
    }

    this.router.navigateByUrl('/');
  }
}
