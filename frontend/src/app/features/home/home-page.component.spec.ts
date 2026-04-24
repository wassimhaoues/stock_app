import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';

import { Alerte } from '../../core/models/alerte.model';
import {
  AdminAnalytics,
  DashboardAnalytics,
  DashboardKpis,
  DashboardStats,
} from '../../core/models/dashboard.model';
import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  const stats: DashboardStats = {
    totalEntrepots: 2,
    totalProduitsCatalogue: 3,
    totalStocks: 4,
    totalMouvements: 5,
    valeurTotaleStock: 1250,
    totalAlertes: 1,
    capaciteUtilisee: 40,
    capaciteDisponible: 60,
    tauxSaturationGlobal: 0.4,
  };
  const kpis: DashboardKpis = {
    valeurTotaleStock: 1250,
    produitsActifs: 3,
    produitsSousSeuilCritique: 1,
    tauxRisqueRupture: 0.25,
    entreesJour: 6,
    sortiesJour: 2,
    entreesSemaine: 12,
    sortiesSemaine: 8,
    entreesMois: 40,
    sortiesMois: 20,
    stocksDormants: 1,
    couvertureStockJoursEstimee: 12,
    valeurStockParEntrepot: [{ entrepotId: 1, entrepotNom: 'Tunis', valeurStock: 900 }],
    capaciteParEntrepot: [
      {
        entrepotId: 1,
        entrepotNom: 'Tunis',
        capacite: 100,
        capaciteUtilisee: 40,
        capaciteDisponible: 60,
        tauxSaturation: 0.4,
      },
    ],
  };
  const analytics: DashboardAnalytics = {
    mouvementsParJour: [{ date: '2026-04-22', entrees: 6, sorties: 2 }],
    repartitionParEntrepot: [
      {
        entrepotId: 1,
        entrepotNom: 'Tunis',
        quantiteStock: 40,
        valeurStock: 900,
        alertes: 1,
        tauxSaturation: 0.4,
      },
    ],
    topProduitsMouvementes: [
      { produitId: 1, produitNom: 'Laptop', quantiteMouvementee: 8, valeurStock: 900 },
    ],
    stocksDormants: [
      {
        stockId: 1,
        produitNom: 'Camera',
        entrepotNom: 'Tunis',
        quantite: 4,
        joursSansMouvement: 35,
      },
    ],
    alertesParGravite: [{ priorite: 'CRITIQUE', total: 1 }],
    entrepotsActifs: [
      { entrepotId: 1, entrepotNom: 'Tunis', quantiteMouvementee: 8, totalMouvements: 2 },
    ],
  };
  const adminAnalytics: AdminAnalytics = {
    valeurMoyenneParEntrepot: 625,
    entrepotsEnRisqueCapacite: 0,
    performanceEntrepots: [
      {
        entrepotId: 1,
        entrepotNom: 'Tunis',
        valeurStock: 900,
        mouvementsMois: 2,
        alertes: 1,
        tauxSaturation: 0.4,
      },
    ],
  };
  const alertes: Alerte[] = [
    {
      stockId: 1,
      produitId: 1,
      produitNom: 'Laptop',
      entrepotId: 1,
      entrepotNom: 'Tunis',
      quantite: 1,
      seuilAlerte: 3,
      manque: 2,
      priorite: 'CRITIQUE',
      actionAttendue: 'Reapprovisionnement immediat',
    },
  ];

  let currentRole: 'ADMIN' | 'GESTIONNAIRE';
  let authService: {
    hasRole: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
  };
  let dashboardService: {
    getStats: ReturnType<typeof vi.fn>;
    getKpis: ReturnType<typeof vi.fn>;
    getAnalytics: ReturnType<typeof vi.fn>;
    getAdminAnalytics: ReturnType<typeof vi.fn>;
  };
  let alerteService: {
    findAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    currentRole = 'ADMIN';
    authService = {
      hasRole: vi.fn((...roles: string[]) => roles.includes(currentRole)),
      currentUser: vi.fn(() => ({
        id: 1,
        nom: 'Admin',
        email: 'admin@stockpro.local',
        role: currentRole,
        entrepotId: null,
        entrepotNom: null,
      })),
    };
    dashboardService = {
      getStats: vi.fn(() => of(stats)),
      getKpis: vi.fn(() => of(kpis)),
      getAnalytics: vi.fn(() => of(analytics)),
      getAdminAnalytics: vi.fn(() => of(adminAnalytics)),
    };
    alerteService = {
      findAll: vi.fn(() => of(alertes)),
    };

    TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: AlerteService, useValue: alerteService },
      ],
    });
  });

  function createComponent(): ComponentFixture<HomePageComponent> {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('loads all dashboard data for admins including admin analytics', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(dashboardService.getAdminAnalytics).toHaveBeenCalled();
    expect(component.stats()).toEqual(stats);
    expect(component.kpis()).toEqual(kpis);
    expect(component.analytics()).toEqual(analytics);
    expect(component.adminAnalytics()).toEqual(adminAnalytics);
    expect(component.movementMax()).toBe(6);
    expect(component.warehouseValueMax()).toBe(900);
    expect(component.productMovementMax()).toBe(8);
    expect(component.adminValueMax()).toBe(900);
    expect(component.formatMoney(1250)).toContain('DT');
    expect(component.formatRate(0.123)).toBe('12.3 %');
    expect(component.barWidth(0, 10)).toBe('0%');
    expect(component.barWidth(1, 10)).toBe('10%');
    expect(component.barHeight(0, 10)).toBe('0.35rem');
    expect(component.roleLabel()).toBe('Administrateur');
    expect(component.scopeDescription()).toContain('multi-entrepôts');
    expect(fixture.nativeElement.textContent).toContain('Performance multi-entrepôts');
  });

  it('does not request admin analytics for scoped non-admin users', () => {
    currentRole = 'GESTIONNAIRE';

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(dashboardService.getAdminAnalytics).not.toHaveBeenCalled();
    expect(component.adminAnalytics()).toBeNull();
    expect(component.roleLabel()).toBe('Gestionnaire');
    expect(component.scopeDescription()).toContain('entrepôt affecté');
    expect(fixture.nativeElement.textContent).not.toContain('Performance multi-entrepôts');
  });

  it('shows backend error messages when dashboard loading fails', () => {
    dashboardService.getStats.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Dashboard HS' } })),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isLoading()).toBe(false);
    expect(component.feedbackMessage()).toBe('Dashboard HS');
    expect(fixture.nativeElement.textContent).toContain('Dashboard HS');
  });

  it('shows the loading state before rendering the connected dashboard', () => {
    const stats$ = new Subject<DashboardStats>();
    const kpis$ = new Subject<DashboardKpis>();
    const analytics$ = new Subject<DashboardAnalytics>();
    const adminAnalytics$ = new Subject<AdminAnalytics>();
    const alertes$ = new Subject<Alerte[]>();
    dashboardService.getStats.mockReturnValueOnce(stats$.asObservable());
    dashboardService.getKpis.mockReturnValueOnce(kpis$.asObservable());
    dashboardService.getAnalytics.mockReturnValueOnce(analytics$.asObservable());
    dashboardService.getAdminAnalytics.mockReturnValueOnce(adminAnalytics$.asObservable());
    alerteService.findAll.mockReturnValueOnce(alertes$.asObservable());

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isLoading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Chargement des indicateurs...');

    stats$.next(stats);
    stats$.complete();
    kpis$.next(kpis);
    kpis$.complete();
    analytics$.next(analytics);
    analytics$.complete();
    adminAnalytics$.next(adminAnalytics);
    adminAnalytics$.complete();
    alertes$.next(alertes);
    alertes$.complete();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Tableau de bord analytique');
    expect(fixture.nativeElement.textContent).toContain('Performance multi-entrepôts');
  });
});
