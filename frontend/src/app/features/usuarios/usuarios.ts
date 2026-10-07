import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Usuario {
  name: string;
  user: string;
  role: string;
  active: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios {
  readonly SELF = 'admin'; // Cuenta con la sesión activa actual[cite: 16]

  users: Usuario[] = [
    { name: 'Administrador', user: 'admin', role: 'Administrador', active: true },
    { name: 'Carlos Mora', user: 'carlos', role: 'Vendedor', active: true },
    { name: 'Luis García', user: 'luis', role: 'Bodeguero', active: true }
  ];

  editing: number | null = null;
  delIdx: number | null = null;
  newest: Usuario | null = null;

  // Estados del modal y formularios
  modalVisible = false;
  modalDelVisible = false;
  showPw = false;

  formName = '';
  formUser = '';
  formRole = '';
  formPw = '';
  formActive = true;

  // Errores de validación
  eN = '';
  eU = '';
  eP = '';
  eR = '';

  // Toast
  toastMsg = '';
  toastVisible = false;
  private toastTimer: any;

  get totalUsuarios(): number {
    return this.users.length;
  }

  get usuariosActivos(): number {
    return this.users.filter(u => u.active).length;
  }

  get usuariosInactivos(): number {
    return this.totalUsuarios - this.usuariosActivos;
  }

  get isSelfEditing(): boolean {
    return this.editing !== null && this.users[this.editing].user === this.SELF;
  }

  initials(name: string): string {
    const words = name.trim().split(/\s+/);
    return (words.length > 1 ? words[0][0] + words[1][0] : words[0][0]).toUpperCase();
  }

  toast(m: string) {
    this.toastMsg = m;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 2600);
  }

  openModal(index: number | null) {
    this.editing = index;
    this.eN = ''; this.eU = ''; this.eP = ''; this.eR = '';
    this.showPw = false;

    if (index === null) {
      this.formName = '';
      this.formUser = '';
      this.formRole = '';
      this.formPw = '';
      this.formActive = true;
    } else {
      const u = this.users[index];
      this.formName = u.name;
      this.formUser = u.user;
      this.formRole = u.role;
      this.formPw = '';
      this.formActive = u.active;
    }
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  toggleEstado(index: number) {
    const u = this.users[index];
    if (u.user === this.SELF) return;
    u.active = !u.active;
    this.newest = null;
    this.toast(`Usuario "${u.user}" ${u.active ? 'activado' : 'desactivado'}`);
  }

  confirmarEliminar(index: number) {
    if (this.users[index].user === this.SELF) return;
    this.delIdx = index;
    this.modalDelVisible = true;
  }

  eliminarUsuario() {
    if (this.delIdx !== null) {
      const u = this.users.splice(this.delIdx, 1)[0];
      this.newest = null;
      this.modalDelVisible = false;
      this.delIdx = null;
      this.toast(`Usuario "${u.user}" eliminado`);
    }
  }

  guardarUsuario() {
    const name = this.formName.trim().replace(/\s+/g, ' ');
    const user = this.formUser.trim().toLowerCase();
    const role = this.formRole;
    const pw = this.formPw;
    const active = this.formActive;

    this.eN = !name ? 'El nombre completo es obligatorio' : '';

    if (!user) {
      this.eU = 'El nombre de usuario es obligatorio';
    } else if (!/^[a-z0-9._-]{3,}$/.test(user)) {
      this.eU = 'Mínimo 3 caracteres, sin espacios ni tildes';
    } else if (this.users.some((u, i) => i !== this.editing && u.user === user)) {
      this.eU = 'Ese nombre de usuario ya existe';
    } else {
      this.eU = '';
    }

    if (this.editing === null && !pw) {
      this.eP = 'La contraseña es obligatoria';
    } else if (pw && pw.length < 8) {
      this.eP = 'La contraseña debe tener al menos 8 caracteres';
    } else {
      this.eP = '';
    }

    this.eR = !role ? 'Selecciona un rol' : '';

    if (this.eN || this.eU || this.eP || this.eR) return;

    if (this.editing === null) {
      this.newest = { name, user, role, active };
      this.users.push(this.newest);
      this.toast('Usuario creado correctamente');
    } else {
      const old = this.users[this.editing];
      Object.assign(old, { name, user, role, active });
      this.newest = old;
      this.toast('Usuario actualizado correctamente');
    }

    this.closeModal();
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.closeModal();
    this.modalDelVisible = false;
  }
}
