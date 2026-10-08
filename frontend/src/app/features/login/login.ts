import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout, TimeoutError, finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

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

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleNota(event: Event): void {
    event.preventDefault();
    this.mostrarNota = !this.mostrarNota;
  }

  onSubmit(): void {
    if (this.busy) return;

    this.errorLogin = '';
    this.exito = false;
    this.errUsuario = !this.usuario.trim();
    this.errPassword = !this.password;

    if (this.errUsuario || this.errPassword) return;

    this.busy = true;
    this.cdr.detectChanges();

    this.authService.login(this.usuario.trim(), this.password)
      .pipe(
        timeout(12000),
        finalize(() => {
          this.busy = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (respuesta) => {
          console.log('[Login] Respuesta correcta del servidor');
          try {
            this.authService.guardarSesion(respuesta, this.recordarme);
          } catch (error) {
            console.error('[Login] No se pudo guardar la sesión:', error);
            this.exito = false;
            this.errorLogin = 'No se pudo guardar la sesión. Revisa los permisos del navegador.';
            this.cdr.detectChanges();
            return;
          }

          this.exito = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            void this.router.navigate(['/dashboard']);
          }, 700);
        },
        error: (error: HttpErrorResponse | TimeoutError) => {
          console.log('[Login] Error recibido:', error instanceof HttpErrorResponse ? error.status : 'timeout', error);
          this.exito = false;

          if (error instanceof TimeoutError) {
            this.errorLogin = 'La conexión está tardando demasiado. Inténtalo de nuevo.';
          } else {
            switch (error.status) {
              case 400:
                this.errorLogin = 'Revisa los datos ingresados.';
                break;
              case 401:
                this.errPassword = false;
                this.errorLogin = 'Usuario o contraseña incorrectos.';
                break;
              case 403:
                this.errorLogin = 'No tienes acceso con esta cuenta. Consulta al administrador.';
                break;
              case 429:
                this.errorLogin = 'Demasiados intentos. Espera un momento antes de volver a intentar.';
                break;
              case 0:
                this.errorLogin = 'No se pudo conectar con el servidor.';
                break;
              default:
                this.errorLogin = 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
            }
          }
          this.busy = false;
          this.cdr.detectChanges();
        },
      });
  }
}
