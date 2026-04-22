import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EntrepotService } from './entrepot.service';
import { ProduitService } from './produit.service';
import { StockService } from './stock.service';
import { MouvementStockService } from './mouvement-stock.service';
import { UtilisateurService } from './utilisateur.service';
import { DashboardService } from './dashboard.service';
import { AlerteService } from './alerte.service';
import { HealthService } from './health.service';

describe('API services', () => {
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('uses the expected warehouse endpoints and payloads', () => {
    const service = TestBed.inject(EntrepotService);
    const payload = { nom: 'Tunis', adresse: 'Charguia', capacite: 100 };

    service.findAll().subscribe();
    expect(httpController.expectOne('/api/entrepots').request.method).toBe('GET');

    service.create(payload).subscribe();
    const createRequest = httpController.expectOne('/api/entrepots');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);

    service.update(7, payload).subscribe();
    const updateRequest = httpController.expectOne('/api/entrepots/7');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(payload);

    service.delete(7).subscribe();
    expect(httpController.expectOne('/api/entrepots/7').request.method).toBe('DELETE');
  });

  it('uses the expected product, stock, movement, and user endpoints', () => {
    TestBed.inject(ProduitService)
      .create({
        nom: 'Laptop',
        categorie: 'Informatique',
        prix: 1200,
        fournisseur: 'Supplier',
        seuilMin: 2,
      })
      .subscribe();
    expect(httpController.expectOne('/api/produits').request.method).toBe('POST');

    TestBed.inject(ProduitService)
      .update(3, {
        nom: 'Laptop Pro',
        categorie: 'Informatique',
        prix: 1500,
        fournisseur: 'Supplier',
        seuilMin: 3,
      })
      .subscribe();
    expect(httpController.expectOne('/api/produits/3').request.method).toBe('PUT');

    TestBed.inject(ProduitService).delete(3).subscribe();
    expect(httpController.expectOne('/api/produits/3').request.method).toBe('DELETE');

    TestBed.inject(StockService)
      .create({
        produitId: 1,
        entrepotId: 2,
        quantite: 4,
        seuilAlerte: 1,
      })
      .subscribe();
    expect(httpController.expectOne('/api/stocks').request.method).toBe('POST');

    TestBed.inject(StockService)
      .update(9, {
        produitId: 1,
        entrepotId: 2,
        quantite: 5,
        seuilAlerte: 2,
      })
      .subscribe();
    expect(httpController.expectOne('/api/stocks/9').request.method).toBe('PUT');

    TestBed.inject(StockService).delete(9).subscribe();
    expect(httpController.expectOne('/api/stocks/9').request.method).toBe('DELETE');

    TestBed.inject(MouvementStockService)
      .create({
        produitId: 1,
        entrepotId: 2,
        type: 'SORTIE',
        quantite: 2,
      })
      .subscribe();
    expect(httpController.expectOne('/api/mouvements-stock').request.method).toBe('POST');

    TestBed.inject(UtilisateurService)
      .update(4, {
        nom: 'User',
        email: 'user@stockpro.local',
        motDePasse: null,
        role: 'ADMIN',
        entrepotId: null,
      })
      .subscribe();
    expect(httpController.expectOne('/api/utilisateurs/4').request.method).toBe('PUT');
  });

  it('uses the expected read-only endpoints for dashboard, alerts, and health', () => {
    const dashboard = TestBed.inject(DashboardService);

    dashboard.getStats().subscribe();
    expect(httpController.expectOne('/api/dashboard/stats').request.method).toBe('GET');

    dashboard.getKpis().subscribe();
    expect(httpController.expectOne('/api/dashboard/kpis').request.method).toBe('GET');

    dashboard.getAnalytics().subscribe();
    expect(httpController.expectOne('/api/dashboard/analytics').request.method).toBe('GET');

    dashboard.getAdminAnalytics().subscribe();
    expect(httpController.expectOne('/api/dashboard/admin/analytics').request.method).toBe('GET');

    TestBed.inject(AlerteService).findAll().subscribe();
    expect(httpController.expectOne('/api/alertes').request.method).toBe('GET');

    TestBed.inject(HealthService).getHealth().subscribe();
    expect(httpController.expectOne('/api/health').request.method).toBe('GET');
  });
});
