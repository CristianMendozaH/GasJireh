import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EstadoCuenta = 'Vencido' | 'Pendiente' | 'Al Día';

export interface CuentaCliente {
  id: number;
  name: string;
  tel: string;
  debt: number;
  last: string;
  st: EstadoCuenta;
}

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-cobrar.html',
  styleUrl: './cuentas-cobrar.css'
})
export class CuentasCobrar {
  readonly TODAY = '2026-10-19';

  rows: CuentaCliente[] = [
    { id: 0, name: 'Restaurante El Fogón', tel: '8888-1254', debt: 1550, last: '2026-08-18', st: 'Vencido' },
    { id: 1, name: 'Soda Doña Carmen', tel: '7654-9998', debt: 342, last: '2026-07-30', st: 'Pendiente' },
    { id: 2, name: 'Hotel Vista Volcán', tel: '2222-5678', debt: 0, last: '2026-09-20', st: 'Al Día' },
    { id: 3, name: 'Comidas Rápidas Pérez', tel: '6543-8811', debt: 760, last: '2026-07-30', st: 'Vencido' }
  ];

  kpi = {
    tot: 2952,
    ven: 2610,
    cob: 2400
  };

  filter: 'all' | EstadoCuenta = 'all';
  cls: Record<EstadoCuenta, string> = {
    'Vencido': 'v',
    'Pendiente': 'pe',
    'Al Día': 'ok'
  };

  // Modal y Abonos
  modalAbonoVisible = false;
  cuentaSeleccionada: CuentaCliente | null = null;
  montoAbono: number = 0;
  errorMsg = '';

  // Toast
  toastVisible = false;
  toastMsg = '';
  private toastTimer: any;

  get filteredRows(): CuentaCliente[] {
    if (this.filter === 'all') {
      return this.rows;
    }
    return this.rows.filter(r => r.st === this.filter);
  }

  setFilter(f: 'all' | EstadoCuenta) {
    this.filter = f;
  }

  countByStatus(st: EstadoCuenta): number {
    return this.rows.filter(r => r.st === st).length;
  }

  money(n: number): string {
    return 'Q ' + (n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  toast(m: string) {
    this.toastMsg = m;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  abrirModalAbono(cuenta: CuentaCliente) {
    this.cuentaSeleccionada = cuenta;
    this.montoAbono = cuenta.debt;
    this.errorMsg = '';
    this.modalAbonoVisible = true;
  }

  cerrarModal() {
    this.modalAbonoVisible = false;
    this.cuentaSeleccionada = null;
  }

  cerrarModalPorBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ov')) {
      this.cerrarModal();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.modalAbonoVisible) {
      this.cerrarModal();
    }
  }

  guardarAbono() {
    if (!this.cuentaSeleccionada) return;

    const m = Math.round((Number(this.montoAbono) || 0) * 100) / 100;

    if (isNaN(m) || m <= 0) {
      this.errorMsg = 'Ingresa un monto mayor a Q 0.00';
      return;
    }

    if (m > this.cuentaSeleccionada.debt) {
      this.errorMsg = `El abono no puede superar la deuda (${this.money(this.cuentaSeleccionada.debt)})`;
      return;
    }

    if (this.cuentaSeleccionada.st === 'Vencido') {
      this.kpi.ven = Math.max(0, this.kpi.ven - m);
    }

    this.kpi.tot = Math.max(0, this.kpi.tot - m);
    this.kpi.cob += m;

    this.cuentaSeleccionada.debt = Math.round((this.cuentaSeleccionada.debt - m) * 100) / 100;
    this.cuentaSeleccionada.last = this.TODAY;

    if (this.cuentaSeleccionada.debt === 0) {
      this.cuentaSeleccionada.st = 'Al Día';
    }

    const clienteNombre = this.cuentaSeleccionada.name;
    this.cerrarModal();
    this.toast(`Abono de ${this.money(m)} registrado a ${clienteNombre}`);
  }
}
