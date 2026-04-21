import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize, startWith } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { Role } from '../../core/models/role.model';
import { Utilisateur } from '../../core/models/utilisateur.model';
import { EntrepotService } from '../../core/services/entrepot.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-utilisateurs-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Administration</p>
        <h2>Utilisateurs et rôles</h2>
        <p>Gérez les accès, les rôles et les affectations aux entrepôts.</p>
      </div>
      <button mat-stroked-button type="button" (click)="resetForm()">
        <mat-icon>refresh</mat-icon>
        Réinitialiser
      </button>
    </section>

    <section class="page-grid">
      <mat-card class="form-card">
        <div class="card-header">
          <div>
            <p class="card-header__eyebrow">{{ isEditing() ? 'Édition' : 'Création' }}</p>
            <h3>{{ isEditing() ? 'Mettre à jour un utilisateur' : 'Ajouter un utilisateur' }}</h3>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline">
            <mat-label>Nom complet</mat-label>
            <input matInput formControlName="nom" />
            @if (form.controls.nom.hasError('required')) {
              <mat-error>Nom requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            @if (form.controls.email.hasError('required')) {
              <mat-error>Email requis</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" formControlName="motDePasse" />
            <mat-hint>
              {{
                isEditing()
                  ? 'Laissez vide pour conserver le mot de passe actuel.'
                  : 'Minimum recommandé : 8 caractères.'
              }}
            </mat-hint>
            @if (form.controls.motDePasse.hasError('required')) {
              <mat-error>Mot de passe requis</mat-error>
            } @else if (form.controls.motDePasse.hasError('minlength')) {
              <mat-error>8 caractères minimum</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rôle</mat-label>
            <mat-select formControlName="role">
              @for (role of roles; track role) {
                <mat-option [value]="role">{{ roleLabel(role) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (requiresEntrepotRole()) {
            <mat-form-field appearance="outline">
              <mat-label>Entrepôt affecté</mat-label>
              <mat-select formControlName="entrepotId">
                @for (entrepot of entrepots(); track entrepot.id) {
                  <mat-option [value]="entrepot.id">{{ entrepot.nom }}</mat-option>
                }
              </mat-select>
              <mat-hint>Ce compte travaille uniquement dans cet entrepôt.</mat-hint>
              @if (form.controls.entrepotId.hasError('required')) {
                <mat-error>Entrepôt requis</mat-error>
              }
            </mat-form-field>
          }

          @if (feedbackMessage()) {
            <p class="feedback" [class.feedback--error]="feedbackState() === 'error'">
              {{ feedbackMessage() }}
            </p>
          }

          <div class="actions">
            <button mat-flat-button type="submit" [disabled]="form.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <mat-progress-spinner diameter="18" mode="indeterminate" />
              } @else {
                <span>{{ isEditing() ? 'Mettre à jour' : 'Créer le compte' }}</span>
              }
            </button>
            @if (isEditing()) {
              <button mat-button type="button" (click)="resetForm()">Annuler</button>
            }
          </div>
        </form>
      </mat-card>

      <mat-card class="list-card">
        <div class="card-header">
          <div>
            <p class="card-header__eyebrow">Équipe</p>
            <h3>Comptes disponibles</h3>
          </div>
          <span class="count">{{ utilisateurs().length }}</span>
        </div>

        @if (isLoading()) {
          <div class="empty-state">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p>Chargement des utilisateurs...</p>
          </div>
        } @else if (utilisateurs().length === 0) {
          <div class="empty-state">
            <mat-icon>group_off</mat-icon>
            <p>Aucun utilisateur disponible.</p>
          </div>
        } @else {
          <div class="users">
            @for (utilisateur of utilisateurs(); track utilisateur.id) {
              <article class="user-card">
                <div>
                  <div class="user-card__top">
                    <h4>{{ utilisateur.nom }}</h4>
                    <span class="role">{{ roleLabel(utilisateur.role) }}</span>
                  </div>
                  <p>{{ utilisateur.email }}</p>
                  @if (utilisateur.role !== 'ADMIN' && utilisateur.entrepotNom) {
                    <p class="assignment">
                      <mat-icon>warehouse</mat-icon>
                      {{ utilisateur.entrepotNom }}
                    </p>
                  }
                </div>

                <div class="user-card__actions">
                  <button mat-button type="button" (click)="edit(utilisateur)">
                    <mat-icon>edit</mat-icon>
                    Modifier
                  </button>
                  <button mat-button type="button" class="danger" (click)="remove(utilisateur)">
                    <mat-icon>delete</mat-icon>
                    Supprimer
                  </button>
                </div>
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

    .page-header h2,
    .card-header h3,
    .user-card h4 {
      margin: 0;
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 900;
      color: var(--stockpro-ink);
    }

    .page-header p,
    .user-card p {
      margin: 0.55rem 0 0;
      color: var(--stockpro-muted);
    }

    .page-grid {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 1.5rem;
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

    form,
    .users {
      display: grid;
      gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    .count,
    .role {
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
    .user-card__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .user-card {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.04);
    }

    .user-card__top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .assignment {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
    }

    .assignment mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
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

      .page-header,
      .user-card {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilisateursPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly entrepotService = inject(EntrepotService);
  private readonly utilisateurService = inject(UtilisateurService);

  protected readonly roles: Role[] = ['ADMIN', 'GESTIONNAIRE', 'OBSERVATEUR'];
  protected readonly entrepots = signal<Entrepot[]>([]);
  protected readonly utilisateurs = signal<Utilisateur[]>([]);
  protected readonly selectedUserId = signal<number | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingEntrepots = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly feedbackMessage = signal('');
  protected readonly feedbackState = signal<'success' | 'error'>('success');
  protected readonly isEditing = computed(() => this.selectedUserId() !== null);
  protected readonly requiresEntrepotRole = signal(true);

  protected readonly form = this.formBuilder.group({
    nom: this.formBuilder.nonNullable.control('', [Validators.required]),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    motDePasse: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    role: this.formBuilder.nonNullable.control<Role>('GESTIONNAIRE', [Validators.required]),
    entrepotId: this.formBuilder.control<number | null>(null, [Validators.required]),
  });

  constructor() {
    this.form.controls.role.valueChanges
      .pipe(startWith(this.form.controls.role.value), takeUntilDestroyed())
      .subscribe((role) => {
        this.requiresEntrepotRole.set(this.roleRequiresEntrepot(role));
        this.updateEntrepotValidators();
      });

    this.loadEntrepots();
    this.loadUtilisateurs();
  }

  protected save(): void {
    this.updatePasswordValidators();
    this.updateEntrepotValidators();

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    const rawRequest = this.form.getRawValue();
    const request = {
      ...rawRequest,
      motDePasse: rawRequest.motDePasse.trim() || null,
      entrepotId: this.roleRequiresEntrepot(rawRequest.role) ? rawRequest.entrepotId : null,
    };
    const selectedUserId = this.selectedUserId();
    const action$ =
      selectedUserId === null
        ? this.utilisateurService.create(request)
        : this.utilisateurService.update(selectedUserId, request);

    action$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.feedbackState.set('success');
        this.feedbackMessage.set(
          selectedUserId === null
            ? 'Utilisateur créé avec succès.'
            : 'Utilisateur mis à jour avec succès.',
        );
        this.resetForm();
        this.loadUtilisateurs();
      },
      error: (error: unknown) => {
        this.feedbackState.set('error');
        this.feedbackMessage.set(this.extractErrorMessage(error));
      },
    });
  }

  protected edit(utilisateur: Utilisateur): void {
    this.selectedUserId.set(utilisateur.id);
    this.feedbackMessage.set('');
    this.form.setValue({
      nom: utilisateur.nom,
      email: utilisateur.email,
      motDePasse: '',
      role: utilisateur.role,
      entrepotId: utilisateur.entrepotId,
    });
    this.updatePasswordValidators();
    this.updateEntrepotValidators();
  }

  protected remove(utilisateur: Utilisateur): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer ce compte ?',
          message: `Le compte ${utilisateur.email} ne pourra plus accéder à StockPro.`,
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

        this.utilisateurService
          .delete(utilisateur.id)
          .pipe(finalize(() => this.isSubmitting.set(false)))
          .subscribe({
            next: () => {
              this.feedbackState.set('success');
              this.feedbackMessage.set('Utilisateur supprimé avec succès.');
              if (this.selectedUserId() === utilisateur.id) {
                this.resetForm();
              }
              this.loadUtilisateurs();
            },
            error: (error: unknown) => {
              this.feedbackState.set('error');
              this.feedbackMessage.set(this.extractErrorMessage(error));
            },
          });
      });
  }

  protected resetForm(): void {
    this.selectedUserId.set(null);
    this.form.reset({
      nom: '',
      email: '',
      motDePasse: '',
      role: 'GESTIONNAIRE',
      entrepotId: null,
    });
    this.updatePasswordValidators();
    this.updateEntrepotValidators();
  }

  private loadUtilisateurs(): void {
    this.isLoading.set(true);
    this.utilisateurService
      .findAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (utilisateurs) => this.utilisateurs.set(utilisateurs),
        error: (error: unknown) => {
          this.feedbackState.set('error');
          this.feedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  private loadEntrepots(): void {
    this.isLoadingEntrepots.set(true);
    this.entrepotService
      .findAll()
      .pipe(finalize(() => this.isLoadingEntrepots.set(false)))
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

  private updatePasswordValidators(): void {
    const validators = this.isEditing()
      ? [Validators.minLength(8)]
      : [Validators.required, Validators.minLength(8)];

    this.form.controls.motDePasse.setValidators(validators);
    this.form.controls.motDePasse.updateValueAndValidity({ emitEvent: false });
  }

  private updateEntrepotValidators(): void {
    if (this.roleRequiresEntrepot(this.form.controls.role.value)) {
      this.form.controls.entrepotId.setValidators([Validators.required]);
    } else {
      this.form.controls.entrepotId.clearValidators();
      this.form.controls.entrepotId.setValue(null, { emitEvent: false });
    }

    this.form.controls.entrepotId.updateValueAndValidity({ emitEvent: false });
  }

  private roleRequiresEntrepot(role: Role): boolean {
    return role === 'GESTIONNAIRE' || role === 'OBSERVATEUR';
  }

  protected roleLabel(role: Role): string {
    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    if (role === 'GESTIONNAIRE') {
      return 'Gestionnaire';
    }

    return 'Observateur';
  }
}
