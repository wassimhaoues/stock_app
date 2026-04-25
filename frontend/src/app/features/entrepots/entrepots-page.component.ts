import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { AuthService } from '../../core/services/auth.service';
import { EntrepotService } from '../../core/services/entrepot.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-entrepots-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Infrastructure</p>
        <h2>Entrepôts</h2>
        <p>
          {{
            canManage()
              ? 'Gérez les sites de stockage disponibles.'
              : 'Consultez votre entrepôt affecté.'
          }}
        </p>
      </div>
      @if (canManage()) {
        <button mat-stroked-button type="button" (click)="resetForm()">
          <mat-icon>refresh</mat-icon>
          Réinitialiser
        </button>
      }
    </section>

    <section class="page-grid" [class.page-grid--readonly]="!canManage()">
      @if (canManage()) {
        <mat-card class="form-card">
          <div class="card-header">
            <div>
              <p class="card-header__eyebrow">{{ isEditing() ? 'Édition' : 'Création' }}</p>
              <h3>{{ isEditing() ? 'Mettre à jour un entrepôt' : 'Ajouter un entrepôt' }}</h3>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="nom" />
              @if (form.controls.nom.hasError('required')) {
                <mat-error>Nom requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Adresse</mat-label>
              <input matInput formControlName="adresse" />
              @if (form.controls.adresse.hasError('required')) {
                <mat-error>Adresse requise</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Capacité</mat-label>
              <input matInput type="number" min="1" formControlName="capacite" />
              @if (form.controls.capacite.hasError('required')) {
                <mat-error>Capacité requise</mat-error>
              } @else if (form.controls.capacite.hasError('min')) {
                <mat-error>La capacité doit être positive</mat-error>
              }
            </mat-form-field>
            @if (selectedEntrepot(); as entrepot) {
              <div
                class="capacity-note"
                [class.capacity-note--error]="isCapacityReductionInvalid()"
              >
                <span>Utilisée : {{ entrepot.capaciteUtilisee }}</span>
                <span>Disponible actuelle : {{ entrepot.capaciteDisponible }}</span>
                <span>Disponible après modification : {{ availableAfterEdit() }}</span>
              </div>
            } @else {
              <p class="capacity-note">
                Cette valeur définit la limite maximale de stock de l'entrepôt.
              </p>
            }

            @if (feedbackMessage()) {
              <p class="feedback" [class.feedback--error]="feedbackState() === 'error'">
                {{ feedbackMessage() }}
              </p>
            }

            <div class="actions">
              <button
                mat-flat-button
                type="submit"
                [disabled]="form.invalid || isCapacityReductionInvalid() || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate" />
                } @else {
                  <span>{{ isEditing() ? 'Mettre à jour' : "Créer l'entrepôt" }}</span>
                }
              </button>
              @if (isEditing()) {
                <button mat-button type="button" (click)="resetForm()">Annuler</button>
              }
            </div>
          </form>
        </mat-card>
      }

      <mat-card class="list-card">
        <div class="card-header">
          <div>
            <p class="card-header__eyebrow">Liste</p>
            <h3>{{ canManage() ? 'Entrepôts disponibles' : 'Entrepôt affecté' }}</h3>
          </div>
          <span class="count">{{ entrepots().length }}</span>
        </div>

        @if (!canManage() && feedbackMessage()) {
          <p class="feedback" [class.feedback--error]="feedbackState() === 'error'">
            {{ feedbackMessage() }}
          </p>
        }

        @if (isLoading()) {
          <div class="empty-state">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p>Chargement des entrepôts...</p>
          </div>
        } @else if (entrepots().length === 0) {
          <div class="empty-state">
            <mat-icon>warehouse</mat-icon>
            <p>Aucun entrepôt disponible.</p>
          </div>
        } @else {
          <div class="table" role="table">
            <div class="table__row table__row--head" role="row">
              <span role="columnheader">Nom</span>
              <span role="columnheader">Adresse</span>
              <span role="columnheader">Capaacité</span>
              <span role="columnheader">Occupation</span>
              @if (canManage()) {
                <span role="columnheader">Actions</span>
              }
            </div>

            @for (entrepot of entrepots(); track entrepot.id) {
              <article class="table__row" role="row">
                <strong role="cell">{{ entrepot.nom }}</strong>
                <span role="cell">{{ entrepot.adresse }}</span>
                <span role="cell" class="capacity-stack">
                  <strong>{{ entrepot.capacite }} total</strong>
                  <small>{{ entrepot.capaciteUtilisee }} utilisée</small>
                  <small>{{ entrepot.capaciteDisponible }} disponible</small>
                </span>
                <span role="cell" class="occupation-cell">
                  <span class="capacity-meter" aria-hidden="true">
                    <span [style.width]="meterWidth(entrepot)"></span>
                  </span>
                  <span
                    class="capacity-pill"
                    [class.capacity-pill--warning]="entrepot.tauxOccupation >= 0.9"
                    [class.capacity-pill--full]="entrepot.capaciteDisponible === 0"
                  >
                    {{ formatOccupation(entrepot) }} - {{ capacityStatus(entrepot) }}
                  </span>
                </span>
                @if (canManage()) {
                  <div class="row-actions" role="cell">
                    <button mat-button type="button" (click)="edit(entrepot)">
                      <mat-icon>edit</mat-icon>
                      Modifier
                    </button>
                    <button mat-button type="button" class="danger" (click)="remove(entrepot)">
                      <mat-icon>delete</mat-icon>
                      Supprimer
                    </button>
                  </div>
                }
              </article>
            }
          </div>
        }
      </mat-card>
    </section>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .page-header,
    .form-card,
    .list-card {
      border-radius: 8px;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      box-shadow: var(--stockpro-shadow);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
    }

    .page-header__eyebrow,
    .card-header__eyebrow {
      margin: 0 0 0.45rem;
      color: var(--stockpro-blue);
      text-transform: uppercase;
      letter-spacing: 0;
      font-size: 0.74rem;
      font-weight: 700;
    }

    h2,
    h3 {
      margin: 0;
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 900;
      color: var(--stockpro-ink);
    }

    .page-header p {
      margin: 0.55rem 0 0;
      color: var(--stockpro-muted);
    }

    .page-grid {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 1.5rem;
    }

    .page-grid--readonly {
      grid-template-columns: 1fr;
    }

    .form-card,
    .list-card {
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    form {
      display: grid;
      gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    .capacity-note {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin: -0.35rem 0 0;
      padding: 0.8rem 0.9rem;
      border-radius: 8px;
      background: rgba(29, 95, 168, 0.1);
      color: var(--stockpro-blue);
      font-weight: 700;
    }

    .capacity-note--error {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      padding: 0.35rem 0.8rem;
      border-radius: 8px;
      font-weight: 700;
      background: rgba(29, 95, 168, 0.12);
      color: var(--stockpro-blue);
    }

    .feedback {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      background: rgba(29, 122, 92, 0.12);
      color: var(--stockpro-green);
      font-weight: 600;
    }

    .feedback--error {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .actions,
    .row-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .table {
      display: grid;
      gap: 0.65rem;
    }

    .table__row {
      display: grid;
      grid-template-columns:
        minmax(130px, 0.9fr) minmax(170px, 1.2fr) minmax(130px, 0.7fr)
        minmax(180px, 0.9fr) minmax(210px, auto);
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.1rem;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.04);
    }

    .page-grid--readonly .table__row {
      grid-template-columns:
        minmax(130px, 0.9fr) minmax(170px, 1.2fr) minmax(130px, 0.7fr)
        minmax(180px, 0.9fr);
    }

    .table__row--head {
      background: transparent;
      color: var(--stockpro-muted);
      font-weight: 700;
      padding-block: 0.4rem;
    }

    .capacity-stack,
    .occupation-cell {
      display: grid;
      gap: 0.35rem;
    }

    .capacity-stack small {
      color: var(--stockpro-muted);
      font-weight: 700;
    }

    .capacity-meter {
      display: block;
      width: 100%;
      height: 8px;
      overflow: hidden;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.1);
    }

    .capacity-meter span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--stockpro-green);
    }

    .capacity-pill {
      display: inline-flex;
      width: max-content;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      background: rgba(29, 122, 92, 0.12);
      color: var(--stockpro-green);
      font-weight: 800;
    }

    .capacity-pill--warning {
      background: rgba(220, 146, 45, 0.14);
      color: #9a5d12;
    }

    .capacity-pill--full {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .danger {
      color: var(--stockpro-danger);
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 0.75rem;
      min-height: 240px;
      text-align: center;
      color: var(--stockpro-muted);
    }

    @media (max-width: 980px) {
      .page-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .table__row,
      .page-grid--readonly .table__row {
        grid-template-columns: 1fr;
      }

      .table__row--head {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntrepotsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly titleService = inject(Title);
  private readonly dialog = inject(MatDialog);
  private readonly entrepotService = inject(EntrepotService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly entrepots = signal<Entrepot[]>([]);
  protected readonly selectedEntrepotId = signal<number | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly feedbackMessage = signal('');
  protected readonly feedbackState = signal<'success' | 'error'>('success');
  protected readonly canManage = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly isEditing = computed(() => this.selectedEntrepotId() !== null);
  protected readonly selectedEntrepot = computed(
    () => this.entrepots().find((entrepot) => entrepot.id === this.selectedEntrepotId()) ?? null,
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required]],
    adresse: ['', [Validators.required]],
    capacite: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.titleService.setTitle('Entrepôts — StockPro');
    this.loadEntrepots();
  }

  protected save(): void {
    if (
      !this.canManage() ||
      this.form.invalid ||
      this.isCapacityReductionInvalid() ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    const rawRequest = this.form.getRawValue();
    const request = {
      nom: rawRequest.nom.trim(),
      adresse: rawRequest.adresse.trim(),
      capacite: rawRequest.capacite,
    };
    const selectedEntrepotId = this.selectedEntrepotId();
    const action$ =
      selectedEntrepotId === null
        ? this.entrepotService.create(request)
        : this.entrepotService.update(selectedEntrepotId, request);

    action$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.feedbackState.set('success');
        this.feedbackMessage.set(
          selectedEntrepotId === null
            ? 'Entrepôt créé avec succès.'
            : 'Entrepôt mis à jour avec succès.',
        );
        this.resetForm();
        this.loadEntrepots();
      },
      error: (error: unknown) => {
        this.feedbackState.set('error');
        this.feedbackMessage.set(this.extractErrorMessage(error));
      },
    });
  }

  protected edit(entrepot: Entrepot): void {
    this.selectedEntrepotId.set(entrepot.id);
    this.feedbackMessage.set('');
    this.form.setValue({
      nom: entrepot.nom,
      adresse: entrepot.adresse,
      capacite: entrepot.capacite,
    });
  }

  protected remove(entrepot: Entrepot): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer cet entrepôt ?',
          message: `L'entrepôt ${entrepot.nom} sera retiré de StockPro.`,
          confirmLabel: 'Supprimer',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.feedbackMessage.set('');
        this.isSubmitting.set(true);

        this.entrepotService
          .delete(entrepot.id)
          .pipe(finalize(() => this.isSubmitting.set(false)))
          .subscribe({
            next: () => {
              this.feedbackState.set('success');
              this.feedbackMessage.set('Entrepôt supprimé avec succès.');
              if (this.selectedEntrepotId() === entrepot.id) {
                this.resetForm();
              }
              this.loadEntrepots();
            },
            error: (error: unknown) => {
              this.feedbackState.set('error');
              this.feedbackMessage.set(this.extractErrorMessage(error));
            },
          });
      });
  }

  protected resetForm(): void {
    this.selectedEntrepotId.set(null);
    this.form.reset({
      nom: '',
      adresse: '',
      capacite: 1,
    });
  }

  protected availableAfterEdit(): number {
    const selectedEntrepot = this.selectedEntrepot();
    if (!selectedEntrepot) {
      return Number(this.form.controls.capacite.value);
    }

    return Math.max(
      Number(this.form.controls.capacite.value) - selectedEntrepot.capaciteUtilisee,
      0,
    );
  }

  protected isCapacityReductionInvalid(): boolean {
    const selectedEntrepot = this.selectedEntrepot();
    return (
      !!selectedEntrepot &&
      Number(this.form.controls.capacite.value) < selectedEntrepot.capaciteUtilisee
    );
  }

  protected formatOccupation(entrepot: Entrepot): string {
    return `${Math.round(entrepot.tauxOccupation * 100)}%`;
  }

  protected meterWidth(entrepot: Entrepot): string {
    return `${Math.min(Math.max(entrepot.tauxOccupation * 100, 0), 100)}%`;
  }

  protected capacityStatus(entrepot: Entrepot): string {
    if (entrepot.capaciteDisponible === 0) {
      return 'Plein';
    }

    if (entrepot.tauxOccupation >= 0.9) {
      return 'Presque plein';
    }

    return 'Disponible';
  }

  private loadEntrepots(): void {
    this.isLoading.set(true);
    this.entrepotService
      .findAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (entrepots) => this.entrepots.set(entrepots),
        error: (error: unknown) => {
          this.feedbackState.set('error');
          this.feedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Une erreur est survenue.';
    }

    return 'Une erreur est survenue.';
  }
}
