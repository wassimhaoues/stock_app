import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from './header/header.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';

describe('layout components', () => {
  let authService: {
    currentUser: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let alerteService: {
    findAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      currentUser: vi.fn(() => ({
        id: 1,
        nom: 'Admin',
        email: 'admin@stockpro.local',
        role: 'ADMIN',
        entrepotId: null,
        entrepotNom: null,
      })),
      hasRole: vi.fn((role: string) => role === 'ADMIN'),
      logout: vi.fn(),
    };
    alerteService = {
      findAll: vi.fn(() => of([{ stockId: 1 }, { stockId: 2 }])),
    };

    TestBed.configureTestingModule({
      imports: [HeaderComponent, SidebarComponent, MainLayoutComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: AlerteService, useValue: alerteService },
        { provide: BreakpointObserver, useValue: { observe: vi.fn(() => of({ matches: false })) } },
      ],
    });
  });

  it('shows user role labels and logs out from the header', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    expect(component.roleLabel()).toBe('Administrateur');
    expect(fixture.nativeElement.textContent).toContain('Admin');

    component.logout();
    expect(authService.logout).toHaveBeenCalledWith({ redirect: true });

    authService.currentUser.mockReturnValueOnce({ role: 'GESTIONNAIRE' });
    expect(component.roleLabel()).toBe('Gestionnaire');
    authService.currentUser.mockReturnValueOnce({ role: 'OBSERVATEUR' });
    expect(component.roleLabel()).toBe('Observateur');
  });

  it('builds admin sidebar entries with alert badges and emits collapse changes', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const emissions: boolean[] = [];
    fixture.componentInstance.collapsedChange.subscribe((value) => emissions.push(value));

    expect(component.entries().map((entry: { label: string }) => entry.label)).toContain('Utilisateurs');
    expect(component.entries().find((entry: { label: string }) => entry.label === 'Alertes').badge).toBe(2);

    component.toggleCollapsed();
    expect(emissions).toEqual([true]);
  });

  it('omits admin sidebar entries for scoped users and tolerates alert loading errors', () => {
    authService.hasRole.mockReturnValue(false);
    alerteService.findAll.mockReturnValueOnce(throwError(() => new Error('offline')));

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    expect(component.entries().map((entry: { label: string }) => entry.label)).not.toContain('Utilisateurs');
    expect(component.entries().find((entry: { label: string }) => entry.label === 'Alertes').badge).toBe(0);
  });

  it('tracks desktop sidebar collapse state in the main layout', () => {
    const fixture: ComponentFixture<MainLayoutComponent> = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    expect(component.isMobile()).toBe(false);
    component.setSidebarCollapsed(true);
    expect(component.isSidebarCollapsed()).toBe(true);
    component.setSidebarCollapsed(false);
    expect(component.isSidebarCollapsed()).toBe(false);
  });
});
