import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { FieldDef } from '../../services/schema.service';

@Component({
  selector: 'app-dome-field',
  template: `
    <div class="mb-3" [formGroup]="parentForm">
      <!-- Label row -->
      <div class="d-flex align-items-center gap-2 mb-1">
        <label class="form-label fw-semibold mb-0">{{ field.label }}</label>
        <span *ngIf="field.complianceLevel === 'REQUIREMENT'" class="badge badge-requirement small">REQUIRED</span>
        <span *ngIf="field.complianceLevel === 'RECOMMENDATION'" class="badge badge-recommendation small">RECOMMENDED</span>
        <span *ngIf="isAiSuggested" class="badge bg-purple text-white small" title="AI-suggested value">AI</span>
      </div>
      <small *ngIf="field.description" class="form-text text-muted d-block mb-1">{{ field.description }}</small>

      <!-- Boolean toggle -->
      <ng-container *ngIf="field.widget === 'boolean'">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" [formControlName]="field.key" />
        </div>
      </ng-container>

      <!-- Integer -->
      <ng-container *ngIf="field.widget === 'integer'">
        <input type="number" class="form-control form-control-sm" [formControlName]="field.key" />
      </ng-container>

      <!-- URL -->
      <ng-container *ngIf="field.widget === 'url'">
        <input type="url" class="form-control form-control-sm" [formControlName]="field.key" placeholder="https://..." />
      </ng-container>

      <!-- Textarea -->
      <ng-container *ngIf="field.widget === 'textarea'">
        <textarea class="form-control form-control-sm" rows="3" [formControlName]="field.key"></textarea>
      </ng-container>

      <!-- Single enum select -->
      <ng-container *ngIf="field.widget === 'enum'">
        <select class="form-select form-select-sm" [formControlName]="field.key">
          <option value="">— select —</option>
          <ng-container *ngIf="dynamicOptions$ | async as opts; else staticOpts">
            <option *ngFor="let o of opts" [value]="o">{{ o }}</option>
          </ng-container>
          <ng-template #staticOpts>
            <option *ngFor="let o of field.enum" [value]="o">{{ o }}</option>
          </ng-template>
        </select>
      </ng-container>

      <!-- Multi-select enum chips -->
      <ng-container *ngIf="field.widget === 'enum-multi'">
        <div class="d-flex flex-wrap gap-1 p-2 border rounded">
          <ng-container *ngIf="dynamicOptions$ | async as opts; else staticMulti">
            <button *ngFor="let o of opts" type="button"
              [class]="isSelected(o) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-secondary'"
              (click)="toggleMulti(o)">{{ o }}</button>
          </ng-container>
          <ng-template #staticMulti>
            <button *ngFor="let o of field.enum" type="button"
              [class]="isSelected(o) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-secondary'"
              (click)="toggleMulti(o)">{{ o }}</button>
          </ng-template>
        </div>
      </ng-container>

      <!-- URL list -->
      <ng-container *ngIf="field.widget === 'url-list' || field.widget === 'tag-list'">
        <div *ngFor="let url of getArray(); let i = index" class="input-group input-group-sm mb-1">
          <input type="{{ field.widget === 'url-list' ? 'url' : 'text' }}" class="form-control"
            [value]="url" (change)="updateArrayItem(i, $any($event.target).value)" />
          <button type="button" class="btn btn-outline-danger" (click)="removeArrayItem(i)">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="addArrayItem()">
          <i class="bi bi-plus"></i> Add {{ field.widget === 'url-list' ? 'URL' : 'item' }}
        </button>
      </ng-container>

      <!-- Default text -->
      <ng-container *ngIf="field.widget === 'text'">
        <input type="text" class="form-control form-control-sm" [formControlName]="field.key" />
      </ng-container>
    </div>
  `,
})
export class DomeFieldComponent implements OnInit {
  @Input() field!: FieldDef;
  @Input() parentForm!: FormGroup;
  @Input() isAiSuggested = false;

  dynamicOptions$: Observable<string[]> | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.field.optionsApi) {
      this.dynamicOptions$ = this.http.get<string[]>(this.field.optionsApi).pipe(
        catchError(() => of([] as string[])),
        shareReplay(1),
      );
    }
  }

  get control(): FormControl {
    return this.parentForm.get(this.field.key) as FormControl;
  }

  getArray(): string[] {
    return Array.isArray(this.control?.value) ? this.control.value : [];
  }

  isSelected(option: string): boolean {
    return this.getArray().includes(option);
  }

  toggleMulti(option: string): void {
    const current = this.getArray();
    const next = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option];
    this.control?.setValue(next, { emitEvent: true });
  }

  addArrayItem(): void {
    this.control?.setValue([...this.getArray(), ''], { emitEvent: true });
  }

  removeArrayItem(index: number): void {
    const arr = this.getArray().filter((_, i) => i !== index);
    this.control?.setValue(arr, { emitEvent: true });
  }

  updateArrayItem(index: number, value: string): void {
    const arr = [...this.getArray()];
    arr[index] = value;
    this.control?.setValue(arr, { emitEvent: true });
  }
}
