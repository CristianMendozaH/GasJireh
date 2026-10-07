import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Client {
  name: string;
  tel: string;
  st: 'Vencido' | 'Pendiente' | 'Al Día';
  debt: number;
  limit: number;
  auth: boolean;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes {
  clients: Client[] = [
    { name: 'Restaurante El Fogón', tel: '8888-1254', st: 'Vencido', debt: 1550, limit: 5000, auth: true },
    { name: 'Soda Doña Carmen', tel: '7654-9998', st: 'Pendiente', debt: 342, limit: 1500, auth: true },
    { name: 'Hotel Vista Volcán', tel: '2222-5678', st: 'Al Día', debt: 0, limit: 1000, auth: true },
    { name: 'Comidas Rápidas Pérez', tel: '6543-8811', st: 'Vencido', debt: 760, limit: 2000, auth: false }
  ];

  readonly cls: Record<string, string> = {
    'Vencido': 'v',
    'Pendiente': 'pe',
    'Al Día': 'ok'
  };

  searchQuery = '';
  editingIndex: number | null = null;
  newestClient: Client | null = null;

  // Estado del Modal
  modalVisible = false;
  formName = '';
  formTel = '';
  formLimit: number | string = '';
  formDebt = 0;
  formAuth = false;
  lastLimit = '';

  // Mensajes de error
  errName = '';
  errTel = '';
  errLimit = '';

  // Toast
  toastVisible = false;
  toastMsg = '';
  private toastTimer: any;

  get filteredClients(): Client[] {
    const q = this.norm(this.searchQuery.trim());
    return this.clients.filter(c =>
      !q || this.norm(c.name).includes(q) || c.tel.includes(q)
    );
  }

  norm(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  money(n: number): string {
    return 'Q' + n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  toast(m: string) {
    this.toastMsg = m;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  fmtTel(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d;
  }

  onTelInput(value: string) {
    this.formTel = this.fmtTel(value);
    this.errTel = '';
  }

  onAuthChange() {
    if (!this.formAuth) {
      if (this.formLimit !== '' && this.formLimit !== null) {
        this.lastLimit = String(this.formLimit);
      }
      this.formLimit = '0.00';
    } else {
      this.formLimit = this.lastLimit;
    }
    this.errLimit = '';
  }

  clearErrors() {
    this.errName = '';
    this.errTel = '';
    this.errLimit = '';
  }

  openModal(i: number | null) {
    this.editingIndex = i;
    this.clearErrors();

    if (i === null) {
      this.formName = '';
      this.formTel = '';
      this.formLimit = '';
      this.formDebt = 0;
      this.formAuth = false;
      this.lastLimit = '';
    } else {
      const c = this.clients[i];
      this.formName = c.name;
      this.formTel = c.tel;
      this.formDebt = c.debt;
      this.formAuth = c.auth;
      this.formLimit = c.auth ? c.limit : '0.00';
      this.lastLimit = String(c.limit);
    }

    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  cerrarModalPorBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ov')) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.modalVisible) {
      this.closeModal();
    }
  }

  saveClient() {
    const name = this.formName.trim().replace(/\s+/g, ' ');
    const tel = this.formTel;
    const auth = this.formAuth;
    const rawLimit = String(this.formLimit).trim();
    const lim = parseFloat(rawLimit);

    this.clearErrors();

    if (!name) {
      this.errName = 'El nombre o negocio es obligatorio';
    } else if (this.clients.some((c, idx) => idx !== this.editingIndex && this.norm(c.name) === this.norm(name))) {
      this.errName = 'Ya existe un cliente con ese nombre';
    }

    if (!tel) {
      this.errTel = 'El teléfono es obligatorio';
    } else if (!/^\d{4}-\d{4}$/.test(tel)) {
      this.errTel = 'Ingresa un teléfono de 8 dígitos';
    }

    if (auth) {
      if (rawLimit === '' || isNaN(lim)) {
        this.errLimit = 'Define el límite de crédito';
      } else if (lim < 0) {
        this.errLimit = 'El límite no puede ser negativo';
      }
    }

    if (this.errName || this.errTel || this.errLimit) {
      return;
    }

    const limit = auth ? Math.round(lim * 100) / 100 : 0;

    if (this.editingIndex === null) {
      this.newestClient = {
        name,
        tel,
        st: 'Al Día',
        debt: 0,
        limit,
        auth
      };
      this.clients.unshift(this.newestClient);
      this.toast('Cliente registrado correctamente');
    } else {
      Object.assign(this.clients[this.editingIndex], {
        name,
        tel,
        limit,
        auth
      });
      this.newestClient = null;
      this.toast('Cliente actualizado correctamente');
    }

    this.closeModal();
    this.searchQuery = '';
  }
}
