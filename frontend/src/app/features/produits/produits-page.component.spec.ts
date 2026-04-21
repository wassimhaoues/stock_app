import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';

import { Produit } from '../../core/models/produit.model';
import { AuthService } from '../../core/services/auth.service';
import { ProduitService } from '../../core/services/produit.service';
import { ProduitsPageComponent } from './produits-page.component';

describe('ProduitsPageComponent', () => {
  const produit: Produit = {
    id: 1,
    nom: 'Clavier mécanique',
    categorie: 'Informatique',
    prix: 180,
    fournisseur: 'StockPro Supplies',
    seuilMin: 5,
  };

  let authService: {
    hasRole: ReturnType<typeof vi.fn>;
  };
  let produitService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      hasRole: vi.fn(() => false),
    };
    produitService = {
      findAll: vi.fn(() => of([])),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ProduitsPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: ProduitService, useValue: produitService },
      ],
    });
  });

  function createComponent(): ComponentFixture<ProduitsPageComponent> {
    const fixture = TestBed.createComponent(ProduitsPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a loading state while products are being fetched', () => {
    produitService.findAll.mockReturnValueOnce(new Subject<Produit[]>());

    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Chargement des produits...');
  });

  it('renders an empty state when no product is available', () => {
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aucun produit disponible.');
  });

  it('renders the API error state', () => {
    produitService.findAll.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Catalogue indisponible' },
          })
      )
    );

    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Catalogue indisponible');
  });

  it('hides management actions for non-admin roles', () => {
    produitService.findAll.mockReturnValueOnce(of([produit]));

    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Clavier mécanique');
    expect(compiled.textContent).toContain('Produits consultables');
    expect(compiled.textContent).not.toContain('Ajouter un produit');
    expect(compiled.textContent).not.toContain('Supprimer');
  });

  it('shows management actions for admin roles', () => {
    authService.hasRole.mockReturnValue(true);
    produitService.findAll.mockReturnValueOnce(of([produit]));

    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Ajouter un produit');
    expect(compiled.textContent).toContain('Modifier');
    expect(compiled.textContent).toContain('Supprimer');
  });
});
