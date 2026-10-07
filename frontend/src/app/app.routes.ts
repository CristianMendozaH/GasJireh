import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login')
        .then(m => m.Login)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.Dashboard)
  },
  {
    path: 'ventas',
    loadComponent: () =>
      import('./features/ventas/ventas')
        .then(m => m.Ventas)
  },
  {
    path: 'cuentas-cobrar',
    loadComponent: () =>
      import('./features/cuentas-cobrar/cuentas-cobrar')
        .then(m => m.CuentasCobrar)
  },
  {
    path: 'inventario',
    loadComponent: () =>
      import('./features/inventario/inventario')
        .then(m => m.Inventario)
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./features/clientes/clientes')
        .then(m => m.Clientes)
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/usuarios')
        .then(m => m.Usuarios)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
