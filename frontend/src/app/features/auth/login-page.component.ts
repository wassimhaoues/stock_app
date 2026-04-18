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
        <p class="login-copy__eyebrow">Phase 2</p>
        <h1>Authentification JWT et gestion des roles.</h1>
        <p>
          Connectez-vous avec un compte seedé pour acceder aux routes protegees et a
          l'administration des utilisateurs.
        </p>

        <div class="credentials">
          <div>
            <strong>ADMIN</strong>
            <span>admin@stockpro.local / Admin123!</span>
          </div>
          <div>
            <strong>GESTIONNAIRE</strong>
            <span>gestionnaire@stockpro.local / Gestion123!</span>
          </div>
          <div>
            <strong>OBSERVATEUR</strong>
            <span>observateur@stockpro.local / Observe123!</span>
          </div>
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
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 420px);
      gap: 1.5rem;
      min-height: calc(100dvh - 3rem);
      align-items: stretch;
    }

    .login-copy,
    .login-card {
      border-radius: 1.75rem;
      border: 1px solid var(--stockpro-line);
      background: var(--stockpro-panel);
      box-shadow: 0 18px 40px rgba(22, 33, 47, 0.08);
    }

    .login-copy {
      padding: 2rem;
      color: var(--stockpro-ink);
      background:
        radial-gradient(circle at top left, rgba(29, 95, 168, 0.16), transparent 35%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 247, 234, 0.9));
    }

    .login-copy__eyebrow,
    .login-card__eyebrow {
      margin: 0 0 0.75rem;
      color: var(--stockpro-blue);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .login-copy h1,
    .login-card h2 {
      margin: 0;
      font-family: 'Playfair Display', serif;
    }

    .login-copy h1 {
      font-size: clamp(2.2rem, 4vw, 4rem);
      line-height: 1.02;
      max-width: 10ch;
    }

    .login-copy p {
      max-width: 52ch;
      color: var(--stockpro-muted);
      line-height: 1.65;
    }

    .credentials {
      display: grid;
      gap: 0.75rem;
      margin-top: 2rem;
    }

    .credentials div {
      display: grid;
      gap: 0.2rem;
      padding: 1rem 1.1rem;
      border-radius: 1rem;
      background: rgba(22, 33, 47, 0.05);
    }

    .credentials strong {
      color: var(--stockpro-ink);
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
      border-radius: 999px;
    }

    .error {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
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
