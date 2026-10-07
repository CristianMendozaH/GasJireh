import {
  Component,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';

import {
  AuthService,
} from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
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

  errorLogin = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) { }

  togglePassword(): void {
    this.mostrarPassword =
      !this.mostrarPassword;
  }

  toggleNota(
    event: Event,
  ): void {
    event.preventDefault();

    this.mostrarNota =
      !this.mostrarNota;
  }

  onSubmit(): void {
    if (this.busy) {
      return;
    }

    this.errorLogin = '';
    this.exito = false;

    this.errUsuario =
      !this.usuario.trim();

    this.errPassword =
      !this.password;

    if (
      this.errUsuario ||
      this.errPassword
    ) {
      return;
    }

    this.busy = true;

    this.authService
      .login(
        this.usuario.trim(),
        this.password,
      )
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(
            respuesta,
            this.recordarme,
          );

          this.busy = false;
          this.exito = true;

          setTimeout(() => {
            this.router.navigate([
              '/dashboard',
            ]);
          }, 700);
        },

        error: (error) => {
          console.error(
            'Error al iniciar sesión:',
            error,
          );

          this.busy = false;
          this.exito = false;

          if (error.status === 401) {
            this.errorLogin =
              'Usuario o contraseña incorrectos.';
          } else if (
            error.status === 0
          ) {
            this.errorLogin =
              'No se pudo conectar con el servidor.';
          } else {
            this.errorLogin =
              'Ocurrió un error al iniciar sesión.';
          }
        },
      });
  }
}
