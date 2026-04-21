import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDialogData = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
};

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
  ],
  template: `
    <div class="dialog-icon" [class.dialog-icon--danger]="data.tone === 'danger'">
      <mat-icon>{{ data.tone === 'danger' ? 'delete' : 'help' }}</mat-icon>
    </div>

    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">
        {{ data.cancelLabel ?? 'Annuler' }}
      </button>
      <button
        mat-flat-button
        type="button"
        [class.confirm-danger]="data.tone === 'danger'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmLabel ?? 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    :host {
      display: block;
      padding-top: 0.25rem;
      color: var(--stockpro-ink);
    }

    .dialog-icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      margin: 0 1.5rem 0.25rem;
      border-radius: 8px;
      color: var(--stockpro-blue);
      background: rgba(48, 86, 211, 0.12);
    }

    .dialog-icon--danger {
      color: var(--stockpro-danger);
      background: rgba(199, 62, 57, 0.12);
    }

    h2 {
      margin: 0;
      color: var(--stockpro-ink);
      font-family: 'Source Sans 3', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
    }

    p {
      margin: 0;
      color: var(--stockpro-muted);
      line-height: 1.55;
    }

    .confirm-danger {
      background: var(--stockpro-danger);
      color: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
