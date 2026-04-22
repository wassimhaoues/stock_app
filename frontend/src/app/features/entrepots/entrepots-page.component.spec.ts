import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { AuthService } from '../../core/services/auth.service';
import { EntrepotService } from '../../core/services/entrepot.service';
import { EntrepotsPageComponent } from './entrepots-page.component';

describe('EntrepotsPageComponent', () => {
  const entrepot: Entrepot = {
    id: 1,
    nom: 'Tunis',
    adresse: 'Charguia',
    capacite: 100,
    capaciteUtilisee: 60,
    capaciteDisponible: 40,
    tauxOccupation: 0.6,
  };

  let authService: {
    hasRole: ReturnType<typeof vi.fn>;
  };
  let entrepotService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let dialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      hasRole: vi.fn(() => true),
    };
    entrepotService = {
      findAll: vi.fn(() => of([entrepot])),
      create: vi.fn(() => of(entrepot)),
      update: vi.fn(() => of(entrepot)),
      delete: vi.fn(() => of(undefined)),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    TestBed.configureTestingModule({
      imports: [EntrepotsPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: EntrepotService, useValue: entrepotService },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
  });

  function createComponent(): ComponentFixture<EntrepotsPageComponent> {
    const fixture = TestBed.createComponent(EntrepotsPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders admin management controls and capacity status', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.canManage()).toBe(true);
    expect(component.formatOccupation(entrepot)).toBe('60%');
    expect(component.meterWidth({ ...entrepot, tauxOccupation: 1.2 })).toBe('100%');
    expect(component.capacityStatus(entrepot)).toBe('Disponible');
    expect(component.capacityStatus({ ...entrepot, tauxOccupation: 0.95 })).toBe('Presque plein');
    expect(component.capacityStatus({ ...entrepot, capaciteDisponible: 0 })).toBe('Plein');
    expect(fixture.nativeElement.textContent).toContain('Ajouter un entrepôt');
    expect(fixture.nativeElement.textContent).toContain('Tunis');
  });

  it('blocks capacity reductions below used stock and allows valid updates', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.edit(entrepot);
    component.form.controls.capacite.setValue(50);

    expect(component.isCapacityReductionInvalid()).toBe(true);
    expect(component.availableAfterEdit()).toBe(0);
    component.save();
    expect(entrepotService.update).not.toHaveBeenCalled();

    component.form.controls.capacite.setValue(80);
    component.save();

    expect(entrepotService.update).toHaveBeenCalledWith(1, {
      nom: 'Tunis',
      adresse: 'Charguia',
      capacite: 80,
    });
    expect(component.feedbackMessage()).toBe('Entrepôt mis à jour avec succès.');
  });

  it('creates and deletes warehouses through confirmed actions', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.form.setValue({ nom: ' Sfax ', adresse: ' Route ', capacite: 30 });
    component.save();

    expect(entrepotService.create).toHaveBeenCalledWith({
      nom: 'Sfax',
      adresse: 'Route',
      capacite: 30,
    });

    component.edit(entrepot);
    component.remove(entrepot);

    expect(dialog.open).toHaveBeenCalled();
    expect(entrepotService.delete).toHaveBeenCalledWith(1);
    expect(component.selectedEntrepotId()).toBeNull();
  });

  it('renders read-only mode and backend errors for non-admin users', () => {
    authService.hasRole.mockReturnValue(false);
    entrepotService.findAll.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Entrepôts indisponibles' } })),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.canManage()).toBe(false);
    expect(component.feedbackMessage()).toBe('Entrepôts indisponibles');
    expect(fixture.nativeElement.textContent).toContain('Consultez votre entrepôt affecté.');
  });
});
