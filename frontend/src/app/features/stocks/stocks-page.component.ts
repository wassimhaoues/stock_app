import { DatePipe } from '@angular/common';
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
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-stocks-page',
  standalone: true,
  imports: [
    DatePipe,
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
        <p class="page-header__eyebrow">Exploitation</p>
        <h2>Stocks et mouvements</h2>
        <p>
          {{
            canWrite()
              ? 'Pilotez les quantités par entrepôt et enregistrez les entrées ou sorties.'
              : 'Consultez les stocks et mouvements de votre entrepôt affecté.'
          }}
        </p>
      </div>
      @if (canWrite()) {
        <button mat-stroked-button type="button" (click)="resetForms()">
          <mat-icon>refresh</mat-icon>
          Réinitialiser
        </button>
      }
    </section>

    @if (canWrite()) {
      <section class="form-grid">
        <mat-card class="form-card">
          <div class="card-header">
            <div>
              <p class="card-header__eyebrow">{{ isEditingStock() ? 'Édition' : 'Création' }}</p>
              <h3>
                {{ isEditingStock() ? 'Mettre à jour un stock' : 'Ajouter une ligne de stock' }}
              </h3>
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
              @if (stockForm.controls.produitId.hasError('required')) {
                <mat-error>Produit requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entrepôt</mat-label>
              <mat-select formControlName="entrepotId">
                @for (entrepot of entrepots(); track entrepot.id) {
                  <mat-option [value]="entrepot.id">{{ entrepot.nom }}</mat-option>
                }
              </mat-select>
              @if (!canChooseEntrepot()) {
                <mat-hint>Verrouillé sur votre entrepôt affecté.</mat-hint>
              }
              @if (stockForm.controls.entrepotId.hasError('required')) {
                <mat-error>Entrepôt requis</mat-error>
              }
            </mat-form-field>
            @if (selectedStockEntrepot(); as entrepot) {
              <div class="capacity-panel" [class.capacity-panel--error]="isStockCapacityExceeded()">
                <span>Disponible : {{ stockCapacityLimit() }}</span>
                <span>Après enregistrement : {{ stockCapacityAfterSave() }}</span>
              </div>
            }

            <mat-form-field appearance="outline">
              <mat-label>Quantité</mat-label>
              <input matInput type="number" min="0" formControlName="quantite" />
              @if (stockForm.controls.quantite.hasError('required')) {
                <mat-error>Quantité requise</mat-error>
              } @else if (stockForm.controls.quantite.hasError('min')) {
                <mat-error>La quantité ne peut pas être négative</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Seuil alerte</mat-label>
              <input matInput type="number" min="0" formControlName="seuilAlerte" />
              @if (stockForm.controls.seuilAlerte.hasError('required')) {
                <mat-error>Seuil requis</mat-error>
              } @else if (stockForm.controls.seuilAlerte.hasError('min')) {
                <mat-error>Le seuil ne peut pas être négatif</mat-error>
              }
            </mat-form-field>

            @if (stockFeedbackMessage()) {
              <p class="feedback" [class.feedback--error]="stockFeedbackState() === 'error'">
                {{ stockFeedbackMessage() }}
              </p>
            }

            <div class="actions">
              <button
                mat-flat-button
                type="submit"
                [disabled]="stockForm.invalid || isStockCapacityExceeded() || isSubmittingStock()"
              >
                @if (isSubmittingStock()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate" />
                } @else {
                  <span>{{ isEditingStock() ? 'Mettre à jour' : 'Créer le stock' }}</span>
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
              <h3>Enregistrer une entrée ou sortie</h3>
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
              @if (mouvementForm.controls.produitId.hasError('required')) {
                <mat-error>Produit requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entrepôt</mat-label>
              <mat-select formControlName="entrepotId">
                @for (entrepot of entrepots(); track entrepot.id) {
                  <mat-option [value]="entrepot.id">{{ entrepot.nom }}</mat-option>
                }
              </mat-select>
              @if (!canChooseEntrepot()) {
                <mat-hint>Verrouillé sur votre entrepôt affecté.</mat-hint>
              }
              @if (mouvementForm.controls.entrepotId.hasError('required')) {
                <mat-error>Entrepôt requis</mat-error>
              }
            </mat-form-field>
            @if (selectedMouvementEntrepot(); as entrepot) {
              <div
                class="capacity-panel"
                [class.capacity-panel--error]="isMouvementCapacityExceeded()"
              >
                <span>Disponible avant : {{ entrepot.capaciteDisponible }}</span>
                @if (mouvementForm.controls.type.value === 'ENTREE') {
                  <span>Disponible après entrée : {{ mouvementCapacityAfterSave() }}</span>
                } @else {
                  <span>La sortie libérera de la capacité.</span>
                }
              </div>
            }

            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                @for (type of mouvementTypes; track type) {
                  <mat-option [value]="type">{{ movementLabel(type) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Quantité</mat-label>
              <input matInput type="number" min="1" formControlName="quantite" />
              @if (mouvementForm.controls.quantite.hasError('required')) {
                <mat-error>Quantité requise</mat-error>
              } @else if (mouvementForm.controls.quantite.hasError('min')) {
                <mat-error>La quantité doit être positive</mat-error>
              }
            </mat-form-field>

            @if (mouvementFeedbackMessage()) {
              <p class="feedback" [class.feedback--error]="mouvementFeedbackState() === 'error'">
                {{ mouvementFeedbackMessage() }}
              </p>
            }

            <div class="actions">
              <button
                mat-flat-button
                type="submit"
                [disabled]="
                  mouvementForm.invalid || isMouvementCapacityExceeded() || isSubmittingMouvement()
                "
              >
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
              <span role="columnheader">Entrepôt</span>
              <span role="columnheader">Capacité</span>
              <span role="columnheader">Quantité</span>
              <span role="columnheader">Seuil</span>
              <span role="columnheader">État</span>
              @if (canWrite()) {
                <span role="columnheader">Actions</span>
              }
            </div>

            @for (stock of stocks(); track stock.id) {
              <article class="table__row stock-row" role="row">
                <strong role="cell">{{ stock.produitNom }}</strong>
                <span role="cell">{{ stock.entrepotNom }}</span>
                <span role="cell" class="capacity-summary">{{ stockCapacitySummary(stock) }}</span>
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
              <span role="columnheader">Entrepôt</span>
              <span role="columnheader">Quantité</span>
            </div>

            @for (mouvement of mouvements(); track mouvement.id) {
              <article class="table__row movement-row" role="row">
                <span role="cell">{{ mouvement.date | date: 'dd/MM/yyyy HH:mm' }}</span>
                <span
                  role="cell"
                  class="status"
                  [class.status--alert]="mouvement.type === 'SORTIE'"
                >
                  {{ movementLabel(mouvement.type) }}
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
      gap: 2rem;
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

    .form-grid,
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
    }

    .form-card,
    .list-card {
      min-width: 0;
      padding: 1.5rem;
      overflow: hidden;
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

    .capacity-panel {
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

    .capacity-panel--error {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .count,
    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: max-content;
      min-width: 44px;
      padding: 0.35rem 0.8rem;
      border-radius: 8px;
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
      width: 100%;
      min-width: 0;
      overflow-x: auto;
      padding-bottom: 0.15rem;
    }

    .table__row {
      display: grid;
      gap: 1rem;
      align-items: center;
      min-width: 0;
      padding: 1rem 1.1rem;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.04);
    }

    .stock-row {
      min-width: 860px;
      grid-template-columns:
        minmax(120px, 1fr) minmax(120px, 0.85fr) minmax(110px, 0.65fr)
        minmax(80px, 0.45fr) minmax(80px, 0.45fr) minmax(90px, 0.5fr)
        minmax(190px, auto);
    }

    .movement-row {
      min-width: 640px;
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

    .capacity-summary {
      color: var(--stockpro-muted);
      font-weight: 800;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 0.75rem;
      min-height: 240px;
      text-align: center;
      color: var(--stockpro-muted);
    }

    @media (max-width: 1320px) {
      .content-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1180px) {
      .stock-row,
      .movement-row {
        min-width: 0;
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
  private readonly dialog = inject(MatDialog);
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
  protected readonly canWrite = computed(() => this.authService.hasRole('ADMIN', 'GESTIONNAIRE'));
  protected readonly canChooseEntrepot = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly isEditingStock = computed(() => this.selectedStockId() !== null);
  protected readonly editingStock = computed(
    () => this.stocks().find((stock) => stock.id === this.selectedStockId()) ?? null,
  );

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
    if (
      !this.canWrite() ||
      this.stockForm.invalid ||
      this.isStockCapacityExceeded() ||
      this.isSubmittingStock()
    ) {
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

    action$.pipe(finalize(() => this.isSubmittingStock.set(false))).subscribe({
      next: () => {
        this.stockFeedbackState.set('success');
        this.stockFeedbackMessage.set(
          selectedStockId === null ? 'Stock créé avec succès.' : 'Stock mis à jour avec succès.',
        );
        this.resetStockForm();
        this.loadStocks();
        this.loadEntrepots();
      },
      error: (error: unknown) => {
        this.stockFeedbackState.set('error');
        this.stockFeedbackMessage.set(this.extractErrorMessage(error));
      },
    });
  }

  protected saveMouvement(): void {
    if (
      !this.canWrite() ||
      this.mouvementForm.invalid ||
      this.isMouvementCapacityExceeded() ||
      this.isSubmittingMouvement()
    ) {
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
          this.mouvementFeedbackMessage.set('Mouvement enregistré avec succès.');
          this.resetMouvementForm();
          this.loadStocks();
          this.loadMouvements();
          this.loadEntrepots();
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
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer cette ligne de stock ?',
          message: `${stock.produitNom} ne sera plus suivi dans ${stock.entrepotNom}.`,
          confirmLabel: 'Supprimer',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
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
              this.stockFeedbackMessage.set('Stock supprimé avec succès.');
              if (this.selectedStockId() === stock.id) {
                this.resetStockForm();
              }
              this.loadStocks();
              this.loadEntrepots();
            },
            error: (error: unknown) => {
              this.stockFeedbackState.set('error');
              this.stockFeedbackMessage.set(this.extractErrorMessage(error));
            },
          });
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

  protected selectedStockEntrepot(): Entrepot | null {
    return this.findEntrepot(Number(this.stockForm.controls.entrepotId.value));
  }

  protected selectedMouvementEntrepot(): Entrepot | null {
    return this.findEntrepot(Number(this.mouvementForm.controls.entrepotId.value));
  }

  protected stockCapacityLimit(): number {
    const entrepot = this.selectedStockEntrepot();
    if (!entrepot) {
      return 0;
    }

    const editingStock = this.editingStock();
    if (editingStock?.entrepotId === entrepot.id) {
      const usedCapacityWithoutCurrentStock = entrepot.capaciteUtilisee - editingStock.quantite;
      return Math.max(entrepot.capacite - usedCapacityWithoutCurrentStock, 0);
    }

    return entrepot.capaciteDisponible;
  }

  protected stockCapacityAfterSave(): number {
    return Math.max(this.stockCapacityLimit() - Number(this.stockForm.controls.quantite.value), 0);
  }

  protected isStockCapacityExceeded(): boolean {
    return (
      !!this.selectedStockEntrepot() &&
      Number(this.stockForm.controls.quantite.value) > this.stockCapacityLimit()
    );
  }

  protected mouvementCapacityAfterSave(): number {
    const entrepot = this.selectedMouvementEntrepot();
    if (!entrepot) {
      return 0;
    }

    return Math.max(
      entrepot.capaciteDisponible - Number(this.mouvementForm.controls.quantite.value),
      0,
    );
  }

  protected isMouvementCapacityExceeded(): boolean {
    const entrepot = this.selectedMouvementEntrepot();
    return (
      !!entrepot &&
      this.mouvementForm.controls.type.value === 'ENTREE' &&
      Number(this.mouvementForm.controls.quantite.value) > entrepot.capaciteDisponible
    );
  }

  protected stockCapacitySummary(stock: Stock): string {
    const entrepot = this.findEntrepot(stock.entrepotId);
    return entrepot ? `${entrepot.capaciteDisponible} disponible` : '-';
  }

  protected movementLabel(type: TypeMouvement): string {
    return type === 'ENTREE' ? 'Entrée' : 'Sortie';
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

    this.loadEntrepots();
  }

  private loadEntrepots(): void {
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

  private findEntrepot(entrepotId: number): Entrepot | null {
    return this.entrepots().find((entrepot) => entrepot.id === entrepotId) ?? null;
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
