import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RegistryService } from '../../services/registry.service';
import { VersionSnapshot } from '../../models/registry.models';

@Component({
  selector: 'app-history',
  template: `
    <div class="container py-4" style="max-width: 900px">
      <div class="d-flex align-items-center mb-4 gap-3">
        <a [routerLink]="['/registry', uuid]" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i>Back to Entry
        </a>
        <h4 class="mb-0">Version History</h4>
      </div>

      <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

      <div *ngIf="!loading && versions.length === 0" class="text-center text-muted py-5">
        No version history yet.
      </div>

      <div class="list-group" *ngIf="!loading">
        <div *ngFor="let v of versions; let i = index" class="list-group-item">
          <div class="d-flex justify-content-between">
            <div>
              <strong>v{{ versions.length - i }}</strong>
              <span class="text-muted ms-2 small">{{ v.editedAt | date:'medium' }}</span>
              <span *ngIf="v.changeNote" class="ms-2 text-muted small fst-italic">— {{ v.changeNote }}</span>
            </div>
            <small class="text-muted">{{ v.editedBy }}</small>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  uuid = '';
  versions: VersionSnapshot[] = [];
  loading = true;

  constructor(private route: ActivatedRoute, private registryService: RegistryService) {}

  ngOnInit(): void {
    this.uuid = this.route.snapshot.paramMap.get('uuid')!;
    this.registryService.getHistory(this.uuid).subscribe(v => {
      this.versions = v;
      this.loading = false;
    });
  }
}
