import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type EstadoCuenta = 'Vencido' | 'Pendiente' | 'Al Día';

interface CuentaApi {
  id: number;
  cliente: { id: number; nombre: string; telefono?: string | null } | null;
  venta?: { id: number; tipo: string; total: string; creadoEn: string };
  montoOriginal: string;
  totalAbonado: string;
  saldoPendiente: string;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';
  fechaVencimiento?: string | null;
  cantidadAbonos?: number;
  creadoEn?: string;
}

export interface CuentaCliente {
  id: number; // Identificador de la cuenta por cobrar, no del cliente
  name: string;
  tel: string;
  debt: number;
  last: string;
  st: EstadoCuenta;
  ventaId?: number;
}

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-cobrar.html',
  styleUrl: './cuentas-cobrar.css'
})
export class CuentasCobrar implements OnInit {
  private readonly api = 'http://localhost:3000';
  rows: CuentaCliente[] = [];
  kpi = { tot: 0, ven: 0, cob: 0 };
  // La API de cuentas devuelve totales abonados históricos, no cobros por fecha.
  // Cobros hoy queda en cero hasta disponer de un GET /abonos con fechas.
  cargando = false;
  errorCarga = '';
  guardando = false;
  filter: 'all' | EstadoCuenta = 'all';
  cls: Record<EstadoCuenta, string> = {
    'Vencido': 'v', 'Pendiente': 'pe', 'Al Día': 'ok'
  };
  modalAbonoVisible = false;
  cuentaSeleccionada: CuentaCliente | null = null;
  montoAbono = 0;
  errorMsg = '';
  toastVisible = false;
  toastMsg = '';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void { void this.cargarCuentas(); }

  private fechaLocalISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private estadoVisual(c: CuentaApi): EstadoCuenta {
    if (Number(c.saldoPendiente) <= 0 || c.estado === 'PAGADA') return 'Al Día';
    if (c.estado === 'VENCIDA' || (c.fechaVencimiento && c.fechaVencimiento.slice(0, 10) < this.fechaLocalISO())) return 'Vencido';
    return 'Pendiente';
  }

  async cargarCuentas(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';
    try {
      const cuentas = await firstValueFrom(this.http.get<CuentaApi[]>(`${this.api}/cuentas-cobrar`));
      this.rows = cuentas.map(c => ({
        id: c.id,
        name: c.cliente?.nombre ?? 'Cliente no identificado',
        tel: c.cliente?.telefono || '—',
        debt: Number(c.saldoPendiente) || 0,
        last: '—', // El endpoint no incluye la fecha del último abono.
        st: this.estadoVisual(c),
        ventaId: c.venta?.id
      }));
      this.kpi.tot = this.rows.reduce((s, r) => s + r.debt, 0);
      this.kpi.ven = this.rows.filter(r => r.st === 'Vencido').reduce((s, r) => s + r.debt, 0);
      this.kpi.cob = 0; // No inventar el dato de cobros de hoy.
    } catch {
      this.errorCarga = 'No se pudieron cargar las cuentas. Comprueba que NestJS esté ejecutándose.';
      this.rows = [];
      this.kpi = { tot: 0, ven: 0, cob: 0 };
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  get filteredRows(): CuentaCliente[] {
    return this.filter === 'all' ? this.rows : this.rows.filter(r => r.st === this.filter);
  }
  setFilter(f: 'all' | EstadoCuenta): void { this.filter = f; }
  countByStatus(st: EstadoCuenta): number { return this.rows.filter(r => r.st === st).length; }
  money(n: number): string {
    return 'Q ' + (Number(n) || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  toast(m: string): void {
    this.toastMsg = m;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 2600);
  }
  abrirModalAbono(cuenta: CuentaCliente): void {
    if (cuenta.debt <= 0) return;
    this.cuentaSeleccionada = cuenta;
    this.montoAbono = 0;
    this.errorMsg = '';
    this.modalAbonoVisible = true;
  }
  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbonoVisible = false;
    this.cuentaSeleccionada = null;
  }
  cerrarModalPorBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('ov')) this.cerrarModal();
  }
  @HostListener('document:keydown.escape')
  handleEscape(): void { if (this.modalAbonoVisible) this.cerrarModal(); }

  async guardarAbono(): Promise<void> {
    if (!this.cuentaSeleccionada || this.guardando) return;
    const m = Math.round(Number(this.montoAbono) * 100) / 100;
    if (!Number.isFinite(m) || m <= 0) {
      this.errorMsg = 'Ingresa un monto mayor a Q 0.00';
      return;
    }
    if (m > this.cuentaSeleccionada.debt) {
      this.errorMsg = `El abono no puede superar la deuda (${this.money(this.cuentaSeleccionada.debt)})`;
      return;
    }
    this.guardando = true;
    this.errorMsg = '';
    const nombre = this.cuentaSeleccionada.name;
    try {
      await firstValueFrom(this.http.post(`${this.api}/abonos`, {
        cuentaCobrarId: this.cuentaSeleccionada.id,
        monto: m
      }));
      this.guardando = false;
      this.cerrarModal();
      await this.cargarCuentas();
      this.toast(`Abono de ${this.money(m)} registrado a ${nombre}`);
      this.cdr.detectChanges();
    } catch (e: unknown) {
      this.guardando = false;
      const err = e as { error?: { message?: string | string[] } };
      const message = err?.error?.message;
      this.errorMsg = Array.isArray(message) ? message.join(', ') : (message || 'No se pudo guardar el abono.');
      this.cdr.detectChanges();
    }
  }
}
