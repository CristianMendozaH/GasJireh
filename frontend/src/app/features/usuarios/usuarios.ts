import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export interface Usuario {
  id: number;
  name: string;
  user: string;
  role: 'Administrador' | 'Vendedor' | 'Bodeguero';
  active: boolean;
}

type RolApi = 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO';

interface UsuarioApi {
  id: number;
  nombreCompleto: string;
  username: string;
  rol: RolApi;
  activo: boolean;
}

interface NuevoUsuario {
  nombreCompleto: string;
  username: string;
  password: string;
  rol: RolApi;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/usuarios';

  readonly users = signal<Usuario[]>([]);
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorFormulario = signal('');
  readonly mensajeExito = signal('');
  readonly mostrarPassword = signal(false);
  readonly accion = signal<"editar" | "password" | "estado" | null>(null);
  readonly mostrarPasswordAccion = signal(false);
  readonly seleccionado = signal<Usuario | null>(null);
  edicion = { nombreCompleto: '', username: '', rol: 'VENDEDOR' as RolApi };
  nuevaPassword = '';
  readonly errorAccion = signal('');
  readonly procesandoAccion = signal(false);

  formulario: NuevoUsuario = this.formularioVacio();

  readonly totalUsuarios = computed(() => this.users().length);
  readonly usuariosActivos = computed(() => this.users().filter(u => u.active).length);
  readonly usuariosInactivos = computed(() => this.totalUsuarios() - this.usuariosActivos());

  esCuentaPropia(u: Usuario): boolean {
    try {
      const raw = localStorage.getItem('usuario') ?? sessionStorage.getItem('usuario');
      if (!raw) return false;
      const actual = JSON.parse(raw) as { id?: number };
      return actual.id === u.id;
    } catch { return false; }
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.errorCarga.set('');

    this.http.get<UsuarioApi[]>(this.apiUrl).subscribe({
      next: (usuarios) => {
        this.users.set(usuarios.map(u => ({
          id: u.id,
          name: u.nombreCompleto,
          user: u.username,
          role: this.nombreRol(u.rol),
          active: u.activo,
        })));
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.users.set([]);
        this.cargando.set(false);
        if (error.status === 401) {
          this.errorCarga.set('Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.errorCarga.set('Tu cuenta no tiene permisos para consultar usuarios.');
        } else if (error.status === 0) {
          this.errorCarga.set('No se pudo conectar con el servidor.');
        } else {
          this.errorCarga.set('No se pudo cargar la lista de usuarios.');
        }
      },
    });
  }

  abrirNuevoUsuario(): void {
    this.formulario = this.formularioVacio();
    this.errorFormulario.set('');
    this.mensajeExito.set('');
    this.mostrarPassword.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.modalAbierto.set(false);
    this.errorFormulario.set('');
    this.formulario = this.formularioVacio();
  }

  guardarUsuario(): void {
    if (this.guardando()) return;

    const datos: NuevoUsuario = {
      nombreCompleto: this.formulario.nombreCompleto.trim(),
      username: this.formulario.username.trim().toLowerCase(),
      password: this.formulario.password,
      rol: this.formulario.rol,
    };

    if (!datos.nombreCompleto || datos.nombreCompleto.length > 120) {
      this.errorFormulario.set('Ingresa un nombre completo válido (máximo 120 caracteres).');
      return;
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(datos.username)) {
      this.errorFormulario.set('El usuario debe tener de 3 a 30 caracteres: minúsculas, números, puntos, guiones o guion bajo.');
      return;
    }
    if (datos.password.length < 8 || datos.password.length > 128) {
      this.errorFormulario.set('La contraseña debe tener entre 8 y 128 caracteres.');
      return;
    }
    if (!['ADMINISTRADOR', 'VENDEDOR', 'BODEGUERO'].includes(datos.rol)) {
      this.errorFormulario.set('Selecciona un rol válido.');
      return;
    }

    this.guardando.set(true);
    this.errorFormulario.set('');

    this.http.post<UsuarioApi>(this.apiUrl, datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.formulario = this.formularioVacio();
        this.mensajeExito.set(`Usuario «${datos.username}» creado correctamente.`);
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        if (error.status === 409) {
          this.errorFormulario.set('Ese nombre de usuario ya está registrado. Prueba con otro.');
        } else if (error.status === 401) {
          this.errorFormulario.set('Tu sesión expiró. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.errorFormulario.set('No tienes permisos para crear usuarios.');
        } else if (error.status === 0) {
          this.errorFormulario.set('No se pudo conectar con NestJS.');
        } else if (error.status === 400) {
          const mensaje = error.error?.message;
          this.errorFormulario.set(Array.isArray(mensaje) ? mensaje.join(' · ') : (typeof mensaje === 'string' ? mensaje : 'Revisa los datos ingresados.'));
        } else {
          this.errorFormulario.set('No se pudo crear el usuario. Intenta nuevamente.');
        }
      },
    });
  }

  abrirAccion(tipo: "editar" | "password" | "estado", u: Usuario): void {
    this.seleccionado.set(u);
    this.accion.set(tipo);
    this.errorAccion.set('');
    this.nuevaPassword = '';
    this.mostrarPasswordAccion.set(false);
    this.edicion = { nombreCompleto: u.name, username: u.user, rol: this.rolApi(u.role) };
  }

  cerrarAccion(): void {
    if (!this.procesandoAccion()) { this.accion.set(null); this.seleccionado.set(null); }
  }

  private rolApi(rol: Usuario['role']): RolApi {
    return rol === 'Administrador' ? 'ADMINISTRADOR' : rol === 'Bodeguero' ? 'BODEGUERO' : 'VENDEDOR';
  }

  guardarAccion(): void {
    const u = this.seleccionado();
    const tipo = this.accion();
    if (!u || !tipo || this.procesandoAccion()) return;
    if (tipo === 'estado' && this.esCuentaPropia(u)) {
      this.errorAccion.set('No puedes desactivar tu propia cuenta.'); return;
    }
    if (tipo === 'editar' && this.esCuentaPropia(u) && this.edicion.rol !== 'ADMINISTRADOR') {
      this.errorAccion.set('No puedes quitarte el rol de administrador.'); return;
    }
    let datos: object;
    let url = `${this.apiUrl}/${u.id}`;
    if (tipo === 'editar') {
      const nombreCompleto = this.edicion.nombreCompleto.trim();
      const username = this.edicion.username.trim().toLowerCase();
      if (!nombreCompleto || nombreCompleto.length > 120 || !/^[a-z0-9._-]{3,30}$/.test(username)) {
        this.errorAccion.set('Revisa el nombre completo y el usuario (3 a 30 caracteres, sin espacios).'); return;
      }
      datos = { nombreCompleto, username, rol: this.edicion.rol };
    } else if (tipo === 'password') {
      if (this.nuevaPassword.length < 8 || this.nuevaPassword.length > 128) {
        this.errorAccion.set('La contraseña debe tener entre 8 y 128 caracteres.'); return;
      }
      url += '/password';
      datos = { password: this.nuevaPassword };
    } else {
      url += '/estado';
      datos = { activo: !u.active };
    }
    this.procesandoAccion.set(true);
    this.errorAccion.set('');
    this.http.patch(url, datos).subscribe({
      next: () => {
        this.procesandoAccion.set(false);
        this.cerrarAccion();
        this.mensajeExito.set('Cambios guardados correctamente.');
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.procesandoAccion.set(false);
        const msg = error.error?.message;
        this.errorAccion.set(Array.isArray(msg) ? msg.join(' · ') : typeof msg === 'string' ? msg : 'No se pudieron guardar los cambios.');
      },
    });
  }

  private formularioVacio(): NuevoUsuario {
    return { nombreCompleto: '', username: '', password: '', rol: 'VENDEDOR' };
  }

  private nombreRol(rol: RolApi): Usuario['role'] {
    switch (rol) {
      case 'ADMINISTRADOR': return 'Administrador';
      case 'VENDEDOR': return 'Vendedor';
      case 'BODEGUERO': return 'Bodeguero';
    }
  }

  initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    return (words.length > 1 ? words[0][0] + words[1][0] : words[0][0]).toUpperCase();
  }
}
