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
// PRODUCTO
// =========================================================

export interface ProductoInventarioApi {
  id: number;
  nombre: string;
  pesoLb: number;
}

// =========================================================
// INVENTARIO
// =========================================================

export interface InventarioApi {
  id: number;
  productoId: number;

  producto: ProductoInventarioApi | null;

  estado: 'LLENO' | 'VACIO';
  cantidad: number;

  creadoEn: string;
  actualizadoEn: string;
}

// =========================================================
// USUARIO DEL MOVIMIENTO
// =========================================================

export interface UsuarioMovimientoApi {
  id: number;
  nombreCompleto: string;
  username: string;
}

// =========================================================
// MOVIMIENTO DE INVENTARIO
// =========================================================

export interface MovimientoInventarioApi {
  id: number;

  tipo:
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'VENTA'
  | 'DEVOLUCION';

  estado:
  | 'LLENO'
  | 'VACIO';

  cantidad: number;

  motivo: string | null;
  referencia: string | null;

  creadoEn: string;

  producto:
  ProductoInventarioApi | null;

  usuario:
  UsuarioMovimientoApi | null;
}

// =========================================================
// DTO PARA REGISTRAR MOVIMIENTO
// =========================================================

export interface RegistrarMovimientoDto {
  productoId: number;

  tipo:
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'VENTA'
  | 'DEVOLUCION';

  estado:
  | 'LLENO'
  | 'VACIO';

  cantidad: number;

  motivo?: string;

  referencia?: string;
}

// =========================================================
// RESPUESTA DEL POST
// =========================================================

export interface RegistrarMovimientoResponse {
  producto: {
    id: number;
    nombre: string;
    pesoLb: number;
  };

  inventario: {
    cantidadAnterior: number;
    cantidadNueva: number;
    estado: 'LLENO' | 'VACIO';
  };

  movimiento: {
    id: number;
    productoId: number;
    usuarioId: number;

    tipo:
    | 'ENTRADA'
    | 'SALIDA'
    | 'AJUSTE'
    | 'VENTA'
    | 'DEVOLUCION';

    estado:
    | 'LLENO'
    | 'VACIO';

    cantidad: number;

    motivo: string | null;
    referencia: string | null;

    creadoEn: string;
  };
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class InventarioService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/inventario';

  // =======================================================
  // OBTENER STOCK
  // =======================================================

  obtenerInventario():
    Observable<InventarioApi[]> {

    return this.http.get<
      InventarioApi[]
    >(
      `${this.apiUrl}?t=${Date.now()}`,
    );
  }

  // =======================================================
  // OBTENER MOVIMIENTOS
  // =======================================================

  obtenerMovimientos():
    Observable<MovimientoInventarioApi[]> {

    return this.http.get<
      MovimientoInventarioApi[]
    >(
      `${this.apiUrl}/movimientos?t=${Date.now()}`,
    );
  }

  // =======================================================
  // REGISTRAR MOVIMIENTO
  // =======================================================

  registrarMovimiento(
    movimiento: RegistrarMovimientoDto,
  ): Observable<RegistrarMovimientoResponse> {

    return this.http.post<
      RegistrarMovimientoResponse
    >(
      `${this.apiUrl}/movimientos`,
      movimiento,
    );
  }
}
