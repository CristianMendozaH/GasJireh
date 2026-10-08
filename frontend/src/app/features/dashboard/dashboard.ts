import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';

interface Transaccion {
  id: string;
  cli: string;
  prod: string;
  total: number;
  m: 'Contado' | 'Crédito';
  h: string;
}
interface StockItem { f: number; v: number; }
interface VentaApi {
  id: number;
  cliente: { nombre: string } | null;
  tipo: string;
  total: number | string;
  estado: string;
  creadoEn: string;
  detalles: Array<{ cantidad: number; producto: { nombre: string; pesoLb: number } | null }>;
}
interface CuentaApi {
  saldoPendiente: string | number;
  estado: string;
  fechaVencimiento?: string | null;
}
interface InventarioApi {
  productoId: number;
  producto?: { pesoLb: number } | null;
  estado: string;
  cantidad: number;
}
interface ProductoApi { id: number; pesoLb: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly api = 'http://localhost:3000';
  readonly fechaHoy = new Date().toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toLocaleUpperCase('es-GT');

  stock: Record<string, StockItem> = {
    '25': { f: 0, v: 0 },
    '35': { f: 0, v: 0 },
    '100': { f: 0, v: 0 },
  };
  tx: Transaccion[] = [];
  ventasHoy: Transaccion[] = [];
  cxc = 0;
  vencido = 0;
  cargando = true;
  errorCarga = '';

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) { }

  // El AuthService guarda el usuario en localStorage o sessionStorage.
  // Esta condición controla solo la interfaz; la API debe validar permisos.
  get puedeGestionarVentas(): boolean {
    const usuarioGuardado = localStorage.getItem('usuario') ?? sessionStorage.getItem('usuario');
    if (!usuarioGuardado) return false;
    try {
      const usuario: { rol?: string } = JSON.parse(usuarioGuardado);
      return usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'VENDEDOR';
    } catch {
      return false;
    }
  }

  ngOnInit(): void { void this.cargarDatos(); }

  get stockKeys(): string[] { return Object.keys(this.stock); }
  get totalStockLleno(): number {
    return Object.values(this.stock).reduce((s, x) => s + x.f, 0);
  }
  get ventasContado(): Transaccion[] {
    return this.ventasHoy.filter(t => t.m === 'Contado');
  }
  get ventasCredito(): Transaccion[] {
    return this.ventasHoy.filter(t => t.m === 'Crédito');
  }
  sumVentas(list: Transaccion[]): number {
    return list.reduce((s, t) => s + t.total, 0);
  }
  money(n: number): string {
    return 'Q ' + n.toLocaleString('es-GT', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }
  private fechaLocal(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';
    this.cdr.detectChanges();
    try {
      const datos = await firstValueFrom(forkJoin({
        ventas: this.http.get<VentaApi[]>(`${this.api}/ventas`),
        cuentas: this.http.get<CuentaApi[]>(`${this.api}/cuentas-cobrar`),
        inventario: this.http.get<InventarioApi[]>(`${this.api}/inventario`),
        productos: this.http.get<ProductoApi[]>(`${this.api}/productos`),
      }));
      const hoy = this.fechaLocal(new Date());
      const ventasValidas = datos.ventas
        .filter(v => v.estado !== 'ANULADA')
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
      const transformar = (v: VentaApi): Transaccion => ({
        id: `T-${String(v.id).padStart(4, '0')}`,
        cli: v.cliente?.nombre || 'Cliente de mostrador',
        prod: v.detalles.map(d => `${d.cantidad} × ${d.producto?.pesoLb ?? d.producto?.nombre ?? 'Producto'} lb`)
          .join(', ') || 'Sin detalle',
        total: Number(v.total),
        m: v.tipo === 'CREDITO' ? 'Crédito' : 'Contado',
        h: new Date(v.creadoEn).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
      this.tx = ventasValidas.slice(0, 10).map(transformar);
      this.ventasHoy = ventasValidas
        .filter(v => this.fechaLocal(new Date(v.creadoEn)) === hoy)
        .map(transformar);

      this.cxc = 0;
      this.vencido = 0;
      for (const cuenta of datos.cuentas) {
        const saldo = Number(cuenta.saldoPendiente);
        if (!Number.isFinite(saldo) || saldo <= 0) continue;
        this.cxc += saldo;
        const vencida = cuenta.estado === 'VENCIDA' ||
          (!!cuenta.fechaVencimiento && this.fechaLocal(new Date(cuenta.fechaVencimiento)) < hoy);
        if (vencida) this.vencido += saldo;
      }

      const productosPorId = new Map(datos.productos.map(p => [p.id, String(p.pesoLb)]));
      const nuevoStock: Record<string, StockItem> = {
        '25': { f: 0, v: 0 }, '35': { f: 0, v: 0 }, '100': { f: 0, v: 0 },
      };
      for (const item of datos.inventario) {
        const peso = item.producto?.pesoLb != null
          ? String(item.producto.pesoLb) : productosPorId.get(item.productoId);
        if (!peso || !nuevoStock[peso]) continue;
        if (item.estado === 'LLENO') nuevoStock[peso].f += Number(item.cantidad);
        if (item.estado === 'VACIO') nuevoStock[peso].v += Number(item.cantidad);
      }
      this.stock = nuevoStock;
    } catch (error) {
      console.error('No se pudo cargar el Dashboard', error);
      this.errorCarga = 'No se pudo consultar toda la información. Comprueba que el backend esté encendido e inténtalo nuevamente.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  abrirModalVenta(): void { void this.router.navigate(['/ventas']); }
  abrirModalAbono(): void { void this.router.navigate(['/cuentas-cobrar']); }
}
