import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StockItem {
  f: number;
  v: number;
}

export interface Movimiento {
  d: string;
  t: 'Entrada' | 'Salida';
  s: string;
  q: number;
  u: string;
  n: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario {
  readonly TODAY = '2026-10-19';

  stock: Record<string, StockItem> = {
    '25': { f: 42, v: 18 },
    '35': { f: 27, v: 11 },
    '100': { f: 15, v: 6 }
  };

  stockKeys = ['25', '35', '100'];

  mov: Movimiento[] = [
    { d: '2026-09-21 09:15', t: 'Salida', s: '25 lb', q: 4, u: 'Carlos M.', n: 'Venta contado' },
    { d: '2026-09-21 08:40', t: 'Entrada', s: '100 lb', q: 20, u: 'Luis G.', n: 'Entrega proveedor Tropigas' },
    { d: '2026-09-20 17:22', t: 'Salida', s: '35 lb', q: 3, u: 'Carlos M.', n: 'Venta crédito · Restaurante El Fogón' },
    { d: '2026-09-20 15:05', t: 'Salida', s: '100 lb', q: 2, u: 'Ana R.', n: 'Venta crédito · Hotel Vista Volcán' },
    { d: '2026-09-20 11:30', t: 'Entrada', s: '25 lb', q: 30, u: 'Luis G.', n: 'Entrega proveedor Tropigas' },
    { d: '2026-09-20 09:48', t: 'Salida', s: '25 lb', q: 6, u: 'Carlos M.', n: 'Venta contado' },
    { d: '2026-09-19 16:10', t: 'Salida', s: '35 lb', q: 5, u: 'Ana R.', n: 'Venta contado' },
    { d: '2026-09-19 10:25', t: 'Entrada', s: '35 lb', q: 15, u: 'Luis G.', n: 'Entrega proveedor Gas Zeta' },
    { d: '2026-09-18 14:02', t: 'Salida', s: '100 lb', q: 1, u: 'Carlos M.', n: 'Venta crédito · Soda Doña Carmen' },
    { d: '2026-09-18 08:55', t: 'Salida', s: '25 lb', q: 8, u: 'Ana R.', n: 'Venta contado' },
    { d: '2026-09-17 13:40', t: 'Entrada', s: '100 lb', q: 10, u: 'Luis G.', n: 'Entrega proveedor Tropigas' },
    { d: '2026-09-17 09:12', t: 'Salida', s: '35 lb', q: 4, u: 'Carlos M.', n: 'Venta contado' }
  ];

  // Filtros
  fTipo = '';
  fTam = '';
  fFecha = '';

  // Control animación
  updatedKey: string | null = null;
  newestMov: Movimiento | null = null;

  // Modal entrada
  modalVisible = false;
  mTam = '25';
  mQty: number | null = null;
  mProv = 'Tropigas';
  mSwap = true;
  isQtyBad = false;

  // Toast
  toastVisible = false;
  toastMsg = '';
  private toastTimer: any;

  get hasFilters(): boolean {
    return !!(this.fTipo || this.fTam || this.fFecha);
  }

  get filteredMovimientos(): Movimiento[] {
    return this.mov.filter(m =>
      (!this.fTipo || m.t === this.fTipo) &&
      (!this.fTam || m.s === this.fTam) &&
      (!this.fFecha || m.d.startsWith(this.fFecha))
    );
  }

  limpiarFiltros() {
    this.fTipo = '';
    this.fTam = '';
    this.fFecha = '';
  }

  toast(m: string) {
    this.toastMsg = m;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  abrirModalEntrada() {
    this.mQty = null;
    this.isQtyBad = false;
    this.mSwap = true;
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
  }

  cerrarModalPorBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ov')) {
      this.cerrarModal();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.modalVisible) {
      this.cerrarModal();
    }
  }

  guardarEntrada() {
    const q = Number(this.mQty);
    if (isNaN(q) || q <= 0 || !Number.isInteger(q)) {
      this.isQtyBad = true;
      return;
    }

    const k = this.mTam;
    this.stock[k].f += q;

    if (this.mSwap) {
      this.stock[k].v = Math.max(0, this.stock[k].v - q);
    }

    const now = new Date();
    const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    this.newestMov = {
      d: `${this.TODAY} ${hm}`,
      t: 'Entrada',
      s: `${k} lb`,
      q,
      u: 'Administrador',
      n: `Entrega proveedor ${this.mProv}`
    };

    this.mov.unshift(this.newestMov);

    // Animación pop al stock actualizado
    this.updatedKey = k;
    setTimeout(() => {
      this.updatedKey = null;
    }, 600);

    this.cerrarModal();
    this.toast(`Entrada registrada: ${q} × ${k} lb`);
  }
}
