import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { MouvementStock } from '../../core/models/mouvement-stock.model';
import { PagedResponse } from '../../core/models/paged-response.model';
import { Produit } from '../../core/models/produit.model';
import { Stock } from '../../core/models/stock.model';
import { AuthService } from '../../core/services/auth.service';
import { EntrepotService } from '../../core/services/entrepot.service';
import { MouvementStockService } from '../../core/services/mouvement-stock.service';
import { ProduitService } from '../../core/services/produit.service';
import { StockService } from '../../core/services/stock.service';
import { StocksPageComponent } from './stocks-page.component';

describe('StocksPageComponent', () => {
  const produit: Produit = {
    id: 1,
    nom: 'Laptop',
    categorie: 'Informatique',
    prix: 1200,
    fournisseur: 'Supplier',
    seuilMin: 2,
  };
  const entrepot: Entrepot = {
    id: 2,
    nom: 'Tunis',
    adresse: 'Charguia',
    capacite: 100,
    capaciteUtilisee: 70,
    capaciteDisponible: 30,
    tauxOccupation: 0.7,
  };
  const stock: Stock = {
    id: 3,
    produitId: 1,
    produitNom: 'Laptop',
    entrepotId: 2,
    entrepotNom: 'Tunis',
    quantite: 20,
    seuilAlerte: 5,
    enAlerte: false,
  };
  const mouvement: MouvementStock = {
    id: 4,
    produitId: 1,
    produitNom: 'Laptop',
    entrepotId: 2,
    entrepotNom: 'Tunis',
    type: 'SORTIE',
    quantite: 4,
    date: '2026-04-22T12:00:00',
  };
  const stockPage: PagedResponse<Stock> = {
    content: [stock],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  };
  const mouvementPage: PagedResponse<MouvementStock> = {
    content: [mouvement],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  };

  let currentRole: 'ADMIN' | 'GESTIONNAIRE' | 'OBSERVATEUR';
  let authService: {
    hasRole: ReturnType<typeof vi.fn>;
  };
  let produitService: {
    findAll: ReturnType<typeof vi.fn>;
  };
  let entrepotService: {
    findAll: ReturnType<typeof vi.fn>;
  };
  let stockService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mouvementStockService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let dialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    currentRole = 'ADMIN';
    authService = {
      hasRole: vi.fn((...roles: string[]) => roles.includes(currentRole)),
    };
    produitService = {
      findAll: vi.fn(() => of([produit])),
    };
    entrepotService = {
      findAll: vi.fn(() => of([entrepot])),
    };
    stockService = {
      findAll: vi.fn(() => of(stockPage)),
      create: vi.fn(() => of(stock)),
      update: vi.fn(() => of(stock)),
      delete: vi.fn(() => of(undefined)),
    };
    mouvementStockService = {
      findAll: vi.fn(() => of(mouvementPage)),
      create: vi.fn(() => of(mouvement)),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    TestBed.configureTestingModule({
      imports: [StocksPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: ProduitService, useValue: produitService },
        { provide: EntrepotService, useValue: entrepotService },
        { provide: StockService, useValue: stockService },
        { provide: MouvementStockService, useValue: mouvementStockService },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
  });

  function createComponent(): ComponentFixture<StocksPageComponent> {
    const fixture = TestBed.createComponent(StocksPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders admin stock and movement management controls', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.canWrite()).toBe(true);
    expect(component.canChooseEntrepot()).toBe(true);
    expect(component.stockCapacitySummary(stock)).toBe('30 disponible');
    expect(component.movementLabel('ENTREE')).toBe('Entrée');
    expect(component.movementLabel('SORTIE')).toBe('Sortie');
    expect(component.stockTotalElements()).toBe(1);
    expect(component.mouvementTotalElements()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ajouter une ligne de stock');
    expect(fixture.nativeElement.textContent).toContain('Laptop');
  });

  it('defaults managers to their assigned warehouse and blocks capacity excess', () => {
    currentRole = 'GESTIONNAIRE';
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.canWrite()).toBe(true);
    expect(component.canChooseEntrepot()).toBe(false);
    expect(component.stockForm.controls.entrepotId.value).toBe(2);

    component.stockForm.setValue({
      produitId: 1,
      entrepotId: 2,
      quantite: 31,
      seuilAlerte: 5,
    });

    expect(component.stockCapacityLimit()).toBe(30);
    expect(component.isStockCapacityExceeded()).toBe(true);
    component.saveStock();
    expect(stockService.create).not.toHaveBeenCalled();

    component.mouvementForm.setValue({
      produitId: 1,
      entrepotId: 2,
      type: 'ENTREE',
      quantite: 31,
    });
    expect(component.isMouvementCapacityExceeded()).toBe(true);
    expect(component.mouvementCapacityAfterSave()).toBe(0);
    component.saveMouvement();
    expect(mouvementStockService.create).not.toHaveBeenCalled();
  });

  it('creates and updates stock, then reloads dependent data', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.stockForm.setValue({
      produitId: 1,
      entrepotId: 2,
      quantite: 10,
      seuilAlerte: 3,
    });
    component.saveStock();

    expect(stockService.create).toHaveBeenCalledWith({
      produitId: 1,
      entrepotId: 2,
      quantite: 10,
      seuilAlerte: 3,
    });
    expect(component.stockFeedbackMessage()).toBe('Stock créé avec succès.');

    component.editStock(stock);
    expect(component.isEditingStock()).toBe(true);
    expect(component.stockCapacityLimit()).toBe(50);

    component.stockForm.patchValue({ quantite: 25 });
    component.saveStock();

    expect(stockService.update).toHaveBeenCalledWith(3, {
      produitId: 1,
      entrepotId: 2,
      quantite: 25,
      seuilAlerte: 5,
    });
    expect(component.stockFeedbackMessage()).toBe('Stock mis à jour avec succès.');
  });

  it('records movements and deletes stock after confirmation', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.mouvementForm.setValue({
      produitId: 1,
      entrepotId: 2,
      type: 'SORTIE',
      quantite: 4,
    });
    component.saveMouvement();

    expect(mouvementStockService.create).toHaveBeenCalledWith({
      produitId: 1,
      entrepotId: 2,
      type: 'SORTIE',
      quantite: 4,
    });
    expect(component.mouvementFeedbackMessage()).toBe('Mouvement enregistré avec succès.');

    component.editStock(stock);
    component.removeStock(stock);

    expect(dialog.open).toHaveBeenCalled();
    expect(stockService.delete).toHaveBeenCalledWith(3);
    expect(component.selectedStockId()).toBeNull();
  });

  it('renders read-only observer mode and service errors', () => {
    currentRole = 'OBSERVATEUR';
    stockService.findAll.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Stocks indisponibles' } }),
      ),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.canWrite()).toBe(false);
    component.saveStock();
    component.saveMouvement();
    expect(stockService.create).not.toHaveBeenCalled();
    expect(mouvementStockService.create).not.toHaveBeenCalled();
    expect(component.stockFeedbackMessage()).toBe('Stocks indisponibles');
    expect(fixture.nativeElement.textContent).toContain('Consultez les stocks');
  });

  it('reloads the requested page when paginators change', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.onStocksPageChange({ pageIndex: 1, pageSize: 5, length: 1, previousPageIndex: 0 });
    component.onMouvementsPageChange({
      pageIndex: 2,
      pageSize: 10,
      length: 1,
      previousPageIndex: 0,
    });

    expect(stockService.findAll).toHaveBeenLastCalledWith(1, 5);
    expect(mouvementStockService.findAll).toHaveBeenLastCalledWith(2, 10);
  });
});
