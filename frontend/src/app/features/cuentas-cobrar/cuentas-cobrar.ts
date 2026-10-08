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

interface AbonoApi {
  id: number;
  cuentaCobrarId: number;
  monto: string | number;
  creadoEn: string;
  observacion?: string | null;
  usuarioId?: number;
}

interface HistorialCuentaApi {
  cuentaCobrarId: number;
  montoOriginal: string | number;
  saldoPendiente: string | number;
  estado: string;
  abonos: AbonoApi[];
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
  cargando = false;
  errorCarga = '';
  errorAbonos = '';
  cobrosDisponibles = false;
  guardando = false;
  filter: 'all' | EstadoCuenta = 'all';
  cls: Record<EstadoCuenta, string> = {
    'Vencido': 'v', 'Pendiente': 'pe', 'Al Día': 'ok'
  };
  modalHistorialVisible = false;
  cuentaHistorial: CuentaCliente | null = null;
  historial: HistorialCuentaApi | null = null;
  cargandoHistorial = false;
  errorHistorial = '';
  private historialRequestId = 0;
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
      let abonos: AbonoApi[] = [];
      this.cobrosDisponibles = false;
      this.errorAbonos = '';
      try {
        abonos = await firstValueFrom(this.http.get<AbonoApi[]>(`${this.api}/abonos`));
        this.cobrosDisponibles = true;
      } catch {
        this.errorAbonos = 'No se pudo consultar el historial de abonos. Las fechas y cobros de hoy no están disponibles.';
      }

      const ultimos = new Map<number, Date>();
      let cobrosHoyCentavos = 0;
      const hoy = this.fechaLocalISO();
      for (const abono of abonos) {
        const fecha = new Date(abono.creadoEn);
        if (Number.isNaN(fecha.getTime())) continue;
        const anterior = ultimos.get(abono.cuentaCobrarId);
        if (!anterior || fecha > anterior) ultimos.set(abono.cuentaCobrarId, fecha);
        const fechaLocal = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        if (fechaLocal === hoy) {
          const monto = Number(abono.monto);
          if (Number.isFinite(monto)) cobrosHoyCentavos += Math.round(monto * 100);
        }
      }
      this.rows = cuentas.map(c => ({
        id: c.id,
        name: c.cliente?.nombre ?? 'Cliente no identificado',
        tel: c.cliente?.telefono || '—',
        debt: Number(c.saldoPendiente) || 0,
        last: ultimos.has(c.id)
          ? ultimos.get(c.id)!.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
          : '—',
        st: this.estadoVisual(c),
        ventaId: c.venta?.id
      }));
      this.kpi.tot = this.rows.reduce((s, r) => s + r.debt, 0);
      this.kpi.ven = this.rows.filter(r => r.st === 'Vencido').reduce((s, r) => s + r.debt, 0);
      this.kpi.cob = cobrosHoyCentavos / 100;
    } catch {
      this.errorCarga = 'No se pudieron cargar las cuentas. Comprueba que NestJS esté ejecutándose.';
      this.errorAbonos = '';
      this.cobrosDisponibles = false;
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
  async abrirHistorial(cuenta: CuentaCliente): Promise<void> {
    const requestId = ++this.historialRequestId;
    this.cuentaHistorial = cuenta;
    this.historial = null;
    this.errorHistorial = '';
    this.cargandoHistorial = true;
    this.modalHistorialVisible = true;
    try {
      const resultado = await firstValueFrom(
        this.http.get<HistorialCuentaApi>(`${this.api}/abonos/cuenta/${cuenta.id}`)
      );
      if (requestId !== this.historialRequestId) return;
      this.historial = {
        ...resultado,
        abonos: [...(resultado.abonos ?? [])].sort((a, b) =>
          new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()
        )
      };
    } catch {
      if (requestId !== this.historialRequestId) return;
      this.errorHistorial = 'No se pudo consultar el historial de esta cuenta.';
    } finally {
      if (requestId === this.historialRequestId) {
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      }
    }
  }
  cerrarHistorial(): void {
    ++this.historialRequestId;
    this.modalHistorialVisible = false;
    this.cuentaHistorial = null;
    this.historial = null;
    this.cargandoHistorial = false;
    this.errorHistorial = '';
  }
  totalAbonadoHistorial(): number {
    if (!this.historial) return 0;
    return this.historial.abonos.reduce((total, abono) => total + Number(abono.monto), 0);
  }
  saldoTrasAbono(index: number): number {
    if (!this.historial) return 0;
    const abonado = this.historial.abonos.slice(0, index + 1)
      .reduce((total, abono) => total + Number(abono.monto), 0);
    return Math.max(0, Number(this.historial.montoOriginal) - abonado);
  }
  fechaAbono(fecha: string): string {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
  }
  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbonoVisible = false;
    this.cuentaSeleccionada = null;
  }
  cerrarModalPorBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('ov')) {
      if (this.modalHistorialVisible) this.cerrarHistorial();
      else this.cerrarModal();
    }
  }
  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.modalHistorialVisible) this.cerrarHistorial();
    else if (this.modalAbonoVisible) this.cerrarModal();
  }

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
