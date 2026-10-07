import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoApi {
  id: number;
  nombre: string;
  pesoLb: number;
  precio: string | number;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ProductoInventarioApi {
  id: number;
  nombre: string;
  pesoLb: number;
}

export interface InventarioApi {
  id: number;
  productoId: number;
  producto?: ProductoInventarioApi;
  estado: 'LLENO' | 'VACIO';
  cantidad: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ClienteApi {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  nit: string | null;
  limiteCredito: string | number;
  estado: 'ACTIVO' | 'INACTIVO';
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  vaciosRecibidos: number;
}

export interface CrearVentaRequest {
  clienteId?: number;
  tipo: 'CONTADO' | 'CREDITO';
  fechaVencimiento?: string;
  detalles: DetalleVentaRequest[];
}

export interface VentaResponse {
  id: number;
  clienteId?: number | null;
  usuarioId: number;
  tipo: 'CONTADO' | 'CREDITO';
  estado: string;
  total: string | number;
  creadoEn?: string;
  actualizadoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Obtiene los productos registrados en PostgreSQL.
   */
  getProductos(): Observable<ProductoApi[]> {
    return this.http.get<ProductoApi[]>(
      `${this.apiUrl}/productos`
    );
  }

  /**
   * Obtiene el inventario actual.
   *
   * Para la pantalla de ventas utilizaremos principalmente
   * los registros con estado LLENO.
   */
  getInventario(): Observable<InventarioApi[]> {
    return this.http.get<InventarioApi[]>(
      `${this.apiUrl}/inventario`
    );
  }

  /**
   * Obtiene los clientes registrados.
   *
   * Después filtraremos los clientes ACTIVOS y los que
   * tengan crédito disponible.
   */
  getClientes(): Observable<ClienteApi[]> {
    return this.http.get<ClienteApi[]>(
      `${this.apiUrl}/clientes`
    );
  }

  /**
   * Registra una venta real en el backend.
   *
   * El backend será responsable de:
   * - crear la venta;
   * - crear los detalles;
   * - descontar cilindros llenos;
   * - registrar cilindros vacíos recibidos;
   * - crear movimientos de inventario;
   * - crear la cuenta por cobrar si es CREDITO.
   */
  crearVenta(
    venta: CrearVentaRequest
  ): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(
      `${this.apiUrl}/ventas`,
      venta
    );
  }
  /**
 * Actualiza el precio de un producto.
 */
  actualizarPrecio(
    productoId: number,
    precio: number
  ): Observable<ProductoApi> {
    return this.http.patch<ProductoApi>(
      `${this.apiUrl}/productos/${productoId}/precio`,
      { precio }
    );
  }
}
