import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';

import { Alerte } from '../../core/models/alerte.model';
import {
  AdminAnalytics,
  DashboardAnalytics,
  DashboardKpis,
  DashboardStats,
} from '../../core/models/dashboard.model';
import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Pilotage</p>
        <h2>Tableau de bord analytique</h2>
        <p>{{ scopeDescription() }}</p>
      </div>
      <div class="header-badges">
        <span class="chip">{{ roleLabel() }}</span>
        <span class="chip chip--danger">Alertes {{ alertes().length }}</span>
      </div>
    </section>

    @if (feedbackMessage()) {
      <p class="feedback feedback--error">{{ feedbackMessage() }}</p>
    }

    @if (isLoading()) {
      <mat-card class="loading-card">
        <mat-progress-spinner diameter="42" mode="indeterminate" />
        <p>Chargement des indicateurs...</p>
      </mat-card>
    } @else if (stats(); as statsData) {
      @if (kpis(); as kpisData) {
        @if (analytics(); as analyticsData) {
          @if (isAdmin() && adminAnalytics(); as adminData) {
            <mat-card class="analytics-hero">
              <div class="analytics-hero__content">
                <p class="section-eyebrow">Analyse globale</p>
                <h3>Performance multi-entrepôts</h3>
                <p>
                  Les indicateurs consolident la valeur du stock, la pression capacité, les alertes
                  et l'activité récente pour prioriser les décisions.
                </p>
                <div class="hero-metrics">
                  <span>
                    <strong>{{ formatMoney(statsData.valeurTotaleStock) }}</strong>
                    Valeur stock
                  </span>
                  <span>
                    <strong>{{ formatMoney(adminData.valeurMoyenneParEntrepot) }}</strong>
                    Moyenne / entrepôt
                  </span>
                  <span>
                    <strong>{{ adminData.entrepotsEnRisqueCapacite }}</strong>
                    Entrepôts en risque capacité
                  </span>
                </div>
              </div>

              <div class="benchmark-list">
                @for (item of adminData.performanceEntrepots.slice(0, 4); track item.entrepotId) {
                  <div class="benchmark-row">
                    <div>
                      <strong>{{ item.entrepotNom }}</strong>
                      <p>
                        {{ item.mouvementsMois }} mouvements ce mois · {{ item.alertes }} alertes
                      </p>
                    </div>
                    <div class="bar-block">
                      <span>{{ formatMoney(item.valeurStock) }}</span>
                      <span class="bar" aria-hidden="true">
                        <span
                          class="bar__fill"
                          [style.width]="barWidth(item.valeurStock, adminValueMax())"
                          [class.bar__fill--warning]="item.tauxSaturation >= 0.75"
                          [class.bar__fill--danger]="item.tauxSaturation >= 0.9"
                        ></span>
                      </span>
                    </div>
                  </div>
                }
              </div>
            </mat-card>
          }

          <section class="kpi-grid">
            <mat-card class="kpi-card">
              <span class="kpi-card__icon"><mat-icon>payments</mat-icon></span>
              <p>Valeur totale du stock</p>
              <strong>{{ formatMoney(statsData.valeurTotaleStock) }}</strong>
            </mat-card>
            <mat-card class="kpi-card">
              <span class="kpi-card__icon"><mat-icon>category</mat-icon></span>
              <p>Produits actifs</p>
              <strong>{{ kpisData.produitsActifs | number: '1.0-0' }}</strong>
            </mat-card>
            <mat-card class="kpi-card">
              <span class="kpi-card__icon kpi-card__icon--danger"
                ><mat-icon>warning</mat-icon></span
              >
              <p>Risque de rupture</p>
              <strong>{{ formatRate(kpisData.tauxRisqueRupture) }}</strong>
            </mat-card>
            <mat-card class="kpi-card">
              <span class="kpi-card__icon"><mat-icon>warehouse</mat-icon></span>
              <p>Capacité disponible</p>
              <strong>{{ statsData.capaciteDisponible | number: '1.0-0' }}</strong>
            </mat-card>
          </section>

          <section class="dashboard-grid dashboard-grid--main">
            <mat-card class="panel-card panel-card--wide">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Tendance</p>
                  <h3>Mouvements sur 7 jours</h3>
                </div>
                <span class="metric-chip">
                  Couverture
                  {{
                    kpisData.couvertureStockJoursEstimee === null
                      ? 'Indisponible'
                      : (kpisData.couvertureStockJoursEstimee | number: '1.0-0') + ' j'
                  }}
                </span>
              </div>

              <div class="movement-chart">
                @for (point of analyticsData.mouvementsParJour; track point.date) {
                  <div class="movement-day">
                    <div class="movement-day__bars">
                      <span
                        class="vertical-bar vertical-bar--in"
                        [style.height]="barHeight(point.entrees, movementMax())"
                        aria-hidden="true"
                      ></span>
                      <span
                        class="vertical-bar vertical-bar--out"
                        [style.height]="barHeight(point.sorties, movementMax())"
                        aria-hidden="true"
                      ></span>
                    </div>
                    <strong>{{ point.date | date: 'dd/MM' }}</strong>
                    <small>{{ point.entrees }}/{{ point.sorties }}</small>
                  </div>
                }
              </div>

              <div class="legend">
                <span><i class="legend-dot legend-dot--in"></i> Entrées</span>
                <span><i class="legend-dot legend-dot--out"></i> Sorties</span>
              </div>
            </mat-card>

            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Flux</p>
                  <h3>Mouvements</h3>
                </div>
              </div>
              <div class="stats-row">
                <span>Jour</span>
                <strong>+{{ kpisData.entreesJour }}</strong>
                <em>-{{ kpisData.sortiesJour }}</em>
              </div>
              <div class="stats-row">
                <span>Semaine</span>
                <strong>+{{ kpisData.entreesSemaine }}</strong>
                <em>-{{ kpisData.sortiesSemaine }}</em>
              </div>
              <div class="stats-row">
                <span>Mois</span>
                <strong>+{{ kpisData.entreesMois }}</strong>
                <em>-{{ kpisData.sortiesMois }}</em>
              </div>
            </mat-card>
          </section>

          <section class="dashboard-grid">
            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Valeur</p>
                  <h3>Stock par entrepôt</h3>
                </div>
              </div>
              @if (kpisData.valeurStockParEntrepot.length === 0) {
                <p class="empty">Aucune valeur de stock disponible.</p>
              } @else {
                @for (item of kpisData.valeurStockParEntrepot; track item.entrepotId) {
                  <div class="bar-row">
                    <div>
                      <strong>{{ item.entrepotNom }}</strong>
                      <span>{{ formatMoney(item.valeurStock) }}</span>
                    </div>
                    <span class="bar" aria-hidden="true">
                      <span
                        class="bar__fill"
                        [style.width]="barWidth(item.valeurStock, warehouseValueMax())"
                      ></span>
                    </span>
                  </div>
                }
              }
            </mat-card>

            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Capacité</p>
                  <h3>Saturation entrepôts</h3>
                </div>
              </div>
              @if (kpisData.capaciteParEntrepot.length === 0) {
                <p class="empty">Aucune capacité disponible.</p>
              } @else {
                @for (item of kpisData.capaciteParEntrepot; track item.entrepotId) {
                  <div class="bar-row">
                    <div>
                      <strong>{{ item.entrepotNom }}</strong>
                      <span>
                        {{ item.capaciteUtilisee }}/{{ item.capacite }} ·
                        {{ item.capaciteDisponible }} disponible
                      </span>
                    </div>
                    <span class="bar" aria-hidden="true">
                      <span
                        class="bar__fill"
                        [style.width]="barWidth(item.tauxSaturation, 1)"
                        [class.bar__fill--warning]="item.tauxSaturation >= 0.75"
                        [class.bar__fill--danger]="item.tauxSaturation >= 0.9"
                      ></span>
                    </span>
                  </div>
                }
              }
            </mat-card>

            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Catalogue</p>
                  <h3>Top produits mouvementés</h3>
                </div>
              </div>
              @if (analyticsData.topProduitsMouvementes.length === 0) {
                <p class="empty">Aucun mouvement enregistre.</p>
              } @else {
                @for (item of analyticsData.topProduitsMouvementes; track item.produitId) {
                  <div class="bar-row">
                    <div>
                      <strong>{{ item.produitNom }}</strong>
                      <span
                        >{{ item.quantiteMouvementee }} unités ·
                        {{ formatMoney(item.valeurStock) }}</span
                      >
                    </div>
                    <span class="bar" aria-hidden="true">
                      <span
                        class="bar__fill"
                        [style.width]="barWidth(item.quantiteMouvementee, productMovementMax())"
                      ></span>
                    </span>
                  </div>
                }
              }
            </mat-card>
          </section>

          <section class="dashboard-grid dashboard-grid--secondary">
            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Risque</p>
                  <h3>Alertes par gravité</h3>
                </div>
              </div>
              @if (analyticsData.alertesParGravite.length === 0) {
                <p class="empty">Aucune alerte active.</p>
              } @else {
                @for (item of analyticsData.alertesParGravite; track item.priorite) {
                  <div class="list-row">
                    <span
                      class="priority"
                      [class.priority--critical]="item.priorite === 'CRITIQUE'"
                    >
                      {{ item.priorite }}
                    </span>
                    <strong>{{ item.total }}</strong>
                  </div>
                }
              }
            </mat-card>

            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Rotation</p>
                  <h3>Stocks dormants</h3>
                </div>
                <span class="metric-chip">{{ kpisData.stocksDormants }}</span>
              </div>
              @if (analyticsData.stocksDormants.length === 0) {
                <p class="empty">Aucun stock dormant détecté.</p>
              } @else {
                @for (item of analyticsData.stocksDormants; track item.stockId) {
                  <div class="list-row list-row--stack">
                    <div>
                      <strong>{{ item.produitNom }}</strong>
                      <p>{{ item.entrepotNom }} · {{ item.quantite }} unités</p>
                    </div>
                    <span>{{ item.joursSansMouvement }} j</span>
                  </div>
                }
              }
            </mat-card>

            <mat-card class="panel-card">
              <div class="panel-card__header">
                <div>
                  <p class="section-eyebrow">Activite</p>
                  <h3>Entrepôts actifs</h3>
                </div>
              </div>
              @if (analyticsData.entrepotsActifs.length === 0) {
                <p class="empty">Aucune activite recente.</p>
              } @else {
                @for (item of analyticsData.entrepotsActifs; track item.entrepotId) {
                  <div class="bar-row">
                    <div>
                      <strong>{{ item.entrepotNom }}</strong>
                      <span>{{ item.totalMouvements }} mouvements</span>
                    </div>
                    <span class="bar" aria-hidden="true">
                      <span
                        class="bar__fill"
                        [style.width]="barWidth(item.quantiteMouvementee, warehouseActivityMax())"
                      ></span>
                    </span>
                  </div>
                }
              }
            </mat-card>
          </section>

          <mat-card class="table-card">
            <div class="panel-card__header">
              <div>
                <p class="section-eyebrow">Alertes actives</p>
                <h3>Stocks sous seuil</h3>
              </div>
              <span class="metric-chip">{{ alertes().length }}</span>
            </div>

            @if (alertes().length === 0) {
              <p class="empty">Aucun stock sous seuil.</p>
            } @else {
              <div class="table table--alerts" role="table">
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
                    <span
                      role="cell"
                      class="priority"
                      [class.priority--critical]="alerte.priorite === 'CRITIQUE'"
                    >
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
        }
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }

    .page-header,
    .analytics-hero,
    .kpi-card,
    .panel-card,
    .table-card,
    .loading-card {
      border-radius: 8px;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      box-shadow: var(--stockpro-shadow);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
    }

    .page-header__eyebrow,
    .section-eyebrow {
      margin: 0 0 0.35rem;
      color: var(--stockpro-blue);
      text-transform: uppercase;
      letter-spacing: 0;
      font-size: 0.72rem;
      font-weight: 700;
    }

    h2,
    h3 {
      margin: 0;
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 900;
      color: var(--stockpro-ink);
    }

    .page-header p,
    .analytics-hero p {
      margin: 0.55rem 0 0;
      color: var(--stockpro-muted);
      line-height: 1.55;
    }

    .header-badges {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .chip,
    .metric-chip {
      border-radius: 8px;
      padding: 0.25rem 0.7rem;
      background: rgba(29, 95, 168, 0.12);
      color: var(--stockpro-blue);
      font-weight: 700;
      white-space: nowrap;
    }

    .chip--danger {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .feedback {
      margin: 0;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-weight: 600;
    }

    .feedback--error {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .loading-card {
      display: grid;
      place-items: center;
      gap: 0.75rem;
      min-height: 180px;
      padding: 1rem;
      color: var(--stockpro-muted);
    }

    .analytics-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #18202a 0%, #24405f 100%), var(--stockpro-panel);
      color: #fffaf2;
    }

    .analytics-hero h3,
    .analytics-hero .section-eyebrow {
      color: #fffaf2;
    }

    .analytics-hero p {
      color: rgba(255, 250, 242, 0.78);
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
      margin-top: 1rem;
    }

    .hero-metrics span,
    .benchmark-row {
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.75rem;
    }

    .hero-metrics strong {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 1.3rem;
    }

    .benchmark-list {
      display: grid;
      gap: 0.65rem;
    }

    .benchmark-row {
      display: grid;
      gap: 0.65rem;
    }

    .benchmark-row p {
      margin: 0.2rem 0 0;
    }

    .bar-block {
      display: grid;
      gap: 0.35rem;
      color: #fffaf2;
      font-weight: 700;
    }

    .kpi-grid,
    .dashboard-grid {
      display: grid;
      gap: 0.75rem;
    }

    .kpi-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .dashboard-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-grid--main {
      grid-template-columns: minmax(0, 2fr) minmax(280px, 0.9fr);
    }

    .dashboard-grid--secondary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .kpi-card,
    .panel-card,
    .table-card {
      padding: 1rem;
    }

    .kpi-card {
      display: grid;
      gap: 0.45rem;
    }

    .kpi-card__icon {
      display: inline-grid;
      place-items: center;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 8px;
      background: rgba(29, 95, 168, 0.12);
      color: var(--stockpro-blue);
    }

    .kpi-card__icon--danger {
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
    }

    .kpi-card p,
    .empty,
    .bar-row span,
    .list-row p {
      margin: 0;
      color: var(--stockpro-muted);
    }

    .kpi-card strong {
      color: var(--stockpro-ink);
      font-size: 1.45rem;
    }

    .panel-card,
    .table-card {
      display: grid;
      gap: 0.75rem;
    }

    .panel-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .movement-chart {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0.55rem;
      min-height: 210px;
      align-items: end;
      padding-top: 0.5rem;
    }

    .movement-day {
      display: grid;
      gap: 0.4rem;
      justify-items: center;
      color: var(--stockpro-muted);
    }

    .movement-day__bars {
      display: flex;
      align-items: end;
      justify-content: center;
      gap: 0.25rem;
      height: 150px;
      width: 100%;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.04);
      padding: 0.45rem;
    }

    .vertical-bar {
      display: block;
      width: min(34%, 1.1rem);
      min-height: 0.35rem;
      border-radius: 8px 8px 0 0;
      background: var(--stockpro-blue);
    }

    .vertical-bar--out {
      background: var(--stockpro-danger);
    }

    .movement-day strong {
      color: var(--stockpro-ink);
      font-size: 0.82rem;
    }

    .legend {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.9rem;
      color: var(--stockpro-muted);
      font-weight: 700;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .legend-dot {
      display: inline-block;
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 8px;
      background: var(--stockpro-blue);
    }

    .legend-dot--out {
      background: var(--stockpro-danger);
    }

    .stats-row,
    .list-row,
    .bar-row {
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.05);
      padding: 0.65rem 0.75rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 0.55rem;
      align-items: center;
    }

    .stats-row strong {
      color: #1f8a5b;
    }

    .stats-row em {
      color: var(--stockpro-danger);
      font-style: normal;
      font-weight: 700;
    }

    .bar-row {
      display: grid;
      gap: 0.45rem;
    }

    .bar-row > div,
    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .list-row--stack {
      align-items: flex-start;
    }

    .bar,
    .bar__fill {
      display: block;
      border-radius: 8px;
    }

    .bar {
      height: 0.55rem;
      overflow: hidden;
      background: rgba(22, 33, 47, 0.11);
    }

    .analytics-hero .bar {
      background: rgba(255, 255, 255, 0.2);
    }

    .bar__fill {
      height: 100%;
      min-width: 0.35rem;
      background: var(--stockpro-blue);
    }

    .analytics-hero .bar__fill {
      background: #f4c55d;
    }

    .bar__fill--warning {
      background: #c98a14;
    }

    .bar__fill--danger {
      background: var(--stockpro-danger);
    }

    .priority {
      width: max-content;
      border-radius: 8px;
      padding: 0.25rem 0.65rem;
      color: #8f5a00;
      background: rgba(244, 197, 93, 0.18);
      font-weight: 800;
      font-size: 0.78rem;
    }

    .priority--critical {
      color: var(--stockpro-danger);
      background: rgba(209, 77, 65, 0.12);
    }

    .table {
      display: grid;
      gap: 0.5rem;
    }

    .table__row {
      display: grid;
      gap: 0.7rem;
      align-items: center;
      padding: 0.8rem;
      border-radius: 8px;
      background: rgba(22, 33, 47, 0.05);
    }

    .table__row--head {
      background: transparent;
      color: var(--stockpro-muted);
      font-weight: 700;
      padding: 0 0.2rem 0.15rem;
    }

    .table--alerts .table__row {
      grid-template-columns:
        minmax(95px, 0.55fr) minmax(150px, 1fr) minmax(130px, 0.8fr)
        minmax(80px, 0.45fr) minmax(80px, 0.45fr) minmax(180px, 1.1fr);
    }

    @media (max-width: 1180px) {
      .analytics-hero,
      .dashboard-grid,
      .dashboard-grid--main,
      .dashboard-grid--secondary {
        grid-template-columns: 1fr;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .table--alerts .table__row {
        grid-template-columns: 1fr;
      }

      .table__row--head {
        display: none;
      }
    }

    @media (max-width: 680px) {
      .page-header,
      .hero-metrics,
      .bar-row > div,
      .list-row {
        display: grid;
      }

      .header-badges {
        justify-content: flex-start;
      }

      .kpi-grid,
      .movement-chart {
        grid-template-columns: 1fr;
      }

      .movement-day {
        grid-template-columns: 70px 1fr auto;
        align-items: center;
        justify-items: stretch;
      }

      .movement-day__bars {
        height: 42px;
      }

      .vertical-bar {
        width: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly alerteService = inject(AlerteService);

  protected readonly isLoading = signal(true);
  protected readonly feedbackMessage = signal('');

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly kpis = signal<DashboardKpis | null>(null);
  protected readonly analytics = signal<DashboardAnalytics | null>(null);
  protected readonly adminAnalytics = signal<AdminAnalytics | null>(null);
  protected readonly alertes = signal<Alerte[]>([]);

  protected readonly isAdmin = computed(() => this.authService.hasRole('ADMIN'));

  protected readonly movementMax = computed(() => {
    const points = this.analytics()?.mouvementsParJour ?? [];
    return Math.max(0, ...points.flatMap((point) => [point.entrees, point.sorties]));
  });

  protected readonly warehouseValueMax = computed(() => {
    const items = this.kpis()?.valeurStockParEntrepot ?? [];
    return Math.max(0, ...items.map((item) => item.valeurStock));
  });

  protected readonly productMovementMax = computed(() => {
    const items = this.analytics()?.topProduitsMouvementes ?? [];
    return Math.max(0, ...items.map((item) => item.quantiteMouvementee));
  });

  protected readonly warehouseActivityMax = computed(() => {
    const items = this.analytics()?.entrepotsActifs ?? [];
    return Math.max(0, ...items.map((item) => item.quantiteMouvementee));
  });

  protected readonly adminValueMax = computed(() => {
    const items = this.adminAnalytics()?.performanceEntrepots ?? [];
    return Math.max(0, ...items.map((item) => item.valeurStock));
  });

  constructor() {
    this.loadDashboard();
  }

  protected formatMoney(value: number | null | undefined): string {
    return `${new Intl.NumberFormat('fr-TN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value ?? 0)} DT`;
  }

  protected formatRate(value: number | null | undefined): string {
    return `${Math.round((value ?? 0) * 1000) / 10} %`;
  }

  protected barWidth(value: number, max: number): string {
    if (max <= 0 || value <= 0) {
      return '0%';
    }

    return `${Math.min(100, Math.max(4, (value / max) * 100))}%`;
  }

  protected barHeight(value: number, max: number): string {
    if (max <= 0 || value <= 0) {
      return '0.35rem';
    }

    return `${Math.min(100, Math.max(8, (value / max) * 100))}%`;
  }

  protected scopeDescription(): string {
    if (this.isAdmin()) {
      return 'Vue globale multi-entrepôts des performances, risques, capacités et flux.';
    }

    return 'Vue opérationnelle filtrée sur votre entrepôt affecté, avec les indicateurs disponibles selon votre rôle.';
  }

  protected roleLabel(): string {
    const role = this.authService.currentUser()?.role;

    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    if (role === 'GESTIONNAIRE') {
      return 'Gestionnaire';
    }

    return 'Observateur';
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.feedbackMessage.set('');

    const adminRequest = this.isAdmin() ? this.dashboardService.getAdminAnalytics() : of(null);

    forkJoin({
      stats: this.dashboardService.getStats(),
      kpis: this.dashboardService.getKpis(),
      analytics: this.dashboardService.getAnalytics(),
      alertes: this.alerteService.findAll(),
      adminAnalytics: adminRequest,
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.kpis.set(data.kpis);
        this.analytics.set(data.analytics);
        this.alertes.set(data.alertes);
        this.adminAnalytics.set(data.adminAnalytics);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.feedbackMessage.set(this.extractErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Une erreur est survenue pendant le chargement du dashboard.';
    }

    return 'Une erreur est survenue pendant le chargement du dashboard.';
  }
}
