
import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
} from '@angular/router';

import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import {
  AuthService,
  type UsuarioSesion,
} from './features/login/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly sidebarAbierto = signal(false);

  // Inicialmente ocultamos el menú para evitar
  // que aparezca antes de resolver la navegación.
  readonly rutaResuelta = signal(false);
  readonly esRutaLogin = signal(true);

  readonly usuarioActual = signal<UsuarioSesion | null>(
    this.authService.obtenerUsuario(),
  );

  readonly esAdministrador = computed(
    () => this.usuarioActual()?.rol === 'ADMINISTRADOR',
  );

  readonly esVendedor = computed(
    () => this.usuarioActual()?.rol === 'VENDEDOR',
  );

  readonly esBodeguero = computed(
    () => this.usuarioActual()?.rol === 'BODEGUERO',
  );

  readonly mostrarMenu = computed(
    () =>
      this.rutaResuelta() &&
      !this.esRutaLogin() &&
      this.authService.estaAutenticado() &&
      this.usuarioActual() !== null,
  );

  readonly nombreUsuario = computed(
    () => this.usuarioActual()?.nombreCompleto ?? '',
  );

  readonly nombreRol = computed(() => {
    switch (this.usuarioActual()?.rol) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'VENDEDOR':
        return 'Vendedor';
      case 'BODEGUERO':
        return 'Bodeguero';
      default:
        return '';
    }
  });

  readonly inicialesUsuario = computed(() => {
    const nombre = this.nombreUsuario().trim();

    if (!nombre) {
      return '?';
    }

    const partes = nombre.split(/\s+/);

    return (
      partes.length > 1
        ? partes[0][0] + partes[1][0]
        : partes[0][0]
    ).toUpperCase();
  });

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const ruta = event.urlAfterRedirects.split('?')[0];

        this.esRutaLogin.set(
          ruta === '/login',
        );

        this.usuarioActual.set(
          this.authService.obtenerUsuario(),
        );

        this.sidebarAbierto.set(false);
        this.rutaResuelta.set(true);
      });
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update((abierto) => !abierto);
  }

  closeSb(): void {
    this.sidebarAbierto.set(false);
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();

    this.usuarioActual.set(null);
    this.sidebarAbierto.set(false);
    this.esRutaLogin.set(true);

    void this.router.navigate(['/login']);
  }
}
