import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, ViewChild, inject } from '@angular/core';
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
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #drawer
        class="shell__sidenav"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
      >
        <app-sidebar />
      </mat-sidenav>

      <mat-sidenav-content>
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
      width: 320px;
      border-right: none;
      background: transparent;
    }

    .shell__content {
      padding: 1.5rem;
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
    { initialValue: false }
  );

  protected toggleMenu(): void {
    if (this.isMobile()) {
      void this.drawer?.toggle();
    }
  }
}
