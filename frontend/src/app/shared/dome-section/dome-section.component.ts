import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { SectionDef, SubsectionDef } from '../../services/schema.service';

@Component({
  selector: 'app-dome-section',
  template: `
    <div class="card dome-section-card" [formGroup]="parentForm">
      <div class="card-header d-flex align-items-center">
        <h5 class="mb-0 me-auto text-capitalize">{{ section.label }}</h5>
        <span class="badge bg-secondary">{{ getFilledCount() }} / {{ getTotalCount() }} fields</span>
      </div>
      <div class="card-body">
        <ng-container *ngFor="let sub of section.subsections">
          <div class="mb-4" [formGroupName]="sub.key">
            <h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">{{ sub.label }}</h6>
            <div [formGroupName]="section.key === 'publication' ? '' : sub.key" *ngIf="section.key !== 'publication'">
              <app-dome-field *ngFor="let field of sub.fields"
                [field]="field"
                [parentForm]="getSubGroup(sub)"
                [isAiSuggested]="isAiSuggested(field.path)">
              </app-dome-field>
            </div>
            <div *ngIf="section.key === 'publication'">
              <app-dome-field *ngFor="let field of sub.fields"
                [field]="field"
                [parentForm]="getSubGroup(sub)"
                [isAiSuggested]="isAiSuggested(field.path)">
              </app-dome-field>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class DomeSectionComponent {
  @Input() section!: SectionDef;
  @Input() parentForm!: FormGroup;
  @Input() aiSuggestedPaths: Set<string> = new Set();

  getSubGroup(sub: SubsectionDef): FormGroup {
    if (this.section.key === 'publication') {
      return this.parentForm.get('publication') as FormGroup;
    }
    return (this.parentForm.get(this.section.key) as FormGroup)?.get(sub.key) as FormGroup;
  }

  getFilledCount(): number {
    let count = 0;
    for (const sub of this.section.subsections) {
      for (const field of sub.fields) {
        const val = this.getSubGroup(sub)?.get(field.key)?.value;
        if (val !== null && val !== undefined && val !== '') count++;
      }
    }
    return count;
  }

  getTotalCount(): number {
    return this.section.subsections.reduce((sum, sub) => sum + sub.fields.length, 0);
  }

  isAiSuggested(path: string): boolean {
    return this.aiSuggestedPaths.has(path);
  }
}
