import { Component } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  currentYear = new Date().getFullYear();

  footerPillars = [
    { icon: 'bi-database', label: 'Data' },
    { icon: 'bi-gear-wide-connected', label: 'Optimization' },
    { icon: 'bi-cpu', label: 'Model' },
    { icon: 'bi-bar-chart-line', label: 'Evaluation' },
  ];

  constructor(public auth: AuthService) {}
}
