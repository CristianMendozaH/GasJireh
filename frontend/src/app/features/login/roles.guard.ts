
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  AuthService,
  type RolUsuario,
} from './auth.service';

export const rolesGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuario();

  if (!authService.obtenerToken() || !usuario) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos =
    route.data['roles'] as RolUsuario[] | undefined;

  if (!rolesPermitidos?.includes(usuario.rol)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
