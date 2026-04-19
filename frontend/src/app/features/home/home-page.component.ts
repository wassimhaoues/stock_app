import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, map, of, startWith } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

type ViewModel =
  | { state: 'loading' }
  | { state: 'success'; application: string; status: string; checkedAt: Date }
  | { state: 'error'; message: string };

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="hero">
      <div class="hero__copy">
        <p class="hero__eyebrow">Phase 2 active</p>
        <h2>Backend Spring, login JWT et routes protegees fonctionnent ensemble.</h2>
        <p class="hero__text">
          Cette page confirme la disponibilite de l'API et l'activation de votre session
          authentifiee pour la Phase 2.
        </p>
        <mat-chip-set>
          <mat-chip class="chip chip--success">Session active</mat-chip>
          <mat-chip>{{ authService.currentUser()?.role }}</mat-chip>
        </mat-chip-set>
      </div>

      <mat-card class="hero__card">
        @switch (viewModel().state) {
          @case ('loading') {
            <div class="state state--loading">
              <mat-progress-spinner diameter="48" mode="indeterminate" />
              <div>
                <h3>Connexion en cours</h3>
                <p>On verifie la sante du backend Spring Boot.</p>
              </div>
            </div>
          }
          @case ('success') {
            <div class="state state--success">
              <div class="state__icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div>
                <mat-chip-set>
                  <mat-chip class="chip chip--success">Backend connecte</mat-chip>
                </mat-chip-set>
                <h3>{{ successState()?.application }}</h3>
                <p>L'API repond avec le statut <strong>{{ successState()?.status }}</strong>.</p>
                <p class="state__meta">
                  Derniere verification : {{ successState()?.checkedAt | date: 'HH:mm:ss' }}
                </p>
              </div>
            </div>
          }
          @default {
            <div class="state state--error">
              <div class="state__icon">
                <mat-icon>error</mat-icon>
              </div>
              <div>
                <mat-chip-set>
                  <mat-chip class="chip chip--error">Connexion indisponible</mat-chip>
                </mat-chip-set>
                <h3>Le backend ne repond pas encore</h3>
                <p>{{ errorMessage() }}</p>
                <button mat-flat-button type="button" color="primary" (click)="reload()">
                  Reessayer
                </button>
              </div>
            </div>
          }
        }
      </mat-card>
    </section>

    <section class="grid">
      <mat-card class="info-card">
        <div class="info-card__icon"><mat-icon>account_tree</mat-icon></div>
        <h3>Routing lazy-loaded</h3>
        <p>La page d'accueil est chargee via <code>loadComponent</code> pour poser la base des futurs modules.</p>
      </mat-card>

      <mat-card class="info-card">
        <div class="info-card__icon"><mat-icon>view_sidebar</mat-icon></div>
        <h3>Routes protegees</h3>
        <p>Le shell principal n'est accessible qu'apres connexion et s'adapte au role courant.</p>
      </mat-card>

      <mat-card class="info-card">
        <div class="info-card__icon"><mat-icon>admin_panel_settings</mat-icon></div>
        <h3>Roles utilisateur</h3>
        <p>L'ADMIN peut acceder a la gestion des utilisateurs, tandis que les autres roles restent limites.</p>
      </mat-card>
    </section>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      gap: 1.5rem;
      align-items: stretch;
    }

    .hero__copy,
    .hero__card,
    .info-card {
      border-radius: 1.75rem;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 40px rgba(22, 33, 47, 0.08);
    }

    .hero__copy {
      padding: 2rem;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 247, 234, 0.92)),
        linear-gradient(145deg, rgba(244, 197, 93, 0.12), transparent);
    }

    .hero__eyebrow {
      margin: 0 0 0.75rem;
      color: var(--stockpro-blue);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-weight: 700;
      font-size: 0.78rem;
    }

    h2,
    h3 {
      margin: 0;
      font-family: 'Playfair Display', serif;
      color: var(--stockpro-ink);
    }

    h2 {
      font-size: clamp(2rem, 3vw, 3.3rem);
      line-height: 1.05;
      max-width: 13ch;
    }

    .hero__text {
      margin: 1rem 0 0;
      max-width: 58ch;
      color: var(--stockpro-muted);
      font-size: 1.05rem;
      line-height: 1.65;
    }

    code {
      padding: 0.12rem 0.4rem;
      border-radius: 0.45rem;
      background: rgba(22, 33, 47, 0.08);
      font-size: 0.92em;
    }

    .hero__card {
      padding: 1.5rem;
    }

    .state {
      display: flex;
      height: 100%;
      align-items: center;
      gap: 1rem;
    }

    .state__icon {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: 1.25rem;
      flex: 0 0 auto;
      font-size: 2rem;
    }

    .state--success .state__icon {
      color: var(--stockpro-green);
      background: rgba(29, 122, 92, 0.12);
    }

    .state--error .state__icon {
      color: var(--stockpro-danger);
      background: rgba(209, 77, 65, 0.12);
    }

    .state--loading {
      justify-content: center;
    }

    .state p {
      margin: 0.6rem 0 0;
      color: var(--stockpro-muted);
      line-height: 1.55;
    }

    .state__meta {
      font-size: 0.92rem;
    }

    .chip {
      border-radius: 999px;
      font-weight: 700;
    }

    .chip--success {
      background: rgba(29, 122, 92, 0.12);
      color: var(--stockpro-green);
    }

    .chip--error {
      background: rgba(209, 77, 65, 0.12);
      color: var(--stockpro-danger);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .info-card {
      padding: 1.5rem;
    }

    .info-card p {
      margin: 0.8rem 0 0;
      color: var(--stockpro-muted);
      line-height: 1.55;
    }

    .info-card__icon {
      display: inline-grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 1rem;
      border-radius: 1rem;
      color: var(--stockpro-blue);
      background: rgba(29, 95, 168, 0.12);
    }

    @media (max-width: 1100px) {
      .hero {
        grid-template-columns: 1fr;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly healthService = inject(HealthService);
  protected readonly authService = inject(AuthService);

  protected readonly viewModel = toSignal(this.createViewModel(), {
    initialValue: { state: 'loading' } as ViewModel,
  });

  protected reload(): void {
    window.location.reload();
  }

  protected successState() {
    const state = this.viewModel();
    return state.state === 'success' ? state : null;
  }

  protected errorMessage() {
    const state = this.viewModel();
    return state.state === 'error' ? state.message : '';
  }

  private createViewModel() {
    return this.healthService.getHealth().pipe(
      map(
        (response) =>
          ({
            state: 'success',
            application: response.application,
            status: response.status,
            checkedAt: new Date(),
          }) satisfies ViewModel
      ),
      catchError(() =>
        of({
          state: 'error',
          message:
            "Demarre le backend avec le port defini dans infra/.env, puis recharge la page pour afficher 'Backend connecte'.",
        } satisfies ViewModel)
      ),
      startWith({ state: 'loading' } satisfies ViewModel)
    );
  }
}
