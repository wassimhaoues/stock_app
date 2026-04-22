import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, MatSidenavModule, RouterOutlet, SidebarComponent],
  template: `
    <mat-sidenav-container class="shell" autosize>
      <mat-sidenav
        #drawer
        class="shell__sidenav"
        [class.shell__sidenav--collapsed]="isSidebarCollapsed()"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
      >
        <app-sidebar
          [collapsed]="isSidebarCollapsed()"
          [canCollapse]="!isMobile()"
          (collapsedChange)="setSidebarCollapsed($event)"
        />
      </mat-sidenav>

      <mat-sidenav-content class="shell__main">
        <app-header (menuToggle)="toggleMenu()" />
        <main class="shell__content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell {
      min-height: 100dvh;
      background: transparent;
    }

    .shell__sidenav {
      width: 292px;
      border-right: none;
      background: #18202a;
      transition: width 180ms ease;
    }

    .shell__sidenav--collapsed {
      width: 72px;
    }

    .shell__main {
      display: flex;
      min-height: 100dvh;
      flex-direction: column;
      transition: margin 180ms ease;
    }

    .shell__content {
      display: block;
      width: 100%;
      min-width: 0;
      flex: 1;
      padding: 1.25rem;
    }

    :host ::ng-deep .shell__content > :not(router-outlet) {
      display: block;
      width: 100%;
      min-width: 0;
    }

    @media (max-width: 900px) {
      .shell__content {
        padding: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  @ViewChild('drawer') private drawer?: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly sidebarCollapsed = signal(false);
  protected readonly isSidebarCollapsed = computed(
    () => !this.isMobile() && this.sidebarCollapsed(),
  );

  protected toggleMenu(): void {
    if (this.isMobile()) {
      void this.drawer?.toggle();
    }
  }

  protected setSidebarCollapsed(isCollapsed: boolean): void {
    this.sidebarCollapsed.set(isCollapsed);
  }
}
