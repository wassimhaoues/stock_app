import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AlerteService } from '../../../core/services/alerte.service';

type SidebarEntry = {
  label: string;
  icon: string;
  route: string;
  badge?: number;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <aside class="sidebar" [class.sidebar--collapsed]="collapsed">
      <div class="sidebar__intro">
        <span class="sidebar__mark" aria-hidden="true">SP</span>
        <div class="sidebar__brand-copy">
          <p class="sidebar__kicker">StockPro</p>
          <h1>Gestion des stocks</h1>
        </div>
      </div>

      @if (canCollapse) {
        <button
          mat-icon-button
          type="button"
          class="sidebar__toggle"
          [attr.aria-label]="collapsed ? 'Déployer le menu' : 'Réduire le menu'"
          [matTooltip]="collapsed ? 'Déployer' : 'Réduire'"
          matTooltipPosition="right"
          (click)="toggleCollapsed()"
        >
          <mat-icon>{{
            collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'
          }}</mat-icon>
        </button>
      }

      <mat-nav-list class="sidebar__nav" aria-label="Navigation principale">
        @for (entry of entries(); track entry.label) {
          <a
            mat-list-item
            [routerLink]="entry.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            [matTooltip]="collapsed ? entry.label : ''"
            matTooltipPosition="right"
          >
            <mat-icon matListItemIcon>{{ entry.icon }}</mat-icon>
            <span matListItemTitle class="nav-label">{{ entry.label }}</span>
            @if (entry.badge && !collapsed) {
              <span class="chip chip--alert" aria-label="Alertes actives">{{ entry.badge }}</span>
            } @else if (entry.badge && collapsed) {
              <span class="nav-dot" aria-label="Alertes actives">{{ entry.badge }}</span>
            }
          </a>
        }
      </mat-nav-list>
    </aside>
  `,
  styles: `
    .sidebar {
      display: flex;
      height: 100%;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      overflow: hidden;
      background: linear-gradient(180deg, #111827 0%, #172033 100%);
      color: #f8fafc;
    }

    .sidebar__intro {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      transition:
        padding 180ms ease,
        background 180ms ease;
    }

    .sidebar__mark {
      display: inline-grid;
      place-items: center;
      width: 2.65rem;
      height: 2.65rem;
      border-radius: 8px;
      background: #f8fafc;
      color: #18202a;
      font-weight: 900;
    }

    .sidebar__brand-copy {
      min-width: 0;
    }

    .sidebar__kicker {
      margin: 0 0 0.15rem;
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 0;
      font-size: 0.74rem;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: 1.05rem;
      line-height: 1.15;
      font-weight: 800;
    }

    .sidebar__nav {
      display: grid;
      gap: 0.5rem;
    }

    a[mat-list-item],
    a[mat-list-item]:visited {
      --mdc-list-list-item-label-text-color: rgba(248, 250, 252, 0.9);
      --mdc-list-list-item-hover-label-text-color: #ffffff;
      --mdc-list-list-item-focus-label-text-color: #ffffff;
      --mdc-list-list-item-leading-icon-color: rgba(226, 232, 240, 0.86);
      --mdc-list-list-item-hover-leading-icon-color: #ffffff;
      --mdc-list-list-item-focus-leading-icon-color: #ffffff;
      --mdc-list-list-item-hover-state-layer-color: #ffffff;
      --mdc-list-list-item-focus-state-layer-color: #ffffff;
      --mdc-list-list-item-hover-state-layer-opacity: 0.08;
      --mdc-list-list-item-focus-state-layer-opacity: 0.12;
      border-radius: 8px;
      color: rgba(248, 250, 252, 0.9);
      background: transparent;
      transition:
        background 160ms ease,
        color 160ms ease,
        transform 160ms ease;
    }

    a.active {
      --mdc-list-list-item-label-text-color: #ffffff;
      --mdc-list-list-item-leading-icon-color: #7dd3fc;
      background: rgba(255, 255, 255, 0.11);
      color: #ffffff;
    }

    a[mat-list-item]:hover {
      transform: translateX(2px);
    }

    a[mat-list-item] mat-icon {
      color: inherit;
    }

    :host ::ng-deep .sidebar a[mat-list-item] .mdc-list-item__primary-text,
    :host ::ng-deep .sidebar a[mat-list-item] .mat-mdc-list-item-title {
      color: inherit;
    }

    :host ::ng-deep .sidebar a[mat-list-item] .mat-mdc-list-item-icon {
      color: rgba(226, 232, 240, 0.86);
    }

    :host ::ng-deep .sidebar a.active .mat-mdc-list-item-icon {
      color: #7dd3fc;
    }

    .nav-label {
      color: inherit;
      font-weight: 750;
    }

    .sidebar__toggle {
      align-self: flex-end;
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .chip {
      margin-left: auto;
      border-radius: 8px;
      padding: 0.2rem 0.65rem;
      font-size: 0.72rem;
      color: #16212f;
      background: #7dd3fc;
      font-weight: 700;
    }

    .chip--alert {
      color: #fff;
      background: var(--stockpro-danger);
    }

    .nav-dot {
      display: inline-grid;
      place-items: center;
      position: absolute;
      top: 0.35rem;
      right: 0.45rem;
      min-width: 1.05rem;
      height: 1.05rem;
      padding: 0 0.2rem;
      border-radius: 999px;
      background: var(--stockpro-danger);
      color: #fff;
      font-size: 0.62rem;
      font-weight: 900;
      line-height: 1;
    }

    .sidebar--collapsed {
      align-items: center;
      padding-inline: 0.55rem;
    }

    .sidebar--collapsed .sidebar__intro {
      justify-content: center;
      width: 100%;
      padding: 0.55rem;
      background: transparent;
      border-color: transparent;
    }

    .sidebar--collapsed .sidebar__mark {
      width: 2.45rem;
      height: 2.45rem;
    }

    .sidebar--collapsed .sidebar__brand-copy,
    .sidebar--collapsed .nav-label,
    .sidebar--collapsed .chip {
      display: none;
    }

    .sidebar--collapsed .sidebar__toggle {
      align-self: center;
      width: 2.45rem;
      height: 2.45rem;
    }

    .sidebar--collapsed .sidebar__nav {
      width: 100%;
      justify-items: center;
    }

    .sidebar--collapsed a[mat-list-item] {
      position: relative;
      width: 2.75rem;
      height: 2.75rem;
      padding: 0;
      justify-content: center;
    }

    .sidebar--collapsed a[mat-list-item]:hover {
      transform: none;
    }

    .sidebar--collapsed a[mat-list-item] mat-icon {
      margin: 0;
    }

    :host ::ng-deep .sidebar--collapsed a[mat-list-item] .mdc-list-item__content {
      display: none;
    }

    :host ::ng-deep .sidebar--collapsed a[mat-list-item] .mdc-list-item__start,
    :host ::ng-deep .sidebar--collapsed a[mat-list-item] .mat-mdc-list-item-icon {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() canCollapse = true;
  @Output() readonly collapsedChange = new EventEmitter<boolean>();

  private readonly alerteService = inject(AlerteService);
  private readonly authService = inject(AuthService);
  private readonly alertCount = signal(0);

  protected readonly entries = computed<SidebarEntry[]>(() => {
    const commonEntries: SidebarEntry[] = [
      { label: 'Tableau de bord', icon: 'space_dashboard', route: '/' },
      { label: 'Entrepôts', icon: 'warehouse', route: '/entrepots' },
      { label: 'Produits', icon: 'category', route: '/produits' },
      { label: 'Stocks', icon: 'inventory', route: '/stocks' },
      { label: 'Alertes', icon: 'warning', route: '/alertes', badge: this.alertCount() },
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

  constructor() {
    this.alerteService.findAll().subscribe({
      next: (alertes) => this.alertCount.set(alertes.length),
      error: () => this.alertCount.set(0),
    });
  }

  protected toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }
}
