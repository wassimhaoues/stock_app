import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
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
    <section class="login-shell">
      <div class="login-copy">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">SP</span>
          <div>
            <p class="login-copy__eyebrow">StockPro</p>
            <h1>Gestion des stocks multi-entrepôts</h1>
          </div>
        </div>

        <p>
          Suivez les stocks, les mouvements, les capacités et les alertes dans une interface
          unifiée pour chaque rôle opérationnel.
        </p>

        <div class="login-highlights" aria-label="Points clés StockPro">
          <span><mat-icon>warehouse</mat-icon> Entrepôts</span>
          <span><mat-icon>inventory_2</mat-icon> Stocks</span>
          <span><mat-icon>monitoring</mat-icon> Indicateurs</span>
        </div>
      </div>

      <mat-card class="login-card">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="login-card__header">
            <p class="login-card__eyebrow">Connexion</p>
            <h2>Bienvenue dans StockPro</h2>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
            <mat-icon matSuffix>mail</mat-icon>
            @if (form.controls.email.hasError('required')) {
              <mat-error>Email requis</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input
              matInput
              [type]="hidePassword() ? 'password' : 'text'"
              formControlName="motDePasse"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              [attr.aria-label]="hidePassword() ? 'Afficher le mot de passe' : 'Masquer le mot de passe'"
              (click)="hidePassword.set(!hidePassword())"
            >
              <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
            </button>
            @if (form.controls.motDePasse.hasError('required')) {
              <mat-error>Mot de passe requis</mat-error>
            }
          </mat-form-field>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <button mat-flat-button type="submit" [disabled]="form.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" />
            } @else {
              <span>Se connecter</span>
            }
          </button>
        </form>
      </mat-card>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      padding: 1.5rem;
    }

    .login-shell {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 420px);
      gap: 1.5rem;
      min-height: calc(100dvh - 3rem);
      align-items: stretch;
    }

    .login-copy,
    .login-card {
      border-radius: 8px;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      box-shadow: var(--stockpro-shadow);
    }

    .login-copy {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2rem;
      color: #f8fafc;
      background: linear-gradient(135deg, #18202a 0%, #24405f 100%);
    }

    .brand-lockup {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .brand-mark {
      display: inline-grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      flex: 0 0 auto;
      border-radius: 8px;
      background: #f8fafc;
      color: #18202a;
      font-weight: 900;
    }

    .login-copy__eyebrow,
    .login-card__eyebrow {
      margin: 0 0 0.75rem;
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 0;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .login-card__eyebrow {
      color: var(--stockpro-blue);
    }

    .login-copy h1,
    .login-card h2 {
      margin: 0;
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 900;
    }

    .login-copy h1 {
      font-size: 3rem;
      line-height: 1.05;
      max-width: 12ch;
    }

    .login-copy p {
      max-width: 52ch;
      color: rgba(248, 250, 252, 0.78);
      line-height: 1.65;
    }

    .login-highlights {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 2rem;
    }

    .login-highlights span {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      font-weight: 800;
    }

    .login-card {
      display: grid;
      align-content: center;
      padding: 1.5rem;
    }

    form {
      display: grid;
      gap: 1rem;
    }

    .login-card__header {
      margin-bottom: 0.25rem;
    }

    mat-form-field {
      width: 100%;
    }

    button[mat-flat-button] {
      min-height: 52px;
      border-radius: 8px;
    }

    .error {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      background: rgba(209, 77, 65, 0.1);
      color: var(--stockpro-danger);
      font-weight: 600;
    }

    @media (max-width: 900px) {
      :host {
        padding: 1rem;
      }

      .login-shell {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .login-copy h1 {
        font-size: 2.25rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly hidePassword = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse) {
            this.errorMessage.set(error.error?.message ?? 'Connexion impossible');
            return;
          }

          this.errorMessage.set('Connexion impossible');
        },
      });
  }
}
