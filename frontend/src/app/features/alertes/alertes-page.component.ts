import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { Alerte } from '../../core/models/alerte.model';
import { AuthService } from '../../core/services/auth.service';
import { AlerteService } from '../../core/services/alerte.service';

@Component({
  selector: 'app-alertes-page',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Surveillance</p>
        <h2>Alertes stock</h2>
        <p>
          {{
            isGlobalView()
              ? 'Stocks sous seuil critique sur tous les entrepôts.'
              : 'Stocks sous seuil critique dans votre entrepôt affecté.'
          }}
        </p>
      </div>
      <span class="count count--danger">{{ alertes().length }}</span>
    </section>

    <section class="summary-grid">
      <mat-card class="summary-card">
        <mat-icon>priority_high</mat-icon>
        <span>{{ criticalAlerts() }}</span>
        <p>Critiques</p>
      </mat-card>
      <mat-card class="summary-card">
        <mat-icon>notification_important</mat-icon>
        <span>{{ highAlerts() }}</span>
        <p>Élevées</p>
      </mat-card>
      <mat-card class="summary-card">
        <mat-icon>inventory_2</mat-icon>
        <span>{{ totalMissing() }}</span>
        <p>Unités à reconstituer</p>
      </mat-card>
    </section>

    <mat-card class="list-card">
      <div class="card-header">
        <div>
          <p class="card-header__eyebrow">Priorités</p>
          <h3>Alertes actives</h3>
        </div>
      </div>

      @if (feedbackMessage()) {
        <p class="feedback feedback--error">{{ feedbackMessage() }}</p>
      }

      @if (isLoading()) {
        <div class="empty-state">
          <mat-progress-spinner diameter="40" mode="indeterminate" />
          <p>Chargement des alertes...</p>
        </div>
      } @else if (alertes().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <p>Aucune alerte active.</p>
        </div>
      } @else {
        <div class="table" role="table">
          <div class="table__row table__row--head" role="row">
            <span role="columnheader">Priorité</span>
            <span role="columnheader">Produit</span>
            <span role="columnheader">Entrepôt</span>
            <span role="columnheader">Quantité</span>
            <span role="columnheader">Seuil</span>
            <span role="columnheader">Action attendue</span>
          </div>

          @for (alerte of alertes(); track alerte.stockId) {
            <article class="table__row" role="row">
              <span role="cell" class="status" [class.status--critical]="alerte.priorite === 'CRITIQUE'">
                {{ alerte.priorite }}
              </span>
              <strong role="cell">{{ alerte.produitNom }}</strong>
              <span role="cell">{{ alerte.entrepotNom }}</span>
              <span role="cell">{{ alerte.quantite }}</span>
              <span role="cell">{{ alerte.seuilAlerte }}</span>
              <span role="cell">{{ alerte.actionAttendue }}</span>
            </article>
          }
        </div>
      }
    </mat-card>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .page-header,
    .summary-card,
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

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .summary-card {
      display: grid;
      gap: 0.35rem;
      padding: 1.25rem;
    }

    .summary-card mat-icon {
      color: var(--stockpro-danger);
    }

    .summary-card span {
      font-size: 2rem;
      font-weight: 800;
      color: var(--stockpro-ink);
    }

    .summary-card p {
      margin: 0;
      color: var(--stockpro-muted);
      font-weight: 700;
    }

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

    .count--danger,
    .status--critical {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .feedback {
      margin: 0 0 1rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-weight: 600;
    }

    .feedback--error {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .table {
      display: grid;
      gap: 0.65rem;
    }

    .table__row {
      display: grid;
      grid-template-columns:
        minmax(95px, 0.55fr) minmax(150px, 1fr) minmax(130px, 0.9fr)
        minmax(80px, 0.45fr) minmax(80px, 0.45fr) minmax(190px, 1.1fr);
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.1rem;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.04);
    }

    .table__row--head {
      background: transparent;
      color: var(--stockpro-muted);
      font-weight: 700;
      padding-block: 0.4rem;
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
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .summary-grid,
      .table__row {
        grid-template-columns: 1fr;
      }

      .table__row--head {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertesPageComponent {
  private readonly alerteService = inject(AlerteService);
  private readonly authService = inject(AuthService);

  protected readonly alertes = signal<Alerte[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly feedbackMessage = signal('');
  protected readonly isGlobalView = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly criticalAlerts = computed(
    () => this.alertes().filter((alerte) => alerte.priorite === 'CRITIQUE').length
  );
  protected readonly highAlerts = computed(
    () => this.alertes().filter((alerte) => alerte.priorite !== 'CRITIQUE').length
  );
  protected readonly totalMissing = computed(() =>
    this.alertes().reduce((total, alerte) => total + alerte.manque, 0)
  );

  constructor() {
    this.loadAlertes();
  }

  private loadAlertes(): void {
    this.isLoading.set(true);
    this.alerteService
      .findAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (alertes) => this.alertes.set(alertes),
        error: (error: unknown) => this.feedbackMessage.set(this.extractErrorMessage(error)),
      });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Une erreur est survenue.';
    }

    return 'Une erreur est survenue.';
  }
}
