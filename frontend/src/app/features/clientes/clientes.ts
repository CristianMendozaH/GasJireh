import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import { forkJoin } from 'rxjs';

import {
  FormsModule,
} from '@angular/forms';

import {
  ClienteApi,
  ClientesService,
  CrearClienteDto,
  ActualizarClienteDto,
  CuentaCobrarApi,
} from './clientes.service';

// =========================================================
// CLIENTE PARA LA INTERFAZ
// =========================================================

export interface Client {
  id: number;

  name: string;
  tel: string;

  direccion: string;
  nit: string;

  st:
  | 'Vencido'
  | 'Pendiente'
  | 'Al Día';

  debt: number;
  limit: number;
  auth: boolean;

  estado:
  | 'ACTIVO'
  | 'INACTIVO';
}

// =========================================================
// COMPONENTE
// =========================================================

@Component({
  selector: 'app-clientes',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {

  // =======================================================
  // CLIENTES
  // =======================================================

  clients: Client[] = [];

  cargandoClientes = false;

  errorClientes = '';

  readonly cls:
    Record<string, string> = {

      'Vencido': 'v',
      'Pendiente': 'pe',
      'Al Día': 'ok',
    };

  // =======================================================
  // BÚSQUEDA
  // =======================================================

  searchQuery = '';

  // =======================================================
  // EDICIÓN
  // =======================================================

  editingIndex:
    number | null = null;

  newestClient:
    Client | null = null;

  // =======================================================
  // MODAL
  // =======================================================

  modalVisible = false;

  formName = '';
  formTel = '';

  formLimit:
    number | string = '';

  formDebt = 0;

  formAuth = false;

  lastLimit = '';

  // =======================================================
  // CAMPOS ADICIONALES DEL BACKEND
  // =======================================================

  formDireccion = '';

  formNit = '';

  // =======================================================
  // ESTADO DE GUARDADO
  // =======================================================

  guardandoCliente = false;

  // =======================================================
  // ERRORES
  // =======================================================

  errName = '';
  errTel = '';
  errLimit = '';

  // =======================================================
  // TOAST
  // =======================================================

  toastVisible = false;

  toastMsg = '';

  private toastTimer:
    ReturnType<typeof setTimeout> | null = null;

  // =======================================================
  // CONSTRUCTOR
  // =======================================================

  constructor(
    private readonly clientesService:
      ClientesService,

    private readonly cdr:
      ChangeDetectorRef,
  ) { }

  // =======================================================
  // INICIO
  // =======================================================

  ngOnInit(): void {

    this.cargarClientes();
  }

  // =======================================================
  // CARGAR CLIENTES DESDE POSTGRESQL
  // =======================================================

  cargarClientes(): void {

    this.cargandoClientes = true;

    this.errorClientes = '';

    forkJoin({
      clientes: this.clientesService.obtenerClientes(),
      cuentas: this.clientesService.obtenerCuentasCobrar(),
    }).subscribe({

      next: ({ clientes, cuentas }) => {
        this.clients = clientes.map(cliente =>
          this.transformarCliente(cliente, cuentas),
        );
        this.cargandoClientes = false;
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error al cargar clientes:',
          error,
        );

        this.errorClientes =
          'No fue posible cargar los clientes';

        this.cargandoClientes =
          false;

        this.cdr.detectChanges();
      },
    });
  }

  // =======================================================
  // TRANSFORMAR CLIENTE DEL BACKEND
  // =======================================================

  private transformarCliente(
    cliente: ClienteApi,
    cuentas: CuentaCobrarApi[] = [],
  ): Client {

    const limite =
      Number(
        cliente.limiteCredito,
      );

    /*
     * Por ahora:
     *
     * limiteCredito > 0
     * se interpreta visualmente como
     * "crédito autorizado".
     *
     * Más adelante podemos agregar
     * creditoAutorizado explícitamente
     * al modelo de base de datos.
     */

    const autorizado =
      limite > 0;

    const cuentasCliente = cuentas.filter(cuenta =>
      cuenta.cliente?.id === cliente.id &&
      Number(cuenta.saldoPendiente) > 0,
    );
    const deuda = Math.round(cuentasCliente.reduce(
      (total, cuenta) => total + Number(cuenta.saldoPendiente), 0,
    ) * 100) / 100;
    const ahora = Date.now();
    const vencida = cuentasCliente.some(cuenta =>
      cuenta.estado === 'VENCIDA' ||
      (cuenta.fechaVencimiento !== null &&
        new Date(cuenta.fechaVencimiento).getTime() < ahora),
    );
    const estadoDeuda: Client['st'] = vencida
      ? 'Vencido'
      : deuda > 0 ? 'Pendiente' : 'Al Día';

    return {
      id:
        cliente.id,

      name:
        cliente.nombre,

      tel:
        this.fmtTel(
          cliente.telefono ?? '',
        ),

      direccion:
        cliente.direccion ?? '',

      nit:
        cliente.nit ?? '',

      st: estadoDeuda,
      debt: deuda,

      limit:
        limite,

      auth:
        autorizado,

      estado:
        cliente.estado,
    };
  }

  // =======================================================
  // CLIENTES FILTRADOS
  // =======================================================

  get filteredClients():
    Client[] {

    const q =
      this.norm(
        this.searchQuery.trim(),
      );

    return this.clients.filter(
      (cliente) => {

        if (!q) {
          return true;
        }

        const nombre =
          this.norm(
            cliente.name,
          );

        const telefono =
          this.norm(
            cliente.tel,
          );

        const direccion =
          this.norm(
            cliente.direccion,
          );

        const nit =
          this.norm(
            cliente.nit,
          );

        return (
          nombre.includes(q) ||
          telefono.includes(q) ||
          direccion.includes(q) ||
          nit.includes(q)
        );
      },
    );
  }

  // =======================================================
  // NORMALIZAR TEXTO
  // =======================================================

  norm(
    texto: string,
  ): string {

    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      );
  }

  // =======================================================
  // FORMATEAR DINERO
  // =======================================================

  money(
    cantidad: number,
  ): string {

    return (
      'Q' +
      cantidad.toLocaleString(
        'es-GT',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )
    );
  }

  // =======================================================
  // TOAST
  // =======================================================

  toast(
    mensaje: string,
  ): void {

    this.toastMsg =
      mensaje;

    this.toastVisible =
      true;

    if (
      this.toastTimer
    ) {

      clearTimeout(
        this.toastTimer,
      );
    }

    this.toastTimer =
      setTimeout(
        () => {

          this.toastVisible =
            false;

          this.cdr.detectChanges();
        },
        2600,
      );
  }

  // =======================================================
  // FORMATEAR TELÉFONO
  // =======================================================

  fmtTel(
    valor: string,
  ): string {

    const digitos =
      valor
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          8,
        );

    return digitos.length > 4
      ? digitos.slice(0, 4) +
      '-' +
      digitos.slice(4)
      : digitos;
  }

  // =======================================================
  // INPUT TELÉFONO
  // =======================================================

  onTelInput(
    value: string,
  ): void {

    this.formTel =
      this.fmtTel(
        value,
      );

    this.errTel = '';
  }

  // =======================================================
  // CAMBIO DE AUTORIZACIÓN
  // =======================================================

  onAuthChange(): void {

    if (!this.formAuth) {

      if (
        this.formLimit !== '' &&
        this.formLimit !== null
      ) {

        this.lastLimit =
          String(
            this.formLimit,
          );
      }

      this.formLimit =
        '0.00';

    } else {

      this.formLimit =
        this.lastLimit;
    }

    this.errLimit = '';
  }

  // =======================================================
  // LIMPIAR ERRORES
  // =======================================================

  clearErrors(): void {

    this.errName = '';

    this.errTel = '';

    this.errLimit = '';
  }

  // =======================================================
  // ABRIR MODAL
  // =======================================================

  openModal(
    index: number | null,
  ): void {

    this.editingIndex =
      index;

    this.clearErrors();

    this.guardandoCliente =
      false;

    if (
      index === null
    ) {

      // NUEVO CLIENTE

      this.formName = '';

      this.formTel = '';

      this.formDireccion = '';

      this.formNit = '';

      this.formLimit = '';

      this.formDebt = 0;

      this.formAuth = false;

      this.lastLimit = '';

    } else {

      // EDITAR CLIENTE

      const cliente =
        this.clients[index];

      if (!cliente) {
        return;
      }

      this.formName =
        cliente.name;

      this.formTel =
        cliente.tel;

      this.formDireccion =
        cliente.direccion;

      this.formNit =
        cliente.nit;

      this.formDebt =
        cliente.debt;

      this.formAuth =
        cliente.auth;

      this.formLimit =
        cliente.auth
          ? cliente.limit
          : '0.00';

      this.lastLimit =
        String(
          cliente.limit,
        );
    }

    this.modalVisible =
      true;
  }

  // =======================================================
  // CERRAR MODAL
  // =======================================================

  closeModal(): void {

    if (
      this.guardandoCliente
    ) {
      return;
    }

    this.modalVisible =
      false;
  }

  // =======================================================
  // CERRAR POR BACKDROP
  // =======================================================

  cerrarModalPorBackdrop(
    event: MouseEvent,
  ): void {

    if (
      this.guardandoCliente
    ) {
      return;
    }

    const target =
      event.target as HTMLElement;

    if (
      target.classList.contains(
        'ov',
      )
    ) {

      this.closeModal();
    }
  }

  // =======================================================
  // ESCAPE
  // =======================================================

  @HostListener(
    'document:keydown.escape',
  )
  handleEscape(): void {

    if (
      this.modalVisible &&
      !this.guardandoCliente
    ) {

      this.closeModal();
    }
  }

  // =======================================================
  // GUARDAR CLIENTE
  // =======================================================

  saveClient(): void {

    if (
      this.guardandoCliente
    ) {
      return;
    }

    const name =
      this.formName
        .trim()
        .replace(
          /\s+/g,
          ' ',
        );

    const tel =
      this.formTel.trim();

    const direccion =
      this.formDireccion.trim();

    const nit =
      this.formNit
        .trim()
        .toUpperCase();

    const auth =
      this.formAuth;

    const rawLimit =
      String(
        this.formLimit,
      ).trim();

    const lim =
      parseFloat(
        rawLimit,
      );

    this.clearErrors();

    // -----------------------------------------------------
    // VALIDAR NOMBRE
    // -----------------------------------------------------

    if (!name) {

      this.errName =
        'El nombre o negocio es obligatorio';

    } else if (
      this.clients.some(
        (
          cliente,
          index,
        ) =>
          index !==
          this.editingIndex &&
          this.norm(
            cliente.name,
          ) ===
          this.norm(
            name,
          ),
      )
    ) {

      this.errName =
        'Ya existe un cliente con ese nombre';
    }

    // -----------------------------------------------------
    // VALIDAR TELÉFONO
    // -----------------------------------------------------

    if (!tel) {

      this.errTel =
        'El teléfono es obligatorio';

    } else if (
      !/^\d{4}-\d{4}$/.test(
        tel,
      )
    ) {

      this.errTel =
        'Ingresa un teléfono de 8 dígitos';
    }

    // -----------------------------------------------------
    // VALIDAR LÍMITE
    // -----------------------------------------------------

    if (auth) {

      if (
        rawLimit === '' ||
        Number.isNaN(
          lim,
        )
      ) {

        this.errLimit =
          'Define el límite de crédito';

      } else if (
        lim < 0
      ) {

        this.errLimit =
          'El límite no puede ser negativo';
      }
    }

    // -----------------------------------------------------
    // DETENER SI HAY ERRORES
    // -----------------------------------------------------

    if (
      this.errName ||
      this.errTel ||
      this.errLimit
    ) {

      return;
    }

    // -----------------------------------------------------
    // LÍMITE FINAL
    // -----------------------------------------------------

    const limit =
      auth
        ? Math.round(
          lim * 100,
        ) / 100
        : 0;

    /*
     * Quitamos el guion antes de enviar.
     *
     * 5555-1234
     *      ↓
     * 55551234
     */

    const telefonoBackend =
      tel.replace(
        /\D/g,
        '',
      );

    // =====================================================
    // CREAR CLIENTE
    // =====================================================

    if (
      this.editingIndex ===
      null
    ) {

      const nuevoCliente:
        CrearClienteDto = {

        nombre:
          name,

        telefono:
          telefonoBackend,

        limiteCredito:
          limit,
      };

      /*
       * Estos campos se enviarán aunque el HTML
       * actual todavía no tenga inputs visibles
       * para ellos.
       */

      if (direccion) {

        nuevoCliente.direccion =
          direccion;
      }

      if (nit) {

        nuevoCliente.nit =
          nit;
      }

      this.guardandoCliente =
        true;

      this.cdr.detectChanges();

      this.clientesService
        .crearCliente(
          nuevoCliente,
        )
        .subscribe({

          next: (
            clienteCreado,
          ) => {

            const cliente =
              this.transformarCliente(
                clienteCreado,
              );

            this.clients.unshift(
              cliente,
            );

            this.newestClient =
              cliente;

            this.guardandoCliente =
              false;

            this.modalVisible =
              false;

            this.searchQuery =
              '';

            this.toast(
              'Cliente registrado correctamente',
            );

            /*
             * Recargamos desde PostgreSQL para que
             * el servidor siga siendo la fuente
             * definitiva de los datos.
             */

            this.cargarClientes();

            this.cdr.detectChanges();
          },

          error: (error) => {

            console.error(
              'Error al crear cliente:',
              error,
            );

            this.guardandoCliente =
              false;

            const mensaje =
              this.obtenerMensajeError(
                error,
                'No fue posible registrar el cliente',
              );

            this.toast(
              mensaje,
            );

            this.cdr.detectChanges();
          },
        });

      return;
    }

    // =====================================================
    // EDITAR CLIENTE
    // =====================================================

    const clienteActual =
      this.clients[
      this.editingIndex
      ];

    if (!clienteActual) {

      this.toast(
        'No se encontró el cliente',
      );

      return;
    }

    const datosActualizados:
      ActualizarClienteDto = {

      nombre:
        name,

      telefono:
        telefonoBackend,

      direccion:
        direccion,

      nit:
        nit,

      limiteCredito:
        limit,
    };

    this.guardandoCliente =
      true;

    this.cdr.detectChanges();

    this.clientesService
      .actualizarCliente(
        clienteActual.id,
        datosActualizados,
      )
      .subscribe({

        next: (
          clienteActualizado,
        ) => {

          const cliente =
            this.transformarCliente(
              clienteActualizado,
            );

          this.clients[
            this.editingIndex!
          ] = cliente;

          this.newestClient =
            null;

          this.guardandoCliente =
            false;

          this.modalVisible =
            false;

          this.searchQuery =
            '';

          this.toast(
            'Cliente actualizado correctamente',
          );

          this.cargarClientes();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Error al actualizar cliente:',
            error,
          );

          this.guardandoCliente =
            false;

          const mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible actualizar el cliente',
            );

          this.toast(
            mensaje,
          );

          this.cdr.detectChanges();
        },
      });
  }

  // =======================================================
  // MENSAJE DE ERROR DEL BACKEND
  // =======================================================

  private obtenerMensajeError(
    error: any,
    mensajeDefault: string,
  ): string {

    const mensaje =
      error?.error?.message;

    if (
      Array.isArray(
        mensaje,
      )
    ) {

      return mensaje.join(
        ', ',
      );
    }

    if (
      typeof mensaje ===
      'string' &&
      mensaje.trim()
    ) {

      return mensaje;
    }

    return mensajeDefault;
  }
}
