
import { Routes } from '@angular/router';

import { authGuard } from './features/login/auth.guard';
import { rolesGuard } from './features/login/roles.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login')
        .then(m => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.Dashboard),
  },
  {
    path: 'ventas',
    canActivate: [authGuard, rolesGuard],
    data: {
      roles: ['ADMINISTRADOR', 'VENDEDOR'],
    },
    loadComponent: () =>
      import('./features/ventas/ventas')
        .then(m => m.Ventas),
  },
  {
    path: 'cuentas-cobrar',
    canActivate: [authGuard, rolesGuard],
    data: {
      roles: ['ADMINISTRADOR', 'VENDEDOR'],
    },
    loadComponent: () =>
      import('./features/cuentas-cobrar/cuentas-cobrar')
        .then(m => m.CuentasCobrar),
  },
  {
    path: 'inventario',
    canActivate: [authGuard, rolesGuard],
    data: {
      roles: [
        'ADMINISTRADOR',
        'VENDEDOR',
        'BODEGUERO',
      ],
    },
    loadComponent: () =>
      import('./features/inventario/inventario')
        .then(m => m.Inventario),
  },
  {
    path: 'clientes',
    canActivate: [authGuard, rolesGuard],
    data: {
      roles: ['ADMINISTRADOR', 'VENDEDOR'],
    },
    loadComponent: () =>
      import('./features/clientes/clientes')
        .then(m => m.Clientes),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, rolesGuard],
    data: {
      roles: ['ADMINISTRADOR'],
    },
    loadComponent: () =>
      import('./features/usuarios/usuarios')
        .then(m => m.Usuarios),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
