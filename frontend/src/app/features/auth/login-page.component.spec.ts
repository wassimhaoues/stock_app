import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthResponse } from '../../core/models/auth-response.model';
import { AuthService } from '../../core/services/auth.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  const authResponse: AuthResponse = {
    token: 'jwt-token',
    type: 'Bearer',
    utilisateur: {
      id: 1,
      nom: 'Admin StockPro',
      email: 'admin@stockpro.test',
      role: 'ADMIN',
      entrepotId: null,
      entrepotNom: null,
    },
  };

  let authService: {
    login: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<LoginPageComponent>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authService = {
      login: vi.fn(() => of(authResponse)),
    };
    navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
  });

  it('renders the login form with the submit action disabled until valid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector<HTMLButtonElement>('button[type="submit"]');

    expect(compiled.textContent).toContain('Bienvenue dans StockPro');
    expect(submitButton?.disabled).toBe(true);
  });

  it('toggles password visibility from the icon button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const passwordInput = compiled.querySelector<HTMLInputElement>(
      'input[formcontrolname="motDePasse"]'
    );
    const toggleButton = compiled.querySelector<HTMLButtonElement>(
      'button[aria-label="Afficher le mot de passe"]'
    );

    expect(passwordInput?.type).toBe('password');

    toggleButton?.click();
    fixture.detectChanges();

    expect(passwordInput?.type).toBe('text');
  });

  it('submits valid credentials and redirects to the dashboard', () => {
    const component = fixture.componentInstance as unknown as {
      form: {
        setValue(value: { email: string; motDePasse: string }): void;
      };
    };

    component.form.setValue({
      email: 'admin@stockpro.test',
      motDePasse: 'secret',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@stockpro.test',
      motDePasse: 'secret',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the backend login error message', () => {
    authService.login.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { message: 'Identifiants invalides' },
          })
      )
    );
    const component = fixture.componentInstance as unknown as {
      form: {
        setValue(value: { email: string; motDePasse: string }): void;
      };
    };

    component.form.setValue({
      email: 'admin@stockpro.test',
      motDePasse: 'secret',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Identifiants invalides');
  });
});
