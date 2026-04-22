import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { Alerte } from '../../core/models/alerte.model';
import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertesPageComponent } from './alertes-page.component';

describe('AlertesPageComponent', () => {
  const alertes: Alerte[] = [
    {
      stockId: 1,
      produitId: 1,
      produitNom: 'Laptop',
      entrepotId: 1,
      entrepotNom: 'Tunis',
      quantite: 0,
      seuilAlerte: 5,
      manque: 5,
      priorite: 'CRITIQUE',
      actionAttendue: 'Reapprovisionnement immediat',
    },
    {
      stockId: 2,
      produitId: 2,
      produitNom: 'Phone',
      entrepotId: 1,
      entrepotNom: 'Tunis',
      quantite: 4,
      seuilAlerte: 6,
      manque: 2,
      priorite: 'ELEVEE',
      actionAttendue: 'Planifier',
    },
  ];

  let authService: {
    hasRole: ReturnType<typeof vi.fn>;
  };
  let alerteService: {
    findAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      hasRole: vi.fn(() => true),
    };
    alerteService = {
      findAll: vi.fn(() => of(alertes)),
    };

    TestBed.configureTestingModule({
      imports: [AlertesPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: AlerteService, useValue: alerteService },
      ],
    });
  });

  function createComponent(): ComponentFixture<AlertesPageComponent> {
    const fixture = TestBed.createComponent(AlertesPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('summarizes critical, elevated, and missing quantities for admins', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isGlobalView()).toBe(true);
    expect(component.criticalAlerts()).toBe(1);
    expect(component.highAlerts()).toBe(1);
    expect(component.totalMissing()).toBe(7);
    expect(fixture.nativeElement.textContent).toContain(
      'Stocks sous seuil critique sur tous les entrepôts.',
    );
    expect(fixture.nativeElement.textContent).toContain('Laptop');
  });

  it('renders scoped copy and empty state for non-admin users', () => {
    authService.hasRole.mockReturnValue(false);
    alerteService.findAll.mockReturnValueOnce(of([]));

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isGlobalView()).toBe(false);
    expect(component.alertes()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('votre entrepôt affecté');
    expect(fixture.nativeElement.textContent).toContain('Aucune alerte active.');
  });

  it('shows backend errors from alert loading', () => {
    alerteService.findAll.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Alertes indisponibles' } }),
      ),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isLoading()).toBe(false);
    expect(component.feedbackMessage()).toBe('Alertes indisponibles');
    expect(fixture.nativeElement.textContent).toContain('Alertes indisponibles');
  });
});
