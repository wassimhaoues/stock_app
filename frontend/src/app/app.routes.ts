import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'entrepots',
        loadComponent: () =>
          import('./features/entrepots/entrepots-page.component').then(
            (m) => m.EntrepotsPageComponent,
          ),
      },
      {
        path: 'produits',
        loadComponent: () =>
          import('./features/produits/produits-page.component').then(
            (m) => m.ProduitsPageComponent,
          ),
      },
      {
        path: 'stocks',
        loadComponent: () =>
          import('./features/stocks/stocks-page.component').then((m) => m.StocksPageComponent),
      },
      {
        path: 'alertes',
        loadComponent: () =>
          import('./features/alertes/alertes-page.component').then((m) => m.AlertesPageComponent),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/utilisateurs/utilisateurs-page.component').then(
            (m) => m.UtilisateursPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
