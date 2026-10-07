import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transaccion {
  id: string;
  cli: string;
  prod: string;
  total: number;
  m: 'Contado' | 'Crédito';
  h: string;
}

interface StockItem {
  f: number;
  v: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly PRICE: Record<string, number> = { '25': 125, '35': 170, '100': 480 };

  stock: Record<string, StockItem> = {
    '25': { f: 0, v: 0 },
    '35': { f: 0, v: 0 },
    '100': { f: 0, v: 0 }
  };

  tx: Transaccion[] = [];
  cxc = 0;
  vencido = 0;
  private autoId = 0;

  // Modales y Formularios
  modalVenta = false;
  modalAbono = false;
  vCli = 'Cliente de mostrador';
  vProd = '25';
  vQty = 1;
  vMet: 'Contado' | 'Crédito' = 'Contado';
  aCli = 'Tienda Doña Marta';
  aMonto = 100;

  // Toast
  toastMsg = '';
  toastVisible = false;
  private toastTimer: any;

  get stockKeys(): string[] {
    return Object.keys(this.stock);
  }

  get totalStockLleno(): number {
    return Object.values(this.stock).reduce((s, x) => s + x.f, 0);
  }

  get ventasContado(): Transaccion[] {
    return this.tx.filter(t => t.m === 'Contado');
  }

  get ventasCredito(): Transaccion[] {
    return this.tx.filter(t => t.m === 'Crédito');
  }

  sumVentas(list: Transaccion[]): number {
    return list.reduce((s, t) => s + t.total, 0);
  }

  money(n: number): string {
    return 'Q ' + n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  toast(m: string) {
    this.toastMsg = m;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 2600);
  }

  cargarDemo() {
    this.tx = [
      { id: 'T-0004', cli: 'Restaurante El Fogón', prod: '2 × 100 lb', total: 960, m: 'Crédito', h: '10:42' },
      { id: 'T-0003', cli: 'Cliente de mostrador', prod: '1 × 25 lb', total: 125, m: 'Contado', h: '09:58' },
      { id: 'T-0002', cli: 'Tienda Doña Marta', prod: '3 × 35 lb', total: 510, m: 'Contado', h: '08:31' },
      { id: 'T-0001', cli: 'Comedor San José', prod: '4 × 25 lb', total: 500, m: 'Crédito', h: '07:55' }
    ];
    this.autoId = 4;
    this.cxc = 4850;
    this.vencido = 1250;
    this.stock = {
      '25': { f: 42, v: 18 },
      '35': { f: 27, v: 12 },
      '100': { f: 9, v: 5 }
    };
    this.toast('Datos de ejemplo cargados');
  }

  abrirModalVenta() { this.modalVenta = true; }
  abrirModalAbono() { this.modalAbono = true; }
  cerrarModales() { this.modalVenta = false; this.modalAbono = false; }

  guardarVenta() {
    const k = this.vProd;
    const q = Math.max(1, Number(this.vQty) || 1);
    const m = this.vMet;
    const total = this.PRICE[k] * q;

    if (this.stock[k].f < q && this.tx.length > 0) {
      this.toast('Stock insuficiente de ' + k + ' lb');
      return;
    }

    if (this.stock[k].f >= q) {
      this.stock[k].f -= q;
      this.stock[k].v += q;
    }

    if (m === 'Crédito') this.cxc += total;

    this.autoId++;
    const id = 'T-' + String(this.autoId).padStart(4, '0');
    const h = new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

    this.tx.unshift({ id, cli: this.vCli, prod: `${q} × ${k} lb`, total, m, h });
    this.cerrarModales();
    this.toast('Venta registrada: ' + this.money(total));
  }

  guardarAbono() {
    const a = Math.max(0, Number(this.aMonto) || 0);
    this.cxc = Math.max(0, this.cxc - a);
    this.vencido = Math.min(this.vencido, this.cxc);
    this.cerrarModales();
    this.toast('Abono registrado: ' + this.money(a));
  }
}
