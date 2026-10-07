import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  InventarioApi,
  InventarioService,
  MovimientoInventarioApi,
  RegistrarMovimientoDto,
} from './inventario.service';

import {
  forkJoin,
} from 'rxjs';

// =========================================================
// INTERFACES
// =========================================================

export interface StockItem {
  f: number;
  v: number;
}

export interface Movimiento {
  d: string;
  t: string;
  tipoOriginal: string;
  s: string;
  q: number;
  u: string;
  n: string;
}

// =========================================================
// COMPONENTE
// =========================================================

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {

  readonly TODAY = new Date()
    .toISOString()
    .slice(0, 10);

  // =========================================================
  // STOCK
  // =========================================================

  stock: Record<string, StockItem> = {
    '25': {
      f: 0,
      v: 0,
    },

    '35': {
      f: 0,
      v: 0,
    },

    '100': {
      f: 0,
      v: 0,
    },
  };

  stockKeys: string[] = [
    '25',
    '35',
    '100',
  ];

  cargandoInventario = false;

  errorInventario = '';

  // =========================================================
  // RELACIÓN PRESENTACIÓN → PRODUCTO
  // =========================================================

  /*
   * Esta relación se construye automáticamente
   * utilizando los productos recibidos desde el backend.
   *
   * Ejemplo:
   *
   * 25  -> productoId 1
   * 35  -> productoId 2
   * 100 -> productoId 3
   */

  productoPorPeso:
    Record<string, number> = {};

  // =========================================================
  // MOVIMIENTOS
  // =========================================================

  mov: Movimiento[] = [];

  cargandoMovimientos = false;

  errorMovimientos = '';

  // =========================================================
  // FILTROS
  // =========================================================

  fTipo = '';
  fTam = '';
  fFecha = '';

  // =========================================================
  // ANIMACIONES
  // =========================================================

  updatedKey: string | null = null;

  newestMov: Movimiento | null = null;

  // =========================================================
  // MODAL ENTRADA
  // =========================================================

  modalVisible = false;

  mTam = '25';

  mQty: number | null = null;

  mProv = 'Tropigas';

  mSwap = true;

  isQtyBad = false;

  guardandoEntrada = false;

  // =========================================================
  // TOAST
  // =========================================================

  toastVisible = false;

  toastMsg = '';

  private toastTimer:
    ReturnType<typeof setTimeout> | null = null;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private readonly inventarioService:
      InventarioService,

    private readonly cdr:
      ChangeDetectorRef,
  ) { }

  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    this.cargarInventario();

    this.cargarMovimientos();
  }

  // =========================================================
  // CARGAR INVENTARIO
  // =========================================================

  cargarInventario(): void {

    this.cargandoInventario =
      true;

    this.errorInventario =
      '';

    this.inventarioService
      .obtenerInventario()
      .subscribe({

        next: (
          inventario:
            InventarioApi[],
        ) => {

          this.procesarInventario(
            inventario,
          );

          this.cargandoInventario =
            false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Error al cargar inventario:',
            error,
          );

          this.errorInventario =
            'No fue posible cargar el inventario';

          this.cargandoInventario =
            false;

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // PROCESAR INVENTARIO
  // =========================================================

  private procesarInventario(
    inventario: InventarioApi[],
  ): void {

    const nuevoStock:
      Record<string, StockItem> = {

      '25': {
        f: 0,
        v: 0,
      },

      '35': {
        f: 0,
        v: 0,
      },

      '100': {
        f: 0,
        v: 0,
      },
    };

    const nuevosProductos:
      Record<string, number> = {};

    for (
      const item of inventario
    ) {

      if (!item.producto) {
        continue;
      }

      const peso =
        String(
          item.producto.pesoLb,
        );

      const cantidad =
        Number(
          item.cantidad,
        );

      /*
       * Guardamos automáticamente qué producto
       * corresponde a cada presentación.
       */

      nuevosProductos[peso] =
        item.producto.id;

      if (!nuevoStock[peso]) {
        continue;
      }

      if (
        item.estado ===
        'LLENO'
      ) {

        nuevoStock[peso].f =
          cantidad;
      }

      if (
        item.estado ===
        'VACIO'
      ) {

        nuevoStock[peso].v =
          cantidad;
      }
    }

    this.stock =
      nuevoStock;

    this.productoPorPeso =
      nuevosProductos;

    this.cdr.detectChanges();
  }

  // =========================================================
  // CARGAR MOVIMIENTOS
  // =========================================================

  cargarMovimientos(): void {

    this.cargandoMovimientos =
      true;

    this.errorMovimientos =
      '';

    this.inventarioService
      .obtenerMovimientos()
      .subscribe({

        next: (
          movimientos:
            MovimientoInventarioApi[],
        ) => {

          this.mov =
            movimientos.map(
              (movimiento) =>
                this.transformarMovimiento(
                  movimiento,
                ),
            );

          this.cargandoMovimientos =
            false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Error al cargar movimientos:',
            error,
          );

          this.errorMovimientos =
            'No fue posible cargar los movimientos';

          this.cargandoMovimientos =
            false;

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // TRANSFORMAR MOVIMIENTO
  // =========================================================

  private transformarMovimiento(
    movimiento:
      MovimientoInventarioApi,
  ): Movimiento {

    return {
      d: this.formatearFecha(
        movimiento.creadoEn,
      ),

      t: this.obtenerTipoVisual(
        movimiento.tipo,
      ),

      tipoOriginal:
        movimiento.tipo,

      s: movimiento.producto
        ? `${movimiento.producto.pesoLb} lb`
        : 'Sin producto',

      q: Number(
        movimiento.cantidad,
      ),

      u:
        movimiento.usuario
          ?.nombreCompleto ??
        'Sin usuario',

      n:
        movimiento.motivo ??
        movimiento.referencia ??
        'Sin nota',
    };
  }

  // =========================================================
  // TIPO VISUAL
  // =========================================================

  private obtenerTipoVisual(
    tipo: string,
  ): string {

    switch (tipo) {

      case 'ENTRADA':
        return 'Entrada';

      case 'SALIDA':
        return 'Salida';

      case 'VENTA':
        return 'Salida';

      case 'DEVOLUCION':
        return 'Entrada';

      case 'AJUSTE':
        return 'Ajuste';

      default:
        return tipo;
    }
  }

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  private formatearFecha(
    fecha: string,
  ): string {

    const date =
      new Date(fecha);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return fecha;
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1,
      ).padStart(
        2,
        '0',
      );

    const day =
      String(
        date.getDate(),
      ).padStart(
        2,
        '0',
      );

    const hour =
      String(
        date.getHours(),
      ).padStart(
        2,
        '0',
      );

    const minute =
      String(
        date.getMinutes(),
      ).padStart(
        2,
        '0',
      );

    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  // =========================================================
  // FILTROS
  // =========================================================

  get hasFilters(): boolean {

    return !!(
      this.fTipo ||
      this.fTam ||
      this.fFecha
    );
  }

  get filteredMovimientos():
    Movimiento[] {

    return this.mov.filter(
      (movimiento) => {

        const coincideTipo =
          !this.fTipo ||
          movimiento.t ===
          this.fTipo ||
          movimiento.tipoOriginal ===
          this.fTipo;

        const coincideTam =
          !this.fTam ||
          movimiento.s ===
          this.fTam;

        const coincideFecha =
          !this.fFecha ||
          movimiento.d.startsWith(
            this.fFecha,
          );

        return (
          coincideTipo &&
          coincideTam &&
          coincideFecha
        );
      },
    );
  }

  limpiarFiltros(): void {

    this.fTipo = '';

    this.fTam = '';

    this.fFecha = '';
  }

  // =========================================================
  // TOAST
  // =========================================================

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

  // =========================================================
  // MODAL
  // =========================================================

  abrirModalEntrada(): void {

    this.mQty =
      null;

    this.isQtyBad =
      false;

    this.mSwap =
      true;

    this.guardandoEntrada =
      false;

    this.modalVisible =
      true;
  }

  cerrarModal(): void {

    if (
      this.guardandoEntrada
    ) {
      return;
    }

    this.modalVisible =
      false;
  }

  cerrarModalPorBackdrop(
    event: MouseEvent,
  ): void {

    if (
      this.guardandoEntrada
    ) {
      return;
    }

    const elemento =
      event.target as HTMLElement;

    if (
      elemento.classList.contains(
        'ov',
      )
    ) {

      this.cerrarModal();
    }
  }

  @HostListener(
    'document:keydown.escape',
  )
  handleEscape(): void {

    if (
      this.modalVisible &&
      !this.guardandoEntrada
    ) {

      this.cerrarModal();
    }
  }

  // =========================================================
  // GUARDAR ENTRADA DE PROVEEDOR
  // =========================================================

  guardarEntrada(): void {

    if (
      this.guardandoEntrada
    ) {
      return;
    }

    const cantidad =
      Number(
        this.mQty,
      );

    // -------------------------------------------------------
    // VALIDAR CANTIDAD
    // -------------------------------------------------------

    if (
      Number.isNaN(
        cantidad,
      ) ||
      cantidad <= 0 ||
      !Number.isInteger(
        cantidad,
      )
    ) {

      this.isQtyBad =
        true;

      return;
    }

    this.isQtyBad =
      false;

    // -------------------------------------------------------
    // BUSCAR PRODUCTO
    // -------------------------------------------------------

    const productoId =
      this.productoPorPeso[
      this.mTam
      ];

    if (!productoId) {

      this.toast(
        'No se encontró el producto seleccionado',
      );

      return;
    }

    // -------------------------------------------------------
    // VALIDAR INTERCAMBIO
    // -------------------------------------------------------

    if (this.mSwap) {

      const vaciosDisponibles =
        this.stock[
          this.mTam
        ]?.v ?? 0;

      if (
        vaciosDisponibles <
        cantidad
      ) {

        this.toast(
          `No hay suficientes cilindros vacíos. Disponibles: ${vaciosDisponibles}`,
        );

        return;
      }
    }

    // -------------------------------------------------------
    // DATOS COMUNES
    // -------------------------------------------------------

    const proveedor =
      this.mProv.trim() ||
      'Proveedor';

    const referencia =
      `PROVEEDOR-${Date.now()}`;

    // -------------------------------------------------------
    // ENTRADA DE CILINDROS LLENOS
    // -------------------------------------------------------

    const entradaLlenos:
      RegistrarMovimientoDto = {

      productoId,

      tipo:
        'ENTRADA',

      estado:
        'LLENO',

      cantidad,

      motivo:
        `Entrada de proveedor ${proveedor}`,

      referencia,
    };

    this.guardandoEntrada =
      true;

    this.cdr.detectChanges();

    // -------------------------------------------------------
    // SIN INTERCAMBIO
    // -------------------------------------------------------

    if (!this.mSwap) {

      this.inventarioService
        .registrarMovimiento(
          entradaLlenos,
        )
        .subscribe({

          next: () => {

            this.finalizarEntrada(
              cantidad,
              proveedor,
              false,
            );
          },

          error: (error) => {

            this.manejarErrorEntrada(
              error,
            );
          },
        });

      return;
    }

    // -------------------------------------------------------
    // CON INTERCAMBIO
    // -------------------------------------------------------

    const salidaVacios:
      RegistrarMovimientoDto = {

      productoId,

      tipo:
        'SALIDA',

      estado:
        'VACIO',

      cantidad,

      motivo:
        `Cilindros vacíos entregados a ${proveedor}`,

      referencia,
    };

    /*
     * En un intercambio se registran:
     *
     * 1. Entrada de cilindros llenos.
     * 2. Salida de cilindros vacíos.
     */

    forkJoin([
      this.inventarioService
        .registrarMovimiento(
          entradaLlenos,
        ),

      this.inventarioService
        .registrarMovimiento(
          salidaVacios,
        ),
    ])
      .subscribe({

        next: () => {

          this.finalizarEntrada(
            cantidad,
            proveedor,
            true,
          );
        },

        error: (error) => {

          this.manejarErrorEntrada(
            error,
          );
        },
      });
  }

  // =========================================================
  // FINALIZAR ENTRADA
  // =========================================================

  private finalizarEntrada(
    cantidad: number,
    proveedor: string,
    intercambio: boolean,
  ): void {

    this.guardandoEntrada =
      false;

    this.modalVisible =
      false;

    this.mQty =
      null;

    /*
     * Volvemos a consultar el backend.
     * No calculamos el nuevo stock en Angular.
     *
     * PostgreSQL sigue siendo nuestra fuente de verdad.
     */

    this.cargarInventario();

    this.cargarMovimientos();

    if (intercambio) {

      this.toast(
        `Entrada registrada: ${cantidad} llenos recibidos y ${cantidad} vacíos entregados a ${proveedor}`,
      );

    } else {

      this.toast(
        `Entrada registrada: ${cantidad} cilindros llenos de ${this.mTam} lb`,
      );
    }

    this.cdr.detectChanges();
  }

  // =========================================================
  // MANEJAR ERROR DE ENTRADA
  // =========================================================

  private manejarErrorEntrada(
    error: any,
  ): void {

    console.error(
      'Error al registrar entrada:',
      error,
    );

    this.guardandoEntrada =
      false;

    const mensaje =
      error?.error?.message ??
      'No fue posible registrar la entrada';

    this.toast(
      mensaje,
    );

    /*
     * Recargamos porque si una operación de un intercambio
     * llegó a completarse y otra falló, necesitamos mostrar
     * el estado real que tiene el servidor.
     */

    this.cargarInventario();

    this.cargarMovimientos();

    this.cdr.detectChanges();
  }
}
