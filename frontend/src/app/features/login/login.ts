import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  usuario = '';
  password = '';
  recordarme = false;

  mostrarPassword = false;
  mostrarNota = false;
  errUsuario = false;
  errPassword = false;
  busy = false;
  exito = false;

  constructor(private router: Router) { }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleNota(event: Event): void {
    event.preventDefault();
    this.mostrarNota = !this.mostrarNota;
  }

  onSubmit(): void {
    if (this.busy) return;

    this.errUsuario = !this.usuario.trim();
    this.errPassword = !this.password;

    if (this.errUsuario || this.errPassword) {
      return;
    }

    this.busy = true;

    // Simulación de respuesta/login exitoso
    setTimeout(() => {
      this.busy = false;
      this.exito = true;

      setTimeout(() => {
        // Redirige al Dashboard
        this.router.navigate(['/dashboard']);
      }, 1200);
    }, 1000);
  }
}
