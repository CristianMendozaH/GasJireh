import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RolUsuario =
  | 'ADMINISTRADOR'
  | 'VENDEDOR'
  | 'BODEGUERO';

export interface UsuarioSesion {
  id: number;
  nombreCompleto: string;
  username: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  accessToken: string;
  usuario: UsuarioSesion;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/auth';

  login(
    username: string,
    password: string,
  ): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      {
        username,
        password,
      },
    );
  }

  guardarSesion(
    respuesta: LoginResponse,
    recordarme: boolean,
  ): void {
    const almacenamiento = recordarme
      ? localStorage
      : sessionStorage;

    const otroAlmacenamiento = recordarme
      ? sessionStorage
      : localStorage;

    otroAlmacenamiento.removeItem(
      'accessToken',
    );

    otroAlmacenamiento.removeItem(
      'usuario',
    );

    almacenamiento.setItem(
      'accessToken',
      respuesta.accessToken,
    );

    almacenamiento.setItem(
      'usuario',
      JSON.stringify(
        respuesta.usuario,
      ),
    );
  }

  obtenerToken(): string | null {
    return (
      localStorage.getItem(
        'accessToken',
      ) ??
      sessionStorage.getItem(
        'accessToken',
      )
    );
  }

  obtenerUsuario():
    | UsuarioSesion
    | null {
    const usuario =
      localStorage.getItem('usuario') ??
      sessionStorage.getItem(
        'usuario',
      );

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(
        usuario,
      ) as UsuarioSesion;
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  cerrarSesion(): void {
    localStorage.removeItem(
      'accessToken',
    );

    localStorage.removeItem(
      'usuario',
    );

    sessionStorage.removeItem(
      'accessToken',
    );

    sessionStorage.removeItem(
      'usuario',
    );
  }
}
