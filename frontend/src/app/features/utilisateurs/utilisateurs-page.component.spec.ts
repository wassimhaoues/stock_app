import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { Entrepot } from '../../core/models/entrepot.model';
import { Utilisateur } from '../../core/models/utilisateur.model';
import { EntrepotService } from '../../core/services/entrepot.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { UtilisateursPageComponent } from './utilisateurs-page.component';

describe('UtilisateursPageComponent', () => {
  const entrepot: Entrepot = {
    id: 1,
    nom: 'Tunis',
    adresse: 'Charguia',
    capacite: 100,
    capaciteUtilisee: 10,
    capaciteDisponible: 90,
    tauxOccupation: 0.1,
  };
  const utilisateur: Utilisateur = {
    id: 7,
    nom: 'Gestionnaire',
    email: 'gestionnaire@stockpro.local',
    role: 'GESTIONNAIRE',
    entrepotId: 1,
    entrepotNom: 'Tunis',
  };

  let entrepotService: {
    findAll: ReturnType<typeof vi.fn>;
  };
  let utilisateurService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let dialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    entrepotService = {
      findAll: vi.fn(() => of([entrepot])),
    };
    utilisateurService = {
      findAll: vi.fn(() => of([utilisateur])),
      create: vi.fn(() => of(utilisateur)),
      update: vi.fn(() => of(utilisateur)),
      delete: vi.fn(() => of(undefined)),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    TestBed.configureTestingModule({
      imports: [UtilisateursPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: EntrepotService, useValue: entrepotService },
        { provide: UtilisateurService, useValue: utilisateurService },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
  });

  function createComponent(): ComponentFixture<UtilisateursPageComponent> {
    const fixture = TestBed.createComponent(UtilisateursPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('requires a password on create and a warehouse for scoped roles', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.form.patchValue({
      nom: 'Nouveau',
      email: 'new@stockpro.local',
      motDePasse: '',
      role: 'GESTIONNAIRE',
      entrepotId: null,
    });
    component.save();

    expect(component.form.controls.motDePasse.hasError('required')).toBe(true);
    expect(component.form.controls.entrepotId.hasError('required')).toBe(true);
    expect(utilisateurService.create).not.toHaveBeenCalled();
  });

  it('creates scoped users and clears warehouse for admin users', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.form.setValue({
      nom: 'Observateur',
      email: 'observateur@stockpro.local',
      motDePasse: 'Observe123!',
      role: 'OBSERVATEUR',
      entrepotId: 1,
    });
    component.save();

    expect(utilisateurService.create).toHaveBeenCalledWith({
      nom: 'Observateur',
      email: 'observateur@stockpro.local',
      motDePasse: 'Observe123!',
      role: 'OBSERVATEUR',
      entrepotId: 1,
    });

    component.form.setValue({
      nom: 'Admin',
      email: 'admin@stockpro.local',
      motDePasse: 'Admin123!',
      role: 'ADMIN',
      entrepotId: 1,
    });
    component.save();

    expect(utilisateurService.create).toHaveBeenLastCalledWith({
      nom: 'Admin',
      email: 'admin@stockpro.local',
      motDePasse: 'Admin123!',
      role: 'ADMIN',
      entrepotId: null,
    });
  });

  it('edits without requiring a password and deletes after confirmation', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.edit(utilisateur);
    expect(component.isEditing()).toBe(true);
    expect(component.form.controls.motDePasse.hasError('required')).toBe(false);

    component.form.patchValue({
      nom: 'Gestionnaire Modifié',
      motDePasse: '',
    });
    component.save();

    expect(utilisateurService.update).toHaveBeenCalledWith(7, {
      nom: 'Gestionnaire Modifié',
      email: 'gestionnaire@stockpro.local',
      motDePasse: null,
      role: 'GESTIONNAIRE',
      entrepotId: 1,
    });

    component.edit(utilisateur);
    component.remove(utilisateur);

    expect(dialog.open).toHaveBeenCalled();
    expect(utilisateurService.delete).toHaveBeenCalledWith(7);
    expect(component.selectedUserId()).toBeNull();
  });

  it('shows role labels and backend errors', () => {
    utilisateurService.findAll.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Utilisateurs indisponibles' } })),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.roleLabel('ADMIN')).toBe('Administrateur');
    expect(component.roleLabel('GESTIONNAIRE')).toBe('Gestionnaire');
    expect(component.roleLabel('OBSERVATEUR')).toBe('Observateur');
    expect(component.feedbackMessage()).toBe('Utilisateurs indisponibles');
    expect(fixture.nativeElement.textContent).toContain('Utilisateurs indisponibles');
  });
});
