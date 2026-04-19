import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { MouvementStock } from '../../core/models/mouvement-stock.model';
import { Produit } from '../../core/models/produit.model';
import { Stock } from '../../core/models/stock.model';
import { TypeMouvement } from '../../core/models/type-mouvement.model';
import { AuthService } from '../../core/services/auth.service';
import { EntrepotService } from '../../core/services/entrepot.service';
import { MouvementStockService } from '../../core/services/mouvement-stock.service';
import { ProduitService } from '../../core/services/produit.service';
import { StockService } from '../../core/services/stock.service';

@Component({
  selector: 'app-stocks-page',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
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
        <p class="page-header__eyebrow">Exploitation</p>
        <h2>Stocks et mouvements</h2>
        <p>
          {{
            canWrite()
              ? 'Pilotez les quantites par entrepot et enregistrez les entrees ou sorties.'
              : 'Consultez les stocks et mouvements de votre entrepot affecte.'
          }}
        </p>
      </div>
      @if (canWrite()) {
        <button mat-stroked-button type="button" (click)="resetForms()">
          <mat-icon>refresh</mat-icon>
          Reinitialiser
        </button>
      }
    </section>

    @if (canWrite()) {
      <section class="form-grid">
        <mat-card class="form-card">
          <div class="card-header">
            <div>
              <p class="card-header__eyebrow">{{ isEditingStock() ? 'Edition' : 'Creation' }}</p>
              <h3>{{ isEditingStock() ? 'Mettre a jour un stock' : 'Ajouter une ligne de stock' }}</h3>
            </div>
          </div>

          <form [formGroup]="stockForm" (ngSubmit)="saveStock()">
            <mat-form-field appearance="outline">
              <mat-label>Produit</mat-label>
              <mat-select formControlName="produitId">
                @for (produit of produits(); track produit.id) {
                  <mat-option [value]="produit.id">{{ produit.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entrepot</mat-label>
              <mat-select formControlName="entrepotId">
                @for (entrepot of entrepots(); track entrepot.id) {
                  <mat-option [value]="entrepot.id">{{ entrepot.nom }}</mat-option>
                }
              </mat-select>
              @if (!canChooseEntrepot()) {
                <mat-hint>Verrouille sur votre entrepot affecte.</mat-hint>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Quantite</mat-label>
              <input matInput type="number" min="0" formControlName="quantite" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Seuil alerte</mat-label>
              <input matInput type="number" min="0" formControlName="seuilAlerte" />
            </mat-form-field>

            @if (stockFeedbackMessage()) {
              <p class="feedback" [class.feedback--error]="stockFeedbackState() === 'error'">
                {{ stockFeedbackMessage() }}
              </p>
            }

            <div class="actions">
              <button mat-flat-button type="submit" [disabled]="stockForm.invalid || isSubmittingStock()">
                @if (isSubmittingStock()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate" />
                } @else {
                  <span>{{ isEditingStock() ? 'Mettre a jour' : 'Creer le stock' }}</span>
                }
              </button>
              @if (isEditingStock()) {
                <button mat-button type="button" (click)="resetStockForm()">Annuler</button>
              }
            </div>
          </form>
        </mat-card>

        <mat-card class="form-card">
          <div class="card-header">
            <div>
              <p class="card-header__eyebrow">Mouvement</p>
              <h3>Enregistrer une entree ou sortie</h3>
            </div>
          </div>

          <form [formGroup]="mouvementForm" (ngSubmit)="saveMouvement()">
            <mat-form-field appearance="outline">
              <mat-label>Produit</mat-label>
              <mat-select formControlName="produitId">
                @for (produit of produits(); track produit.id) {
                  <mat-option [value]="produit.id">{{ produit.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entrepot</mat-label>
              <mat-select formControlName="entrepotId">
                @for (entrepot of entrepots(); track entrepot.id) {
                  <mat-option [value]="entrepot.id">{{ entrepot.nom }}</mat-option>
                }
              </mat-select>
              @if (!canChooseEntrepot()) {
                <mat-hint>Verrouille sur votre entrepot affecte.</mat-hint>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                @for (type of mouvementTypes; track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Quantite</mat-label>
              <input matInput type="number" min="1" formControlName="quantite" />
            </mat-form-field>

            @if (mouvementFeedbackMessage()) {
              <p class="feedback" [class.feedback--error]="mouvementFeedbackState() === 'error'">
                {{ mouvementFeedbackMessage() }}
              </p>
            }

            <div class="actions">
              <button mat-flat-button type="submit" [disabled]="mouvementForm.invalid || isSubmittingMouvement()">
                @if (isSubmittingMouvement()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate" />
                } @else {
                  <span>Enregistrer</span>
                }
              </button>
            </div>
          </form>
        </mat-card>
      </section>
    }

    <section class="content-grid">
      <mat-card class="list-card">
        <div class="card-header">
          <div>
            <p class="card-header__eyebrow">Stocks</p>
            <h3>Lignes disponibles</h3>
          </div>
          <span class="count">{{ stocks().length }}</span>
        </div>

        @if (!canWrite() && stockFeedbackMessage()) {
          <p class="feedback" [class.feedback--error]="stockFeedbackState() === 'error'">
            {{ stockFeedbackMessage() }}
          </p>
        }

        @if (isLoadingStocks()) {
          <div class="empty-state">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p>Chargement des stocks...</p>
          </div>
        } @else if (stocks().length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <p>Aucun stock disponible.</p>
          </div>
        } @else {
          <div class="table" role="table">
            <div class="table__row table__row--head stock-row" role="row">
              <span role="columnheader">Produit</span>
              <span role="columnheader">Entrepot</span>
              <span role="columnheader">Quantite</span>
              <span role="columnheader">Seuil</span>
              <span role="columnheader">Etat</span>
              @if (canWrite()) {
                <span role="columnheader">Actions</span>
              }
            </div>

            @for (stock of stocks(); track stock.id) {
              <article class="table__row stock-row" role="row">
                <strong role="cell">{{ stock.produitNom }}</strong>
                <span role="cell">{{ stock.entrepotNom }}</span>
                <span role="cell">{{ stock.quantite }}</span>
                <span role="cell">{{ stock.seuilAlerte }}</span>
                <span role="cell" class="status" [class.status--alert]="stock.enAlerte">
                  {{ stock.enAlerte ? 'Alerte' : 'Normal' }}
                </span>
                @if (canWrite()) {
                  <div class="row-actions" role="cell">
                    <button mat-button type="button" (click)="editStock(stock)">
                      <mat-icon>edit</mat-icon>
                      Modifier
                    </button>
                    <button mat-button type="button" class="danger" (click)="removeStock(stock)">
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

      <mat-card class="list-card">
        <div class="card-header">
          <div>
            <p class="card-header__eyebrow">Historique</p>
            <h3>Mouvements de stock</h3>
          </div>
          <span class="count">{{ mouvements().length }}</span>
        </div>

        @if (!canWrite() && mouvementFeedbackMessage()) {
          <p class="feedback" [class.feedback--error]="mouvementFeedbackState() === 'error'">
            {{ mouvementFeedbackMessage() }}
          </p>
        }

        @if (isLoadingMouvements()) {
          <div class="empty-state">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p>Chargement des mouvements...</p>
          </div>
        } @else if (mouvements().length === 0) {
          <div class="empty-state">
            <mat-icon>swap_horiz</mat-icon>
            <p>Aucun mouvement disponible.</p>
          </div>
        } @else {
          <div class="table" role="table">
            <div class="table__row table__row--head movement-row" role="row">
              <span role="columnheader">Date</span>
              <span role="columnheader">Type</span>
              <span role="columnheader">Produit</span>
              <span role="columnheader">Entrepot</span>
              <span role="columnheader">Quantite</span>
            </div>

            @for (mouvement of mouvements(); track mouvement.id) {
              <article class="table__row movement-row" role="row">
                <span role="cell">{{ mouvement.date | date: 'dd/MM/yyyy HH:mm' }}</span>
                <span role="cell" class="status" [class.status--alert]="mouvement.type === 'SORTIE'">
                  {{ mouvement.type }}
                </span>
                <strong role="cell">{{ mouvement.produitNom }}</strong>
                <span role="cell">{{ mouvement.entrepotNom }}</span>
                <span role="cell">{{ mouvement.quantite }}</span>
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

    .form-grid,
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
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

    form {
      display: grid;
      gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    .count,
    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: max-content;
      min-width: 44px;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      font-weight: 700;
      background: rgba(29, 95, 168, 0.12);
      color: var(--stockpro-blue);
    }

    .status--alert {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
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
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.1rem;
      border-radius: 1.1rem;
      background: rgba(22, 33, 47, 0.04);
    }

    .stock-row {
      grid-template-columns:
        minmax(130px, 1fr) minmax(130px, 1fr) minmax(80px, 0.5fr)
        minmax(80px, 0.5fr) minmax(90px, 0.55fr) minmax(210px, auto);
    }

    .movement-row {
      grid-template-columns:
        minmax(130px, 0.9fr) minmax(90px, 0.45fr) minmax(130px, 1fr)
        minmax(130px, 1fr) minmax(80px, 0.45fr);
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
      .content-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }

      .stock-row,
      .movement-row {
        grid-template-columns: 1fr;
      }

      .table__row--head {
        display: none;
      }
    }

    @media (max-width: 980px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StocksPageComponent {
  private readonly authService = inject(AuthService);
  private readonly entrepotService = inject(EntrepotService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly mouvementStockService = inject(MouvementStockService);
  private readonly produitService = inject(ProduitService);
  private readonly stockService = inject(StockService);

  protected readonly mouvementTypes: TypeMouvement[] = ['ENTREE', 'SORTIE'];
  protected readonly entrepots = signal<Entrepot[]>([]);
  protected readonly mouvements = signal<MouvementStock[]>([]);
  protected readonly produits = signal<Produit[]>([]);
  protected readonly stocks = signal<Stock[]>([]);
  protected readonly selectedStockId = signal<number | null>(null);
  protected readonly isLoadingStocks = signal(true);
  protected readonly isLoadingMouvements = signal(true);
  protected readonly isSubmittingStock = signal(false);
  protected readonly isSubmittingMouvement = signal(false);
  protected readonly stockFeedbackMessage = signal('');
  protected readonly stockFeedbackState = signal<'success' | 'error'>('success');
  protected readonly mouvementFeedbackMessage = signal('');
  protected readonly mouvementFeedbackState = signal<'success' | 'error'>('success');
  protected readonly canWrite = computed(() =>
    this.authService.hasRole('ADMIN', 'GESTIONNAIRE')
  );
  protected readonly canChooseEntrepot = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly isEditingStock = computed(() => this.selectedStockId() !== null);

  protected readonly stockForm = this.formBuilder.group({
    produitId: this.formBuilder.control<number | null>(null, [Validators.required]),
    entrepotId: this.formBuilder.control<number | null>(null, [Validators.required]),
    quantite: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    seuilAlerte: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
  });

  protected readonly mouvementForm = this.formBuilder.group({
    produitId: this.formBuilder.control<number | null>(null, [Validators.required]),
    entrepotId: this.formBuilder.control<number | null>(null, [Validators.required]),
    type: this.formBuilder.nonNullable.control<TypeMouvement>('ENTREE', [Validators.required]),
    quantite: this.formBuilder.nonNullable.control(1, [Validators.required, Validators.min(1)]),
  });

  constructor() {
    this.loadCatalogs();
    this.loadStocks();
    this.loadMouvements();
  }

  protected saveStock(): void {
    if (!this.canWrite() || this.stockForm.invalid || this.isSubmittingStock()) {
      this.stockForm.markAllAsTouched();
      return;
    }

    this.stockFeedbackMessage.set('');
    this.isSubmittingStock.set(true);

    const rawRequest = this.stockForm.getRawValue();
    const request = {
      produitId: Number(rawRequest.produitId),
      entrepotId: Number(rawRequest.entrepotId),
      quantite: Number(rawRequest.quantite),
      seuilAlerte: Number(rawRequest.seuilAlerte),
    };
    const selectedStockId = this.selectedStockId();
    const action$ =
      selectedStockId === null
        ? this.stockService.create(request)
        : this.stockService.update(selectedStockId, request);

    action$
      .pipe(finalize(() => this.isSubmittingStock.set(false)))
      .subscribe({
        next: () => {
          this.stockFeedbackState.set('success');
          this.stockFeedbackMessage.set(
            selectedStockId === null
              ? 'Stock cree avec succes.'
              : 'Stock mis a jour avec succes.'
          );
          this.resetStockForm();
          this.loadStocks();
        },
        error: (error: unknown) => {
          this.stockFeedbackState.set('error');
          this.stockFeedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected saveMouvement(): void {
    if (!this.canWrite() || this.mouvementForm.invalid || this.isSubmittingMouvement()) {
      this.mouvementForm.markAllAsTouched();
      return;
    }

    this.mouvementFeedbackMessage.set('');
    this.isSubmittingMouvement.set(true);

    const rawRequest = this.mouvementForm.getRawValue();
    const request = {
      produitId: Number(rawRequest.produitId),
      entrepotId: Number(rawRequest.entrepotId),
      type: rawRequest.type,
      quantite: Number(rawRequest.quantite),
    };

    this.mouvementStockService
      .create(request)
      .pipe(finalize(() => this.isSubmittingMouvement.set(false)))
      .subscribe({
        next: () => {
          this.mouvementFeedbackState.set('success');
          this.mouvementFeedbackMessage.set('Mouvement enregistre avec succes.');
          this.resetMouvementForm();
          this.loadStocks();
          this.loadMouvements();
        },
        error: (error: unknown) => {
          this.mouvementFeedbackState.set('error');
          this.mouvementFeedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected editStock(stock: Stock): void {
    this.selectedStockId.set(stock.id);
    this.stockFeedbackMessage.set('');
    this.stockForm.setValue({
      produitId: stock.produitId,
      entrepotId: stock.entrepotId,
      quantite: stock.quantite,
      seuilAlerte: stock.seuilAlerte,
    });
  }

  protected removeStock(stock: Stock): void {
    const confirmed = window.confirm(`Supprimer le stock ${stock.produitNom} - ${stock.entrepotNom} ?`);
    if (!confirmed) {
      return;
    }

    this.stockFeedbackMessage.set('');
    this.isSubmittingStock.set(true);

    this.stockService
      .delete(stock.id)
      .pipe(finalize(() => this.isSubmittingStock.set(false)))
      .subscribe({
        next: () => {
          this.stockFeedbackState.set('success');
          this.stockFeedbackMessage.set('Stock supprime avec succes.');
          if (this.selectedStockId() === stock.id) {
            this.resetStockForm();
          }
          this.loadStocks();
        },
        error: (error: unknown) => {
          this.stockFeedbackState.set('error');
          this.stockFeedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected resetForms(): void {
    this.resetStockForm();
    this.resetMouvementForm();
  }

  protected resetStockForm(): void {
    this.selectedStockId.set(null);
    this.stockForm.reset({
      produitId: null,
      entrepotId: this.defaultEntrepotId(),
      quantite: 0,
      seuilAlerte: 0,
    });
  }

  private resetMouvementForm(): void {
    this.mouvementForm.reset({
      produitId: null,
      entrepotId: this.defaultEntrepotId(),
      type: 'ENTREE',
      quantite: 1,
    });
  }

  private loadCatalogs(): void {
    this.produitService.findAll().subscribe({
      next: (produits) => this.produits.set(produits),
      error: (error: unknown) => {
        this.stockFeedbackState.set('error');
        this.stockFeedbackMessage.set(this.extractErrorMessage(error));
      },
    });

    this.entrepotService.findAll().subscribe({
      next: (entrepots) => {
        this.entrepots.set(entrepots);
        if (!this.canChooseEntrepot()) {
          this.resetForms();
        }
      },
      error: (error: unknown) => {
        this.stockFeedbackState.set('error');
        this.stockFeedbackMessage.set(this.extractErrorMessage(error));
      },
    });
  }

  private loadStocks(): void {
    this.isLoadingStocks.set(true);
    this.stockService
      .findAll()
      .pipe(finalize(() => this.isLoadingStocks.set(false)))
      .subscribe({
        next: (stocks) => this.stocks.set(stocks),
        error: (error: unknown) => {
          this.stockFeedbackState.set('error');
          this.stockFeedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  private loadMouvements(): void {
    this.isLoadingMouvements.set(true);
    this.mouvementStockService
      .findAll()
      .pipe(finalize(() => this.isLoadingMouvements.set(false)))
      .subscribe({
        next: (mouvements) => this.mouvements.set(mouvements),
        error: (error: unknown) => {
          this.mouvementFeedbackState.set('error');
          this.mouvementFeedbackMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  private defaultEntrepotId(): number | null {
    if (this.canChooseEntrepot()) {
      return null;
    }

    return this.entrepots()[0]?.id ?? null;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Une erreur est survenue.';
    }

    return 'Une erreur est survenue.';
  }
}
