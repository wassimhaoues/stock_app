import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

type SidebarEntry = {
  label: string;
  icon: string;
  route?: string;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, MatListModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar__intro">
        <p class="sidebar__kicker">Phase 2</p>
        <h1>Connexion JWT, roles et acces protege en place.</h1>
        <p>
          Votre session determine les routes visibles et l'ADMIN peut maintenant gerer
          les comptes utilisateurs.
        </p>
      </div>

      <mat-nav-list class="sidebar__nav">
        @for (entry of entries(); track entry.label) {
          @if (entry.route) {
            <a
              mat-list-item
              [routerLink]="entry.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              <mat-icon matListItemIcon>{{ entry.icon }}</mat-icon>
              <span matListItemTitle>{{ entry.label }}</span>
            </a>
          } @else {
            <div mat-list-item class="coming-soon">
              <mat-icon matListItemIcon>{{ entry.icon }}</mat-icon>
              <span matListItemTitle>{{ entry.label }}</span>
              <span class="chip">Bientot</span>
            </div>
          }
        }
      </mat-nav-list>
    </aside>
  `,
  styles: `
    .sidebar {
      display: flex;
      height: 100%;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background:
        linear-gradient(180deg, rgba(22, 33, 47, 0.96), rgba(31, 57, 86, 0.95)),
        linear-gradient(135deg, rgba(244, 197, 93, 0.18), transparent);
      color: #f9f6f1;
    }

    .sidebar__intro {
      padding: 1rem;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .sidebar__kicker {
      margin: 0 0 0.5rem;
      color: #f4c55d;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.74rem;
      font-weight: 700;
    }

    h1 {
      margin: 0 0 0.75rem;
      font-family: 'Playfair Display', serif;
      font-size: 1.65rem;
      line-height: 1.1;
    }

    p {
      margin: 0;
      color: rgba(249, 246, 241, 0.86);
      line-height: 1.5;
    }

    .sidebar__nav {
      display: grid;
      gap: 0.5rem;
    }

    a[mat-list-item],
    .coming-soon {
      border-radius: 1rem;
      color: inherit;
      background: rgba(255, 255, 255, 0.04);
    }

    a.active {
      background: rgba(244, 197, 93, 0.16);
    }

    .chip {
      margin-left: auto;
      border-radius: 999px;
      padding: 0.2rem 0.65rem;
      font-size: 0.72rem;
      color: #16212f;
      background: #f4c55d;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  protected readonly entries = computed<SidebarEntry[]>(() => {
    const commonEntries: SidebarEntry[] = [
      { label: 'Accueil', icon: 'home', route: '/' },
      { label: 'Entrepots', icon: 'warehouse', route: '/entrepots' },
      { label: 'Produits', icon: 'category' },
      { label: 'Stocks', icon: 'inventory' },
    ];

    if (this.authService.hasRole('ADMIN')) {
      return [
        ...commonEntries.slice(0, 1),
        { label: 'Utilisateurs', icon: 'group', route: '/utilisateurs' },
        ...commonEntries.slice(1),
      ];
    }

    return commonEntries;
  });
}
