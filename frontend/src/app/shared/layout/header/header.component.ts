import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  template: `
    <mat-toolbar class="header">
      <button
        type="button"
        matIconButton
        class="menu-button"
        aria-label="Ouvrir le menu"
        (click)="menuToggle.emit()"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <div class="brand">
        <span class="brand__eyebrow">Systeme multi-entrepots</span>
        <span class="brand__title">StockPro</span>
      </div>

      <span class="spacer"></span>

      <div class="status">
        <mat-icon>verified_user</mat-icon>
        <span>{{ authService.currentUser()?.role }}</span>
      </div>

      <div class="user">
        <div class="user__copy">
          <span class="user__name">{{ authService.currentUser()?.nom }}</span>
          <span class="user__email">{{ authService.currentUser()?.email }}</span>
        </div>
        <button mat-stroked-button type="button" (click)="logout()">
          <mat-icon>logout</mat-icon>
          Deconnexion
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: `
    .header {
      position: sticky;
      top: 0;
      z-index: 5;
      gap: 1rem;
      min-height: 76px;
      padding: 0 1rem;
      color: var(--stockpro-ink);
      background: rgba(255, 250, 242, 0.82);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--stockpro-line);
    }

    .menu-button {
      display: none;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .brand__eyebrow {
      font-size: 0.78rem;
      color: var(--stockpro-muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .brand__title {
      font-family: 'Playfair Display', serif;
      font-size: 1.55rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .spacer {
      flex: 1;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      background: rgba(29, 122, 92, 0.1);
      color: var(--stockpro-green);
      font-weight: 600;
    }

    .user {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user__copy {
      display: flex;
      flex-direction: column;
      text-align: right;
      line-height: 1.2;
    }

    .user__name {
      font-weight: 700;
      color: var(--stockpro-ink);
    }

    .user__email {
      color: var(--stockpro-muted);
      font-size: 0.86rem;
    }

    @media (max-width: 900px) {
      .menu-button {
        display: inline-flex;
      }

      .status {
        display: none;
      }

      .user__copy {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);

  @Output() readonly menuToggle = new EventEmitter<void>();

  protected logout(): void {
    this.authService.logout({ redirect: true });
  }
}
