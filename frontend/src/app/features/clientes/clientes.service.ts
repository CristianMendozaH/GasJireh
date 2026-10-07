import {
  Injectable,
  inject,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

// =========================================================
// CLIENTE RECIBIDO DEL BACKEND
// =========================================================

export interface ClienteApi {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  nit: string | null;

  limiteCredito:
  string | number;

  estado:
  'ACTIVO' | 'INACTIVO';

  creadoEn: string;
  actualizadoEn: string;
}

// =========================================================
// DATOS PARA CREAR CLIENTE
// =========================================================

export interface CrearClienteDto {
  nombre: string;

  telefono?: string;
  direccion?: string;
  nit?: string;

  limiteCredito: number;
}

// =========================================================
// DATOS PARA ACTUALIZAR CLIENTE
// =========================================================

export interface ActualizarClienteDto {
  nombre?: string;

  telefono?: string;
  direccion?: string;
  nit?: string;

  limiteCredito?: number;

  estado?:
  'ACTIVO' | 'INACTIVO';
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class ClientesService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/clientes';

  // =======================================================
  // LISTAR CLIENTES
  // =======================================================

  obtenerClientes():
    Observable<ClienteApi[]> {

    return this.http.get<
      ClienteApi[]
    >(
      `${this.apiUrl}?t=${Date.now()}`,
    );
  }

  // =======================================================
  // CREAR CLIENTE
  // =======================================================

  crearCliente(
    cliente: CrearClienteDto,
  ): Observable<ClienteApi> {

    return this.http.post<
      ClienteApi
    >(
      this.apiUrl,
      cliente,
    );
  }

  // =======================================================
  // ACTUALIZAR CLIENTE
  // =======================================================

  actualizarCliente(
    id: number,
    cliente: ActualizarClienteDto,
  ): Observable<ClienteApi> {

    return this.http.patch<
      ClienteApi
    >(
      `${this.apiUrl}/${id}`,
      cliente,
    );
  }
}
