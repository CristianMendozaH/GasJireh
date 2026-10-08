
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.obtenerToken();

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const partes = token.split('.');

    if (partes.length !== 3) {
      throw new Error('Token mal formado');
    }

    const payload = JSON.parse(
      atob(
        partes[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      )
    );

    if (
      typeof payload.exp !== 'number' ||
      payload.exp * 1000 <= Date.now()
    ) {
      authService.cerrarSesion();
      return router.createUrlTree(['/login']);
    }

    return true;
  } catch {
    authService.cerrarSesion();
    return router.createUrlTree(['/login']);
  }
};
