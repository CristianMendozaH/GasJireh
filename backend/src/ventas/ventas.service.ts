import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { CreateVentaDto } from './dto/create-venta.dto.js';

@Injectable()
export class VentasService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  // =========================================================
  // LISTAR TODAS LAS VENTAS
  // =========================================================

  async findAll() {
    const ventas =
      await this.databaseService.db.orm.public.Venta.all();

    const clientes =
      await this.databaseService.db.orm.public.Cliente.all();

    const usuarios =
      await this.databaseService.db.orm.public.Usuario.all();

    const detalles =
      await this.databaseService.db.orm.public.DetalleVenta.all();

    const productos =
      await this.databaseService.db.orm.public.Producto.all();

    const cuentas =
      await this.databaseService.db.orm.public.CuentaCobrar.all();

    return ventas.map((venta) => {
      const cliente = venta.clienteId
        ? clientes.find(
          (item) => item.id === venta.clienteId,
        )
        : null;

      const vendedor = usuarios.find(
        (item) => item.id === venta.usuarioId,
      );

      const detallesVenta = detalles
        .filter(
          (detalle) => detalle.ventaId === venta.id,
        )
        .map((detalle) => {
          const producto = productos.find(
            (item) =>
              item.id === detalle.productoId,
          );

          return {
            id: detalle.id,

            producto: producto
              ? {
                id: producto.id,
                nombre: producto.nombre,
                pesoLb: producto.pesoLb,
              }
              : null,

            cantidad: detalle.cantidad,
            precioUnitario:
              detalle.precioUnitario,
            subtotal: detalle.subtotal,
            vaciosRecibidos:
              detalle.vaciosRecibidos,
          };
        });

      const cuenta = cuentas.find(
        (item) => item.ventaId === venta.id,
      );

      return {
        id: venta.id,

        cliente: cliente
          ? {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
          }
          : null,

        vendedor: vendedor
          ? {
            id: vendedor.id,
            nombre:
              vendedor.nombreCompleto,
          }
          : null,

        tipo: venta.tipo,
        total: venta.total,
        estado: venta.estado,

        detalles: detallesVenta,

        cuentaCobrar: cuenta
          ? {
            id: cuenta.id,
            montoOriginal:
              cuenta.montoOriginal,
            saldoPendiente:
              cuenta.saldoPendiente,
            estado: cuenta.estado,
            fechaVencimiento:
              cuenta.fechaVencimiento,
          }
          : null,

        creadoEn: venta.creadoEn,
        actualizadoEn:
          venta.actualizadoEn,
      };
    });
  }

  // =========================================================
  // OBTENER UNA VENTA POR ID
  // =========================================================

  async findOne(id: number) {
    const ventas =
      await this.databaseService.db.orm.public.Venta.all();

    const venta = ventas.find(
      (item) => item.id === id,
    );

    if (!venta) {
      throw new NotFoundException(
        `Venta ${id} no encontrada`,
      );
    }

    const clientes =
      await this.databaseService.db.orm.public.Cliente.all();

    const usuarios =
      await this.databaseService.db.orm.public.Usuario.all();

    const detalles =
      await this.databaseService.db.orm.public.DetalleVenta.all();

    const productos =
      await this.databaseService.db.orm.public.Producto.all();

    const cuentas =
      await this.databaseService.db.orm.public.CuentaCobrar.all();

    const abonos =
      await this.databaseService.db.orm.public.Abono.all();

    const cliente = venta.clienteId
      ? clientes.find(
        (item) => item.id === venta.clienteId,
      )
      : null;

    const vendedor = usuarios.find(
      (item) => item.id === venta.usuarioId,
    );

    const detallesVenta = detalles
      .filter(
        (detalle) => detalle.ventaId === venta.id,
      )
      .map((detalle) => {
        const producto = productos.find(
          (item) =>
            item.id === detalle.productoId,
        );

        return {
          id: detalle.id,

          producto: producto
            ? {
              id: producto.id,
              nombre: producto.nombre,
              pesoLb: producto.pesoLb,
            }
            : null,

          cantidad: detalle.cantidad,
          precioUnitario:
            detalle.precioUnitario,
          subtotal: detalle.subtotal,
          vaciosRecibidos:
            detalle.vaciosRecibidos,
        };
      });

    const cuenta = cuentas.find(
      (item) => item.ventaId === venta.id,
    );

    let cuentaCobrar = null;

    if (cuenta) {
      const abonosCuenta = abonos
        .filter(
          (abono) =>
            abono.cuentaCobrarId ===
            cuenta.id,
        )
        .map((abono) => ({
          id: abono.id,
          monto: abono.monto,
          observacion: abono.observacion,
          usuarioId: abono.usuarioId,
          creadoEn: abono.creadoEn,
        }));

      const totalAbonado =
        abonosCuenta.reduce(
          (total, abono) =>
            total + Number(abono.monto),
          0,
        );

      cuentaCobrar = {
        id: cuenta.id,
        montoOriginal:
          cuenta.montoOriginal,
        totalAbonado:
          totalAbonado.toFixed(2),
        saldoPendiente:
          cuenta.saldoPendiente,
        estado: cuenta.estado,
        fechaVencimiento:
          cuenta.fechaVencimiento,
        abonos: abonosCuenta,
      };
    }

    return {
      id: venta.id,

      cliente: cliente
        ? {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          nit: cliente.nit,
        }
        : null,

      vendedor: vendedor
        ? {
          id: vendedor.id,
          nombre:
            vendedor.nombreCompleto,
        }
        : null,

      tipo: venta.tipo,
      total: venta.total,
      estado: venta.estado,

      detalles: detallesVenta,

      cuentaCobrar,

      creadoEn: venta.creadoEn,
      actualizadoEn:
        venta.actualizadoEn,
    };
  }

  // =========================================================
  // CREAR VENTA
  // =========================================================

  async create(
    createVentaDto: CreateVentaDto,
    usuarioId: number,
  ) {
    return this.databaseService.db.transaction(async (tx) => {
      const {
        clienteId,
        tipo,
        detalles,
        fechaVencimiento,
      } = createVentaDto;

      // =========================================================
      // 1. VALIDACIONES GENERALES
      // =========================================================

      if (!detalles || detalles.length === 0) {
        throw new BadRequestException(
          'La venta debe contener al menos un producto',
        );
      }

      if (tipo === 'CREDITO' && !clienteId) {
        throw new BadRequestException(
          'Una venta al crédito requiere un cliente',
        );
      }

      // =========================================================
      // 2. OBTENER PRODUCTOS
      // =========================================================

      const productos =
        await tx.orm.public.Producto.all();

      let total = 0;

      const detallesPreparados = detalles.map(
        (detalle) => {
          const producto = productos.find(
            (item) =>
              item.id === detalle.productoId,
          );

          if (!producto) {
            throw new NotFoundException(
              `Producto ${detalle.productoId} no encontrado`,
            );
          }

          if (
            !Number.isInteger(detalle.cantidad) ||
            detalle.cantidad <= 0
          ) {
            throw new BadRequestException(
              'La cantidad vendida debe ser un número entero mayor que 0',
            );
          }

          const vaciosRecibidos =
            detalle.vaciosRecibidos ?? 0;

          if (
            !Number.isInteger(vaciosRecibidos) ||
            vaciosRecibidos < 0
          ) {
            throw new BadRequestException(
              'La cantidad de cilindros vacíos debe ser un número entero igual o mayor que 0',
            );
          }

          // =========================================================
          // OBTENER PRECIO REAL DEL PRODUCTO DESDE POSTGRESQL
          // =========================================================

          const precioUnitario =
            Number(producto.precio);

          if (
            !Number.isFinite(precioUnitario) ||
            precioUnitario < 0
          ) {
            throw new BadRequestException(
              `El producto ${producto.nombre} tiene un precio inválido`,
            );
          }

          // =========================================================
          // CALCULAR SUBTOTAL
          // =========================================================

          const subtotal =
            detalle.cantidad *
            precioUnitario;

          total += subtotal;

          // =========================================================
          // PREPARAR DETALLE DE LA VENTA
          // =========================================================

          return {
            producto,
            productoId:
              detalle.productoId,
            cantidad:
              detalle.cantidad,
            precioUnitario,
            subtotal,
            vaciosRecibidos,
          };
        },
      );

      // =========================================================
      // VALIDAR LÍMITE DE CRÉDITO ANTES DE CREAR LA VENTA
      // =========================================================

      if (tipo === 'CREDITO') {
        const clientes =
          await tx.orm.public.Cliente.all();

        const cliente = clientes.find(
          (item) => item.id === clienteId,
        );

        if (!cliente) {
          throw new NotFoundException(
            `Cliente ${clienteId} no encontrado`,
          );
        }

        if (cliente.estado !== 'ACTIVO') {
          throw new BadRequestException(
            'El cliente está inactivo y no puede comprar al crédito',
          );
        }

        const limiteCredito = Number(cliente.limiteCredito);

        if (!Number.isFinite(limiteCredito) || limiteCredito <= 0) {
          throw new BadRequestException(
            'El cliente no tiene crédito autorizado',
          );
        }

        const cuentas =
          await tx.orm.public.CuentaCobrar.all();

        const ventas =
          await tx.orm.public.Venta.all();

        const ventasVigentes = new Set(
          ventas
            .filter(
              (venta) =>
                venta.clienteId === clienteId &&
                venta.estado !== 'ANULADA',
            )
            .map((venta) => venta.id),
        );

        const deudaActual = cuentas
          .filter((cuenta) => ventasVigentes.has(cuenta.ventaId))
          .reduce(
            (acumulado, cuenta) =>
              acumulado + Number(cuenta.saldoPendiente),
            0,
          );

        if (!Number.isFinite(deudaActual)) {
          throw new BadRequestException(
            'No se pudo calcular la deuda actual del cliente',
          );
        }

        // Comparamos centavos para evitar diferencias por decimales.
        const limiteCentavos = Math.round(limiteCredito * 100);
        const deudaCentavos = Math.round(deudaActual * 100);
        const ventaCentavos = Math.round(total * 100);
        const disponibleCentavos = limiteCentavos - deudaCentavos;

        if (ventaCentavos > disponibleCentavos) {
          const disponible = Math.max(0, disponibleCentavos) / 100;
          throw new BadRequestException(
            `Crédito insuficiente para ${cliente.nombre}. ` +
            `Disponible: Q${disponible.toFixed(2)}. ` +
            `Total de la venta: Q${total.toFixed(2)}.`,
          );
        }
      }

      // =========================================================
      // 3. OBTENER INVENTARIO
      // =========================================================

      const inventarios =
        await tx.orm.public.Inventario.all();

      // =========================================================
      // 4. VERIFICAR EXISTENCIAS
      // =========================================================

      const cantidadesPorProducto = new Map<number, number>();

      for (const detalle of detallesPreparados) {
        const acumulado =
          cantidadesPorProducto.get(detalle.productoId) ?? 0;

        cantidadesPorProducto.set(
          detalle.productoId,
          acumulado + detalle.cantidad,
        );
      }

      for (const [productoId, cantidadTotal] of cantidadesPorProducto) {
        const producto = productos.find(
          (item) => item.id === productoId,
        );

        const stockLleno = inventarios.find(
          (item) =>
            item.productoId === productoId &&
            item.estado === 'LLENO',
        );

        const stockVacio = inventarios.find(
          (item) =>
            item.productoId === productoId &&
            item.estado === 'VACIO',
        );

        if (!stockLleno || !stockVacio) {
          throw new BadRequestException(
            `Inventario incompleto para ${producto?.nombre ?? productoId}`,
          );
        }

        if (stockLleno.cantidad < cantidadTotal) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto?.nombre ?? productoId}. ` +
            `Disponible: ${stockLleno.cantidad}. ` +
            `Solicitado: ${cantidadTotal}.`,
          );
        }
      }


      // =========================================================
      // 5. CREAR VENTA
      // =========================================================

      const venta =
        await tx.orm.public.Venta.create(
          {
            usuarioId,
            clienteId: clienteId ?? null,
            tipo,
            total: total.toFixed(2),
          },
        );

      // =========================================================
      // 6. CREAR DETALLES
      // =========================================================

      const detallesCreados = [];

      for (const detalle of detallesPreparados) {
        const detalleCreado =
          await tx.orm.public.DetalleVenta.create(
            {
              ventaId: venta.id,
              productoId:
                detalle.productoId,
              cantidad: detalle.cantidad,
              precioUnitario:
                detalle.precioUnitario.toFixed(
                  2,
                ),
              subtotal:
                detalle.subtotal.toFixed(2),
              vaciosRecibidos:
                detalle.vaciosRecibidos,
            },
          );

        detallesCreados.push(
          detalleCreado,
        );
      }

      // =========================================================
      // 7. ACTUALIZAR INVENTARIO
      // =========================================================

      const movimientosInventario = [];

      for (const detalle of detallesPreparados) {
        const stockLleno = inventarios.find(
          (item) =>
            item.productoId ===
            detalle.productoId &&
            item.estado === 'LLENO',
        );

        const stockVacio = inventarios.find(
          (item) =>
            item.productoId ===
            detalle.productoId &&
            item.estado === 'VACIO',
        );

        if (!stockLleno || !stockVacio) {
          throw new BadRequestException(
            `Inventario incompleto para ${detalle.producto.nombre}`,
          );
        }

        // ---------------------------------------------------------
        // RESTAR CILINDROS LLENOS
        // ---------------------------------------------------------

        const nuevaCantidadLlenos =
          stockLleno.cantidad -
          detalle.cantidad;

        const actualizacionLlenos = await tx.orm.public.Inventario
          .where({
            id: stockLleno.id,
            cantidad: stockLleno.cantidad,
          })
          .update({
            cantidad: nuevaCantidadLlenos,
          });

        if (!actualizacionLlenos) {
          throw new BadRequestException(
            'El inventario cambió durante la venta. Intenta nuevamente.',
          );
        }
        stockLleno.cantidad = nuevaCantidadLlenos;

        // ---------------------------------------------------------
        // REGISTRAR MOVIMIENTO DE VENTA
        // ---------------------------------------------------------

        const movimientoSalida =
          await tx.orm.public.MovimientoInventario.create(
            {
              productoId:
                detalle.productoId,
              usuarioId,
              tipo: 'VENTA',
              estado: 'LLENO',
              cantidad:
                detalle.cantidad,
              motivo: `Venta #${venta.id}`,
              referencia: `VENTA-${venta.id}`,
            },
          );

        movimientosInventario.push(
          movimientoSalida,
        );

        // ---------------------------------------------------------
        // SUMAR CILINDROS VACÍOS RECIBIDOS
        // ---------------------------------------------------------

        if (detalle.vaciosRecibidos > 0) {
          const nuevaCantidadVacios =
            stockVacio.cantidad +
            detalle.vaciosRecibidos;

          const actualizacionVacios = await tx.orm.public.Inventario
            .where({
              id: stockVacio.id,
              cantidad: stockVacio.cantidad,
            })
            .update({ cantidad: nuevaCantidadVacios });

          if (!actualizacionVacios) {
            throw new BadRequestException(
              'El inventario cambió durante la venta. Intenta nuevamente.',
            );
          }
          stockVacio.cantidad = nuevaCantidadVacios;

          // -------------------------------------------------------
          // REGISTRAR DEVOLUCIÓN
          // -------------------------------------------------------

          const movimientoDevolucion =
            await tx.orm.public.MovimientoInventario.create(
              {
                productoId:
                  detalle.productoId,
                usuarioId,
                tipo: 'DEVOLUCION',
                estado: 'VACIO',
                cantidad:
                  detalle.vaciosRecibidos,
                motivo:
                  `Cilindros vacíos recibidos en venta #${venta.id}`,
                referencia:
                  `VENTA-${venta.id}`,
              },
            );

          movimientosInventario.push(
            movimientoDevolucion,
          );
        }
      }

      // =========================================================
      // 8. CREAR CUENTA POR COBRAR SI ES CRÉDITO
      // =========================================================

      let cuentaCobrar = null;

      if (tipo === 'CREDITO') {
        cuentaCobrar =
          await tx.orm.public.CuentaCobrar.create(
            {
              ventaId: venta.id,
              montoOriginal:
                total.toFixed(2),
              saldoPendiente:
                total.toFixed(2),
              estado: 'PENDIENTE',
              fechaVencimiento:
                fechaVencimiento ?? null,
            },
          );
      }

      // =========================================================
      // 9. RESPUESTA
      // =========================================================

      return {
        mensaje:
          'Venta registrada correctamente',
        venta,
        detalles: detallesCreados,
        movimientosInventario,
        cuentaCobrar,
      };
    });
  }
  // =========================================================
  // ANULAR VENTA
  // =========================================================

  async anular(
    id: number,
    usuarioId: number,
  ) {
    // =========================================================
    // 1. BUSCAR VENTA
    // =========================================================

    const ventas =
      await this.databaseService.db.orm.public.Venta.all();

    const venta = ventas.find(
      (item) => item.id === id,
    );

    if (!venta) {
      throw new NotFoundException(
        `Venta ${id} no encontrada`,
      );
    }

    if (venta.estado === 'ANULADA') {
      throw new BadRequestException(
        'Esta venta ya se encuentra anulada',
      );
    }

    // =========================================================
    // 2. VERIFICAR CUENTA POR COBRAR
    // =========================================================

    const cuentas =
      await this.databaseService.db.orm.public.CuentaCobrar.all();

    const cuentaCobrar = cuentas.find(
      (item) => item.ventaId === venta.id,
    );

    if (cuentaCobrar) {
      const abonos =
        await this.databaseService.db.orm.public.Abono.all();

      const abonosCuenta = abonos.filter(
        (item) =>
          item.cuentaCobrarId ===
          cuentaCobrar.id,
      );

      if (abonosCuenta.length > 0) {
        throw new BadRequestException(
          'No se puede anular una venta a crédito que ya tiene abonos registrados',
        );
      }
    }

    // =========================================================
    // 3. OBTENER DETALLES DE LA VENTA
    // =========================================================

    const todosDetalles =
      await this.databaseService.db.orm.public.DetalleVenta.all();

    const detallesVenta =
      todosDetalles.filter(
        (item) => item.ventaId === venta.id,
      );

    if (detallesVenta.length === 0) {
      throw new BadRequestException(
        'La venta no tiene detalles registrados',
      );
    }

    // =========================================================
    // 4. OBTENER INVENTARIO
    // =========================================================

    const inventarios =
      await this.databaseService.db.orm.public.Inventario.all();

    // =========================================================
    // 5. VALIDAR INVENTARIO ANTES DE ANULAR
    // =========================================================

    for (const detalle of detallesVenta) {
      const stockLleno = inventarios.find(
        (item) =>
          item.productoId ===
          detalle.productoId &&
          item.estado === 'LLENO',
      );

      const stockVacio = inventarios.find(
        (item) =>
          item.productoId ===
          detalle.productoId &&
          item.estado === 'VACIO',
      );

      if (!stockLleno || !stockVacio) {
        throw new BadRequestException(
          `Inventario incompleto para el producto ${detalle.productoId}`,
        );
      }

      if (
        stockVacio.cantidad <
        detalle.vaciosRecibidos
      ) {
        throw new BadRequestException(
          `No hay suficientes cilindros vacíos para revertir la venta ${venta.id}`,
        );
      }
    }

    // =========================================================
    // 6. REVERTIR INVENTARIO
    // =========================================================

    const movimientosInventario = [];

    for (const detalle of detallesVenta) {
      const stockLleno = inventarios.find(
        (item) =>
          item.productoId ===
          detalle.productoId &&
          item.estado === 'LLENO',
      );

      const stockVacio = inventarios.find(
        (item) =>
          item.productoId ===
          detalle.productoId &&
          item.estado === 'VACIO',
      );

      if (!stockLleno || !stockVacio) {
        throw new BadRequestException(
          'No fue posible localizar el inventario del producto',
        );
      }

      // ---------------------------------------------------------
      // DEVOLVER LOS CILINDROS LLENOS AL INVENTARIO
      // ---------------------------------------------------------

      const nuevaCantidadLlenos =
        stockLleno.cantidad +
        detalle.cantidad;

      await this.databaseService.db.orm.public.Inventario
        .where({
          id: stockLleno.id,
        })
        .update({
          cantidad:
            nuevaCantidadLlenos,
        });

      const movimientoLlenos =
        await this.databaseService.db.orm.public.MovimientoInventario.create(
          {
            productoId:
              detalle.productoId,
            usuarioId,
            tipo: 'AJUSTE',
            estado: 'LLENO',
            cantidad:
              detalle.cantidad,
            motivo:
              `Reversión por anulación de venta #${venta.id}`,
            referencia:
              `ANULACION-VENTA-${venta.id}`,
          },
        );

      movimientosInventario.push(
        movimientoLlenos,
      );

      // ---------------------------------------------------------
      // RESTAR LOS VACÍOS QUE HABÍAN SIDO RECIBIDOS
      // ---------------------------------------------------------

      if (detalle.vaciosRecibidos > 0) {
        const nuevaCantidadVacios =
          stockVacio.cantidad -
          detalle.vaciosRecibidos;

        await this.databaseService.db.orm.public.Inventario
          .where({
            id: stockVacio.id,
          })
          .update({
            cantidad:
              nuevaCantidadVacios,
          });

        const movimientoVacios =
          await this.databaseService.db.orm.public.MovimientoInventario.create(
            {
              productoId:
                detalle.productoId,
              usuarioId,
              tipo: 'AJUSTE',
              estado: 'VACIO',
              cantidad:
                detalle.vaciosRecibidos,
              motivo:
                `Reversión de vacíos por anulación de venta #${venta.id}`,
              referencia:
                `ANULACION-VENTA-${venta.id}`,
            },
          );

        movimientosInventario.push(
          movimientoVacios,
        );
      }
    }

    // =========================================================
    // 7. MARCAR VENTA COMO ANULADA
    // =========================================================

    const ventaAnulada =
      await this.databaseService.db.orm.public.Venta
        .where({
          id: venta.id,
        })
        .update({
          estado: 'ANULADA',
        });

    // =========================================================
    // 8. RESPUESTA
    // =========================================================

    return {
      mensaje:
        'Venta anulada correctamente',
      venta: ventaAnulada,
      movimientosInventario,
    };
  }
}