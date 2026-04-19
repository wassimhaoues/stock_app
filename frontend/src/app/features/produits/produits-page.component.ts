import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { Produit } from '../../core/models/produit.model';
import { AuthService } from '../../core/services/auth.service';
import { ProduitService } from '../../core/services/produit.service';

@Component({
  selector: 'app-produits-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Catalogue</p>
        <h2>Produits</h2>
        <p>
          {{
            canManage()
              ? 'Gerez le catalogue global des references.'
              : 'Consultez le catalogue global des produits.'
          }}
        </p>
      </div>
      @if (canManage()) {
        <button mat-stroked-button type="button" (click)="resetForm()">
          <mat-icon>refresh</mat-icon>
          Reinitialiser
        </button>
      }
    </section>

    <section class="page-grid" [class.page-grid--readonly]="!canManage()">
      @if (canManage()) {
        <mat-card class="form-card">
          <div class="card-header">
            <div>
              <p class="card-header__eyebrow">{{ isEditing() ? 'Edition' : 'Creation' }}</p>
              <h3>{{ isEditing() ? 'Mettre a jour un produit' : 'Ajouter un produit' }}</h3>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="nom" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categorie</mat-label>
              <input matInput formControlName="categorie" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Prix</mat-label>
              <input matInput type="number" min="0.01" step="0.01" formControlName="prix" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fournisseur</mat-label>
              <input matInput formControlName="fournisseur" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Seuil minimum</mat-label>
              <input matInput type="number" min="0" formControlName="seuilMin" />
            </mat-form-field>

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
                  <span>{{ isEditing() ? 'Mettre a jour' : 'Creer le produit' }}</span>
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
            <h3>{{ canManage() ? 'Produits disponibles' : 'Produits consultables' }}</h3>
          </div>
          <span class="count">{{ produits().length }}</span>
        </div>

        @if (!canManage() && feedbackMessage()) {
          <p class="feedback" [class.feedback--error]="feedbackState() === 'error'">
            {{ feedbackMessage() }}
          </p>
        }

        @if (isLoading()) {
          <div class="empty-state">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p>Chargement des produits...</p>
          </div>
        } @else if (produits().length === 0) {
          <div class="empty-state">
            <mat-icon>category</mat-icon>
            <p>Aucun produit disponible.</p>
          </div>
        } @else {
          <div class="table" role="table">
            <div class="table__row table__row--head" role="row">
              <span role="columnheader">Produit</span>
              <span role="columnheader">Categorie</span>
              <span role="columnheader">Fournisseur</span>
              <span role="columnheader">Prix</span>
              <span role="columnheader">Seuil</span>
              @if (canManage()) {
                <span role="columnheader">Actions</span>
              }
            </div>

            @for (produit of produits(); track produit.id) {
              <article class="table__row" role="row">
                <strong role="cell">{{ produit.nom }}</strong>
                <span role="cell">{{ produit.categorie }}</span>
                <span role="cell">{{ produit.fournisseur }}</span>
                <span role="cell">{{ produit.prix }} TND</span>
                <span role="cell">{{ produit.seuilMin }}</span>
                @if (canManage()) {
                  <div class="row-actions" role="cell">
                    <button mat-button type="button" (click)="edit(produit)">
                      <mat-icon>edit</mat-icon>
                      Modifier
                    </button>
                    <button mat-button type="button" class="danger" (click)="remove(produit)">
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
      border-radius: 1.5rem;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      box-shadow: 0 18px 40px rgba(22, 33, 47, 0.08);
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
      letter-spacing: 0.14em;
      font-size: 0.74rem;
      font-weight: 700;
    }

    h2,
    h3 {
      margin: 0;
      font-family: 'Playfair Display', serif;
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

    .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      font-weight: 700;
      background: rgba(29, 95, 168, 0.12);
      color: var(--stockpro-blue);
    }

    .feedback {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
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
        minmax(130px, 1fr) minmax(110px, 0.8fr) minmax(130px, 1fr)
        minmax(90px, 0.55fr) minmax(70px, 0.45fr) minmax(210px, auto);
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.1rem;
      border-radius: 1.1rem;
      background: rgba(22, 33, 47, 0.04);
    }

    .page-grid--readonly .table__row {
      grid-template-columns:
        minmax(130px, 1fr) minmax(110px, 0.8fr) minmax(130px, 1fr)
        minmax(90px, 0.55fr) minmax(70px, 0.45fr);
    }

    .table__row--head {
      background: transparent;
      color: var(--stockpro-muted);
      font-weight: 700;
      padding-block: 0.4rem;
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

    @media (max-width: 1180px) {
      .table__row,
      .page-grid--readonly .table__row {
        grid-template-columns: 1fr;
      }

      .table__row--head {
        display: none;
      }
    }

    @media (max-width: 980px) {
      .page-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly produitService = inject(ProduitService);

  protected readonly produits = signal<Produit[]>([]);
  protected readonly selectedProduitId = signal<number | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly feedbackMessage = signal('');
  protected readonly feedbackState = signal<'success' | 'error'>('success');
  protected readonly canManage = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly isEditing = computed(() => this.selectedProduitId() !== null);

  protected readonly form = this.formBuilder.group({
    nom: this.formBuilder.nonNullable.control('', [Validators.required]),
    categorie: this.formBuilder.nonNullable.control('', [Validators.required]),
    prix: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    fournisseur: this.formBuilder.nonNullable.control('', [Validators.required]),
    seuilMin: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    this.loadProduits();
  }

  protected save(): void {
    if (!this.canManage() || this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    const rawRequest = this.form.getRawValue();
    const request = {
      nom: rawRequest.nom.trim(),
      categorie: rawRequest.categorie.trim(),
      prix: Number(rawRequest.prix),
      fournisseur: rawRequest.fournisseur.trim(),
      seuilMin: Number(rawRequest.seuilMin),
    };
    const selectedProduitId = this.selectedProduitId();
    const action$ =
      selectedProduitId === null
        ? this.produitService.create(request)
        : this.produitService.update(selectedProduitId, request);

    action$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.feedbackState.set('success');
          this.feedbackMessage.set(
            selectedProduitId === null
              ? 'Produit cree avec succes.'
              : 'Produit mis a jour avec succes.'
          );
          this.resetForm();
          this.loadProduits();
        },
        error: (error: unknown) => {
          this.feedbackState.set('error');
          this.feedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected edit(produit: Produit): void {
    this.selectedProduitId.set(produit.id);
    this.feedbackMessage.set('');
    this.form.setValue({
      nom: produit.nom,
      categorie: produit.categorie,
      prix: produit.prix,
      fournisseur: produit.fournisseur,
      seuilMin: produit.seuilMin,
    });
  }

  protected remove(produit: Produit): void {
    const confirmed = window.confirm(`Supprimer le produit ${produit.nom} ?`);
    if (!confirmed) {
      return;
    }

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    this.produitService
      .delete(produit.id)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.feedbackState.set('success');
          this.feedbackMessage.set('Produit supprime avec succes.');
          if (this.selectedProduitId() === produit.id) {
            this.resetForm();
          }
          this.loadProduits();
        },
        error: (error: unknown) => {
          this.feedbackState.set('error');
          this.feedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected resetForm(): void {
    this.selectedProduitId.set(null);
    this.form.reset({
      nom: '',
      categorie: '',
      prix: 0,
      fournisseur: '',
      seuilMin: 0,
    });
  }

  private loadProduits(): void {
    this.isLoading.set(true);
    this.produitService
      .findAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (produits) => this.produits.set(produits),
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
